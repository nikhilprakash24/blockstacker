import { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, initializeGame, Difficulty, SpawnMode } from './gameState';
import { gameLoop, handleButtonPress } from './gameLoop';
import { render } from './rendering';
import { adService } from './services/adService';
import { AD_SETTINGS } from './config/adConfig';
import './App.css';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>(() => initializeGame('carnivale-30'));
  const [gameStarted, setGameStarted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const animationRef = useRef<number>();
  const gameStateRef = useRef<GameState>(gameState);

  // Keep ref in sync with state
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Initialize AdMob on app start
  useEffect(() => {
    adService.initialize().then(() => {
      console.log('Ad service ready');
      // Preload rewarded ad for later use
      adService.preloadRewarded();
    });

    // Cleanup ads when app unmounts
    return () => {
      adService.cleanup();
    };
  }, []);

  // Show/hide banner ad based on game state
  useEffect(() => {
    if (gameStarted) {
      // Show banner when game is active
      adService.showBanner();
    } else {
      // Hide banner on start screen
      adService.hideBanner();
    }
  }, [gameStarted]);

  // Game loop
  useEffect(() => {
    if (!gameStarted) return;

    function animate() {
      setGameState(prevState => gameLoop(prevState));
      animationRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameStarted]);

  // Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    render(gameState, ctx);
  }, [gameState]);

  // Input handling
  const handleClick = useCallback(() => {
    if (!gameStarted) return;
    setGameState(prevState => handleButtonPress(prevState));
  }, [gameStarted]);

  const handleStartGame = useCallback(() => {
    setGameStarted(true);
    setGameState(initializeGame('carnivale-30'));
  }, []);

  const handleRestart = useCallback((difficulty?: Difficulty, spawnMode?: SpawnMode) => {
    // Check if we should show interstitial ad
    const gamesPlayed = gameState.gamesPlayedSinceAd + 1;
    const shouldShowAd = gamesPlayed >= getRandomAdFrequency();

    if (shouldShowAd) {
      // Show interstitial ad, then restart
      adService.showInterstitial().then((shown) => {
        if (shown) {
          console.log('Interstitial ad shown, resetting counter');
        }
        // Reset regardless of whether ad was shown
        const newState = initializeGame(
          difficulty || gameState.difficulty,
          7,
          spawnMode || gameState.spawnMode
        );
        newState.gamesPlayedSinceAd = 0; // Reset counter
        setGameState(newState);
        setGameStarted(true);
      });
    } else {
      // Just restart, increment counter
      const newState = initializeGame(
        difficulty || gameState.difficulty,
        7,
        spawnMode || gameState.spawnMode
      );
      newState.gamesPlayedSinceAd = gamesPlayed;
      setGameState(newState);
      setGameStarted(true);
    }
  }, [gameState.difficulty, gameState.spawnMode, gameState.gamesPlayedSinceAd]);

  // Helper function to randomize ad frequency (3-5 games)
  const getRandomAdFrequency = () => {
    return Math.floor(
      Math.random() * (AD_SETTINGS.interstitialFrequencyMax - AD_SETTINGS.interstitialFrequencyMin + 1)
    ) + AD_SETTINGS.interstitialFrequencyMin;
  };

  const toggleSpawnMode = useCallback(() => {
    const newSpawnMode: SpawnMode = gameState.spawnMode === 'reset-left' ? 'resume' : 'reset-left';
    setGameState({ ...gameState, spawnMode: newSpawnMode });
  }, [gameState]);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (!gameStarted) return;

    if (e.code === 'Space' && !gameStateRef.current.gameOver) {
      e.preventDefault();
      setGameState(prevState => handleButtonPress(prevState));
    } else if (e.code === 'KeyR') {
      handleRestart();
    }
  }, [gameStarted, handleRestart]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  return (
    <div className="app">
      {!gameStarted ? (
        <div className="start-screen">
          <h1 className="game-title">Block Stacker</h1>
          <h2 className="game-subtitle">Carnivale</h2>

          <div className="start-buttons">
            <button onClick={handleStartGame} className="start-button">
              Start Game
            </button>
            <button onClick={() => setShowSettings(true)} className="settings-button">
              Settings
            </button>
          </div>

          <div className="start-instructions">
            <h3>How to Play</h3>
            <ul>
              <li>Press <strong>SPACE</strong> or click to place blocks</li>
              <li>Align blocks perfectly to keep them all</li>
              <li>Misaligned blocks will be trimmed off</li>
              <li>Reach row 11 for Minor Prize, row 15 for Major Prize</li>
            </ul>
            <p className="settings-hint">💡 Adjust difficulty and spawn mode in Settings</p>
          </div>
        </div>
      ) : (
        <>
          <header>
            <h1>Block Stacker - Carnivale</h1>
          </header>

          <div className="game-layout">
            <div className="game-container">
              <canvas
                ref={canvasRef}
                width={440}
                height={740}
                onClick={handleClick}
                style={{ cursor: gameState.gameOver ? 'default' : 'pointer' }}
              />

              <div className="game-controls">
                <button
                  onClick={handleClick}
                  disabled={gameState.gameOver}
                  className="place-button"
                >
                  PLACE BLOCKS (SPACE)
                </button>

                <div className="control-row">
                  <button onClick={() => handleRestart()} className="control-btn">
                    Restart (R)
                  </button>
                  <button onClick={() => setShowSettings(true)} className="control-btn">
                    ⚙️ Settings
                  </button>
                </div>
              </div>

              {gameState.minorPrizeReached && !gameState.continuedFromMinorPrize && !gameState.won && !gameState.gameOver && (
                <div className="prize-prompt">
                  <h2>Minor Prize Reached!</h2>
                  <p>You can stop here or continue for the Major Prize</p>
                  <p className="cooldown-notice">Game will resume after 1 second cooldown</p>
                  <div className="prize-buttons">
                    <button onClick={() => setGameState({ ...gameState, gameOver: true })}>
                      Stop Here
                    </button>
                    <button onClick={() => setGameState({ ...gameState, continueTime: Date.now(), continuedFromMinorPrize: true })}>
                      Continue
                    </button>
                  </div>

                  {/* Rewarded video ad option */}
                  <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(0, 217, 255, 0.3)' }}>
                    <p style={{ color: '#ffa500', fontSize: '0.9rem', marginBottom: '10px' }}>
                      💡 Watch an ad to continue instantly!
                    </p>
                    <button
                      onClick={async () => {
                        try {
                          const result = await adService.showRewarded();
                          if (result.completed) {
                            // User watched the full ad, let them continue
                            setGameState({
                              ...gameState,
                              continueTime: Date.now(),
                              continuedFromMinorPrize: true
                            });
                          } else {
                            alert('Please watch the full ad to continue playing!');
                          }
                        } catch (error: any) {
                          alert(error.message || 'Ad not available right now. Try again!');
                        }
                      }}
                      className="rewarded-ad-button"
                      style={{
                        background: 'linear-gradient(135deg, #ffa500 0%, #ff8c00 100%)',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        width: '100%',
                      }}
                    >
                      🎬 Watch Ad to Continue
                    </button>
                  </div>
                </div>
              )}

              {gameState.won && (
                <div className="victory-screen">
                  <h1>MAJOR PRIZE WON!</h1>
                  <p className="final-score">Score: {gameState.score}</p>
                  <p>Perfect Placements: {gameState.perfectPlacements}</p>
                  <button onClick={() => handleRestart()}>Play Again</button>
                </div>
              )}

              {gameState.gameOver && !gameState.won && (
                <div className="game-over-screen">
                  <h2>Game Over</h2>
                  <p className="final-score">Final Score: {gameState.score}</p>
                  <p>Level Reached: {gameState.level - 1}/{gameState.majorPrizeRow}</p>
                  {gameState.score === gameState.highScore && gameState.score > 0 && (
                    <p className="new-high-score">NEW HIGH SCORE!</p>
                  )}
                  <button onClick={() => handleRestart()}>Try Again (R)</button>
                </div>
              )}
            </div>

            <div className="score-panel">
              <h3>Score</h3>
              <div className="score-breakdown">
                <div className="score-item">
                  <span>Total:</span> <strong>{gameState.score}</strong>
                </div>
                <div className="score-item">
                  <span>High Score:</span> <strong>{gameState.highScore}</strong>
                </div>
                <div className="score-item">
                  <span>Combo:</span> <strong>{gameState.comboStreak}x</strong>
                </div>
                <div className="score-item">
                  <span>Speed Bonus:</span> <strong>{gameState.totalSpeedBonus}</strong>
                </div>
                <div className="score-item">
                  <span>Perfect Placements:</span> <strong>{gameState.perfectPlacements}</strong>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {showSettings && (
        <div className="settings-modal">
          <div className="settings-content">
            <h2>Settings</h2>

            <div className="setting-group">
              <h3>Difficulty / Speed</h3>
              <div className="difficulty-grid">
                <button onClick={() => { handleRestart('carnivale-30'); setShowSettings(false); }}
                        className={`diff-button carnivale ${gameState.difficulty === 'carnivale-30' ? 'active' : ''}`}>
                  Carnivale -30%
                </button>
                <button onClick={() => { handleRestart('carnivale-25'); setShowSettings(false); }}
                        className={`diff-button carnivale ${gameState.difficulty === 'carnivale-25' ? 'active' : ''}`}>
                  Carnivale -25%
                </button>
                <button onClick={() => { handleRestart('carnivale-20'); setShowSettings(false); }}
                        className={`diff-button carnivale ${gameState.difficulty === 'carnivale-20' ? 'active' : ''}`}>
                  Carnivale -20%
                </button>
                <button onClick={() => { handleRestart('easy'); setShowSettings(false); }}
                        className={`diff-button ${gameState.difficulty === 'easy' ? 'active' : ''}`}>
                  Easy
                </button>
                <button onClick={() => { handleRestart('normal'); setShowSettings(false); }}
                        className={`diff-button ${gameState.difficulty === 'normal' ? 'active' : ''}`}>
                  Normal
                </button>
                <button onClick={() => { handleRestart('arcade'); setShowSettings(false); }}
                        className={`diff-button ${gameState.difficulty === 'arcade' ? 'active' : ''}`}>
                  Arcade
                </button>
              </div>
            </div>

            <div className="setting-group">
              <h3>Spawn Mode</h3>
              <p className="setting-description">Choose how blocks spawn after placement:</p>
              <button onClick={toggleSpawnMode} className="toggle-button">
                {gameState.spawnMode === 'reset-left' ? '⬅️ Reset Left' : '▶️ Resume'}
              </button>
              <p className="setting-hint">
                {gameState.spawnMode === 'reset-left'
                  ? 'Blocks always spawn from the left edge'
                  : 'Blocks continue from where you placed them'}
              </p>
            </div>

            <button onClick={() => setShowSettings(false)} className="close-settings">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
