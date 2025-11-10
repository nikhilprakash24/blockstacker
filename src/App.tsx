import { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, initializeGame, Difficulty, SpawnMode, GameMode, MODE_CONFIGS } from './gameState';
import { gameLoop, handleButtonPress } from './gameLoop';
import { render } from './rendering';
import { soundManager } from './soundManager';
import './App.css';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>(() => initializeGame('carnivale-30'));
  const [gameStarted, setGameStarted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showModeSelection, setShowModeSelection] = useState(false);
  const animationRef = useRef<number>();
  const gameStateRef = useRef<GameState>(gameState);

  // Keep ref in sync with state
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Haptic feedback helper (defined early so it can be used in effects)
  const vibrate = useCallback((pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  // Resume audio context on first interaction (click, touch, or keyboard)
  useEffect(() => {
    const resumeAudio = () => {
      soundManager.resumeAudioContext();
      document.removeEventListener('click', resumeAudio);
      document.removeEventListener('touchstart', resumeAudio);
      document.removeEventListener('keydown', resumeAudio);
    };

    document.addEventListener('click', resumeAudio);
    document.addEventListener('touchstart', resumeAudio);
    document.addEventListener('keydown', resumeAudio);

    return () => {
      document.removeEventListener('click', resumeAudio);
      document.removeEventListener('touchstart', resumeAudio);
      document.removeEventListener('keydown', resumeAudio);
    };
  }, []);

  // Sound effects and haptic feedback for game state changes
  const prevGameStateRef = useRef<GameState>(gameState);

  useEffect(() => {
    const prev = prevGameStateRef.current;
    const current = gameState;

    // Game over sound + haptic
    if (!prev.gameOver && current.gameOver && !current.won) {
      soundManager.playGameOver();
      vibrate([100, 50, 100]); // Buzz pattern
    }

    // Victory sound + haptic
    if (!prev.won && current.won) {
      soundManager.playVictory();
      vibrate([50, 50, 50, 50, 200]); // Celebration pattern
    }

    // Combo milestone sounds + haptics
    if (current.comboStreak > prev.comboStreak) {
      if (current.comboStreak === 3 || current.comboStreak === 5 ||
          current.comboStreak === 10 || current.comboStreak >= 15) {
        soundManager.playComboMilestone(current.comboStreak);
        vibrate(30); // Medium buzz
      }
    }

    // Perfect placement sound + heavy haptic
    if (current.perfectPlacements > prev.perfectPlacements) {
      soundManager.playPerfectPlacement();
      vibrate(50); // Heavy impact
    }

    // Level up haptic
    if (current.level > prev.level && !current.gameOver) {
      vibrate(40); // Medium-heavy for level up
    }

    // Block fall sound (when trimmed blocks are created)
    if (current.fallingBlocks.length > prev.fallingBlocks.length) {
      soundManager.playBlockFall();
    }

    prevGameStateRef.current = current;
  }, [gameState, vibrate]);

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

  // Input handling (works for both mouse and touch)
  const handleClick = useCallback(() => {
    if (!gameStarted) return;

    // Light haptic on every tap
    vibrate(10);

    const newState = handleButtonPress(gameState);
    setGameState(newState);

    // Play block placement sound (pitch increases with combo)
    soundManager.playBlockPlace(newState.comboStreak);
  }, [gameStarted, gameState, vibrate]);

  // Touch handler for canvas (prevents default touch behaviors)
  const handleCanvasTouch = useCallback((e: React.TouchEvent) => {
    e.preventDefault(); // Prevent zoom, scroll, etc.
    handleClick();
  }, [handleClick]);

  const handleStartGame = useCallback((mode: GameMode = 'classic') => {
    soundManager.playButtonClick();
    setGameStarted(true);
    setGameState(initializeGame('carnivale-30', 7, 'resume', mode));
    setShowModeSelection(false);
  }, []);

  const handleRestart = useCallback((difficulty?: Difficulty, spawnMode?: SpawnMode) => {
    soundManager.playButtonClick();
    setGameState(initializeGame(
      difficulty || gameState.difficulty,
      7,
      spawnMode || gameState.spawnMode,
      gameState.gameMode // Preserve current game mode
    ));
    setGameStarted(true);
  }, [gameState.difficulty, gameState.spawnMode, gameState.gameMode]);

  const toggleSpawnMode = useCallback(() => {
    soundManager.playSettingsChange();
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

          {!showModeSelection ? (
            <>
              <div className="start-buttons">
                <button onClick={() => setShowModeSelection(true)} className="start-button">
                  Select Game Mode
                </button>
                <button onClick={() => setShowSettings(true)} className="settings-button">
                  Settings
                </button>
              </div>

              <div className="start-instructions">
                <h3>How to Play</h3>
                <ul>
                  <li>Tap screen or press <strong>SPACE</strong> to place blocks</li>
                  <li>Align blocks perfectly to keep them all</li>
                  <li>Misaligned blocks will be trimmed off</li>
                  <li>Choose your game mode and challenge yourself!</li>
                </ul>
                <p className="settings-hint">💡 Adjust difficulty and spawn mode in Settings</p>
              </div>
            </>
          ) : (
            <div className="mode-selection">
              <button onClick={() => setShowModeSelection(false)} className="back-button">
                ← Back
              </button>

              <h2 className="mode-selection-title">Choose Your Mode</h2>

              <div className="mode-grid">
                {(Object.keys(MODE_CONFIGS) as GameMode[]).map((mode) => {
                  const config = MODE_CONFIGS[mode];
                  return (
                    <div
                      key={mode}
                      className="mode-card"
                      onClick={() => handleStartGame(mode)}
                      style={{ borderColor: config.color }}
                    >
                      <div className="mode-icon" style={{ color: config.color }}>
                        {config.icon}
                      </div>
                      <h3 className="mode-name">{config.name}</h3>
                      <p className="mode-description">{config.description}</p>
                      <div className="mode-features">
                        {config.hasTimer && <span className="mode-badge">⏱️ Timed</span>}
                        {config.hasPrizes && <span className="mode-badge">🎁 Prizes</span>}
                        {!config.hasHeightLimit && <span className="mode-badge">∞ Endless</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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
                onTouchStart={handleCanvasTouch}
                style={{
                  cursor: gameState.gameOver ? 'default' : 'pointer',
                  touchAction: 'none' // Prevent default touch behaviors
                }}
              />

              <div className="game-controls">
                <button
                  onClick={handleClick}
                  disabled={gameState.gameOver}
                  className="place-button"
                >
                  PLACE BLOCKS
                </button>

                <div className="control-row">
                  <button onClick={() => handleRestart()} className="control-btn">
                    🔄 Restart
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
                </div>
              )}

              {gameState.won && (
                <div className="victory-screen">
                  <h1>MAJOR PRIZE WON!</h1>
                  <p className="final-score">Score: {Math.floor(gameState.displayScore)}</p>
                  <p>Perfect Placements: {gameState.perfectPlacements}</p>
                  <button onClick={() => handleRestart()}>Play Again</button>
                </div>
              )}

              {gameState.gameOver && !gameState.won && (
                <div
                  className="game-over-overlay"
                  onClick={() => handleRestart()}
                  onTouchStart={(e) => { e.preventDefault(); handleRestart(); }}
                >
                  <div className="game-over-instant">
                    <div className="score-display">
                      <div className="score-number">{Math.floor(gameState.displayScore)}</div>
                      {gameState.score === gameState.highScore && gameState.score > 0 && (
                        <div className="new-best-badge">🏆 NEW BEST</div>
                      )}
                    </div>
                    <div className="level-display">LEVEL {gameState.level - 1}</div>
                    <div className="best-display">BEST: {gameState.highScore}</div>
                    <div className="tap-restart">TAP TO RESTART</div>
                  </div>
                </div>
              )}
            </div>

            <div className="score-panel">
              <h3>Score</h3>
              <div className="score-breakdown">
                <div className="score-item">
                  <span>Total:</span> <strong>{Math.floor(gameState.displayScore)}</strong>
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

            <div className="setting-group">
              <h3>🔊 Sound Effects Volume</h3>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={soundManager.getSFXVolume()}
                onChange={(e) => {
                  soundManager.setSFXVolume(parseFloat(e.target.value));
                  soundManager.playButtonClick(); // Preview sound
                }}
                className="volume-slider"
              />
              <p className="setting-hint">
                {Math.round(soundManager.getSFXVolume() * 100)}%
              </p>
            </div>

            <div className="setting-group">
              <h3>🎵 Music Volume</h3>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={soundManager.getMusicVolume()}
                onChange={(e) => {
                  soundManager.setMusicVolume(parseFloat(e.target.value));
                }}
                className="volume-slider"
              />
              <p className="setting-hint">
                {Math.round(soundManager.getMusicVolume() * 100)}% (Music system coming soon)
              </p>
            </div>

            <button onClick={() => { soundManager.playUISelect(); setShowSettings(false); }} className="close-settings">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
