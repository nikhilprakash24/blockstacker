import { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, initializeGame, Difficulty, SpawnMode } from './gameState';
import { gameLoop, handleButtonPress } from './gameLoop';
import { render } from './rendering';
import './App.css';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>(() => initializeGame('carnivale-25'));
  const animationRef = useRef<number>();
  const gameStateRef = useRef<GameState>(gameState);

  // Keep ref in sync with state
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Game loop
  useEffect(() => {
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
  }, []);

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
    setGameState(prevState => handleButtonPress(prevState));
  }, []);

  const handleRestart = useCallback((difficulty?: Difficulty, spawnMode?: SpawnMode) => {
    setGameState(initializeGame(
      difficulty || gameState.difficulty,
      7,
      spawnMode || gameState.spawnMode
    ));
  }, [gameState.difficulty, gameState.spawnMode]);

  const toggleSpawnMode = useCallback(() => {
    const newSpawnMode: SpawnMode = gameState.spawnMode === 'reset-left' ? 'resume' : 'reset-left';
    setGameState({ ...gameState, spawnMode: newSpawnMode });
  }, [gameState]);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space' && !gameStateRef.current.gameOver) {
      e.preventDefault();
      setGameState(prevState => handleButtonPress(prevState));
    } else if (e.code === 'KeyR') {
      handleRestart();
    }
  }, [handleRestart]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  return (
    <div className="app">
      <header>
        <h1>Carnival Block Stacker</h1>
      </header>

      <div className="game-container">
        <canvas
          ref={canvasRef}
          width={440}
          height={740}
          onClick={handleClick}
          style={{ cursor: gameState.gameOver ? 'default' : 'pointer' }}
        />

        <div className="controls">
          <button
            onClick={handleClick}
            disabled={gameState.gameOver}
            className="place-button"
          >
            PLACE BLOCKS (SPACE)
          </button>

          <div className="difficulty-buttons">
            <button onClick={() => handleRestart('carnivale-30')} className="diff-button carnivale">
              Carnivale -30%
            </button>
            <button onClick={() => handleRestart('carnivale-25')} className="diff-button carnivale">
              Carnivale -25%
            </button>
            <button onClick={() => handleRestart('carnivale-20')} className="diff-button carnivale">
              Carnivale -20%
            </button>
          </div>
          <div className="difficulty-buttons">
            <button onClick={() => handleRestart('easy')} className="diff-button">
              Easy
            </button>
            <button onClick={() => handleRestart('normal')} className="diff-button">
              Normal
            </button>
            <button onClick={() => handleRestart('arcade')} className="diff-button">
              Arcade
            </button>
          </div>

          <div className="spawn-mode-toggle">
            <label>
              <strong>Spawn Mode:</strong>
            </label>
            <button onClick={toggleSpawnMode} className="toggle-button">
              {gameState.spawnMode === 'reset-left' ? '⬅️ Reset Left' : '▶️ Resume'}
            </button>
          </div>

          <div className="score-breakdown">
            <div className="score-item">
              <span>Score:</span> <strong>{gameState.score}</strong>
            </div>
            <div className="score-item">
              <span>Combo:</span> <strong>{gameState.comboStreak}x</strong>
            </div>
            <div className="score-item">
              <span>Speed Bonus:</span> <strong>{gameState.totalSpeedBonus}</strong>
            </div>
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

      <div className="instructions">
        <h3>How to Play</h3>
        <ul>
          <li>Press SPACE or click to place blocks</li>
          <li>Align blocks perfectly to keep them all</li>
          <li>Misaligned blocks will be trimmed off</li>
          <li>Reach row 11 for Minor Prize, row 15 for Major Prize</li>
          <li>Press R to restart</li>
        </ul>
      </div>
    </div>
  );
}

export default App;
