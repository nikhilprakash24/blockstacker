import { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, initializeGame, Difficulty, SpawnMode } from './gameState';
import { gameLoop, handleButtonPress } from './gameLoop';
import { render } from './rendering';
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
    setGameState(initializeGame(
      difficulty || gameState.difficulty,
      7,
      spawnMode || gameState.spawnMode
    ));
    setGameStarted(true);
  }, [gameState.difficulty, gameState.spawnMode]);

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
