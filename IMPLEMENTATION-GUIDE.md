# Carnival Block Stacker - Technical Implementation Guide

## Quick Start for Claude CLI

This document provides **executable specifications** and **code examples** for implementing the carnival block stacker simulation. Use this as your development reference alongside the project specification.

---

## Core Game State

### State Structure
```typescript
interface GameState {
  // Grid configuration
  gridWidth: number;        // 7 for mobile, 11 for arcade
  gridHeight: number;       // 15 rows
  
  // Current game
  level: number;            // Current row (1-15)
  blocks: Block[];          // Currently placed blocks
  movingBlocks: Block[];    // Blocks currently oscillating
  
  // Movement
  oscillationTime: number;  // Current oscillation duration (ms)
  direction: 'left' | 'right';
  position: number;         // Current column position (0 to gridWidth-1)
  
  // Timing
  lastUpdate: number;       // Timestamp of last frame
  pressTime: number;        // When button was pressed
  
  // Scoring
  score: number;
  highScore: number;
  perfectPlacements: number;
  
  // Prize system
  minorPrizeRow: number;    // 11
  majorPrizeRow: number;    // 15
  minorPrizeReached: boolean;
  
  // Game status
  gameOver: boolean;
  won: boolean;
  paused: boolean;
}

interface Block {
  column: number;           // Grid column position (0-based)
  row: number;             // Grid row position (0-based)
  placed: boolean;         // Is this block placed or moving?
}
```

---

## Timing System

### Oscillation Speed Calculator
```typescript
function calculateOscillationTime(level: number, difficulty: 'easy' | 'normal' | 'arcade'): number {
  const baseTimes = {
    easy: 1500,    // 1.5 seconds
    normal: 1200,  // 1.2 seconds (matches video)
    arcade: 1000   // 1.0 seconds
  };
  
  const speedIncreases = {
    easy: 0.05,     // Gentler progression
    normal: 0.10,   // Standard (10% per level)
    arcade: 0.15    // Aggressive
  };
  
  const baseTime = baseTimes[difficulty];
  const speedIncrease = speedIncreases[difficulty];
  const speedMultiplier = 1.0 + (level * speedIncrease);
  
  // Don't go faster than minimum
  const minTime = 400; // 0.4 seconds minimum
  return Math.max(minTime, baseTime / speedMultiplier);
}

// Example usage:
// Level 1, Normal: calculateOscillationTime(1, 'normal') = 1091ms
// Level 5, Normal: calculateOscillationTime(5, 'normal') = 800ms
// Level 10, Normal: calculateOscillationTime(10, 'normal') = 600ms
// Level 15, Normal: calculateOscillationTime(15, 'normal') = 480ms
```

### Time Per Column
```typescript
function calculateTimePerColumn(oscillationTime: number, gridWidth: number): number {
  // Full oscillation = left to right to left = 2 * gridWidth movements
  const totalColumns = gridWidth * 2;
  return oscillationTime / totalColumns;
}

// Example:
// 1200ms oscillation, 7 columns = 1200 / 14 = ~85.7ms per column
```

---

## Movement System

### Position Update (Smooth Movement)
```typescript
function updatePosition(state: GameState, deltaTime: number): GameState {
  const timePerColumn = calculateTimePerColumn(state.oscillationTime, state.gridWidth);
  const columnsMoved = deltaTime / timePerColumn;
  
  let newPosition = state.position;
  let newDirection = state.direction;
  
  if (state.direction === 'right') {
    newPosition += columnsMoved;
    
    // Reached right edge, reverse
    if (newPosition >= state.gridWidth - 1) {
      newPosition = state.gridWidth - 1 - (newPosition - (state.gridWidth - 1));
      newDirection = 'left';
    }
  } else {
    newPosition -= columnsMoved;
    
    // Reached left edge, reverse
    if (newPosition < 0) {
      newPosition = Math.abs(newPosition);
      newDirection = 'right';
    }
  }
  
  return {
    ...state,
    position: newPosition,
    direction: newDirection
  };
}
```

### Position Update (Discrete LED-Style)
```typescript
function updatePositionDiscrete(state: GameState, currentTime: number): GameState {
  const timeSinceLastMove = currentTime - state.lastUpdate;
  const timePerColumn = calculateTimePerColumn(state.oscillationTime, state.gridWidth);
  
  // Only move if enough time has passed for one column
  if (timeSinceLastMove < timePerColumn) {
    return state;
  }
  
  let newPosition = state.position;
  let newDirection = state.direction;
  
  // Move one discrete column
  if (state.direction === 'right') {
    newPosition += 1;
    if (newPosition >= state.gridWidth) {
      newPosition = state.gridWidth - 1;
      newDirection = 'left';
    }
  } else {
    newPosition -= 1;
    if (newPosition < 0) {
      newPosition = 0;
      newDirection = 'right';
    }
  }
  
  return {
    ...state,
    position: newPosition,
    direction: newDirection,
    lastUpdate: currentTime
  };
}
```

---

## Block Placement System

### Alignment Check
```typescript
function checkAlignment(movingBlocks: Block[], placedBlocks: Block[], currentRow: number): {
  aligned: Block[],
  trimmed: Block[]
} {
  // Get all blocks in the row below (the base for alignment)
  const baseBlocks = placedBlocks.filter(b => b.row === currentRow - 1);
  
  // If first row (no base blocks), all moving blocks are aligned
  if (baseBlocks.length === 0) {
    return {
      aligned: movingBlocks.map(b => ({ ...b, placed: true, row: currentRow })),
      trimmed: []
    };
  }
  
  // Check which moving blocks align with base blocks
  const aligned: Block[] = [];
  const trimmed: Block[] = [];
  
  movingBlocks.forEach(movingBlock => {
    const isAligned = baseBlocks.some(baseBlock => 
      baseBlock.column === movingBlock.column
    );
    
    if (isAligned) {
      aligned.push({ ...movingBlock, placed: true, row: currentRow });
    } else {
      trimmed.push(movingBlock);
    }
  });
  
  return { aligned, trimmed };
}
```

### Place Blocks
```typescript
function placeBlocks(state: GameState): GameState {
  const currentRow = state.level;
  
  // Convert moving blocks positions to block objects
  const movingBlocksAtCurrentPosition = state.movingBlocks.map(mb => ({
    column: Math.round(state.position) + mb.column, // Offset by block position
    row: currentRow,
    placed: false
  }));
  
  // Check alignment with blocks below
  const { aligned, trimmed } = checkAlignment(
    movingBlocksAtCurrentPosition,
    state.blocks,
    currentRow
  );
  
  // Game over if no blocks aligned
  if (aligned.length === 0) {
    return {
      ...state,
      gameOver: true,
      movingBlocks: []
    };
  }
  
  // Add aligned blocks to placed blocks
  const newBlocks = [...state.blocks, ...aligned];
  
  // Check for win conditions
  const minorPrizeReached = currentRow === state.minorPrizeRow;
  const won = currentRow === state.majorPrizeRow;
  
  // Create new moving blocks for next level (unless game won)
  let newMovingBlocks: Block[] = [];
  if (!won) {
    newMovingBlocks = aligned.map(b => ({
      column: b.column - Math.min(...aligned.map(ab => ab.column)), // Normalize to start at 0
      row: currentRow + 1,
      placed: false
    }));
  }
  
  return {
    ...state,
    blocks: newBlocks,
    movingBlocks: newMovingBlocks,
    level: currentRow + 1,
    score: state.score + (aligned.length * 10 * currentRow), // Higher levels = more points
    perfectPlacements: aligned.length === state.movingBlocks.length ? 
      state.perfectPlacements + 1 : state.perfectPlacements,
    minorPrizeReached: minorPrizeReached || state.minorPrizeReached,
    won: won,
    gameOver: won,
    oscillationTime: calculateOscillationTime(currentRow + 1, state.difficulty)
  };
}
```

---

## Initialization

### Start New Game
```typescript
function initializeGame(difficulty: 'easy' | 'normal' | 'arcade', gridWidth: number = 7): GameState {
  const initialMovingBlocks: Block[] = [
    { column: 0, row: 1, placed: false },
    { column: 1, row: 1, placed: false },
    { column: 2, row: 1, placed: false }
  ];
  
  return {
    gridWidth: gridWidth,
    gridHeight: 15,
    level: 1,
    blocks: [],
    movingBlocks: initialMovingBlocks,
    oscillationTime: calculateOscillationTime(1, difficulty),
    direction: 'right',
    position: 0,
    lastUpdate: Date.now(),
    pressTime: 0,
    score: 0,
    highScore: loadHighScore(),
    perfectPlacements: 0,
    minorPrizeRow: 11,
    majorPrizeRow: 15,
    minorPrizeReached: false,
    gameOver: false,
    won: false,
    paused: false,
    difficulty: difficulty
  };
}
```

---

## Game Loop

### Main Update Function
```typescript
function gameLoop(state: GameState): GameState {
  if (state.gameOver || state.paused) {
    return state;
  }
  
  const currentTime = Date.now();
  const deltaTime = currentTime - state.lastUpdate;
  
  // Update block position based on movement type
  const updatedState = updatePosition(state, deltaTime);
  // OR for discrete: updatePositionDiscrete(state, currentTime);
  
  return {
    ...updatedState,
    lastUpdate: currentTime
  };
}

// Call this in requestAnimationFrame:
function animate() {
  gameState = gameLoop(gameState);
  render(gameState);
  requestAnimationFrame(animate);
}
```

### Input Handling
```typescript
function handleButtonPress(state: GameState): GameState {
  if (state.gameOver || state.paused) {
    return state;
  }
  
  // Record press time for analytics
  const pressTime = Date.now();
  
  // Freeze blocks and check placement
  const newState = placeBlocks({
    ...state,
    pressTime: pressTime
  });
  
  // Track timing analytics
  trackTiming(state, pressTime);
  
  return newState;
}

function trackTiming(state: GameState, pressTime: number) {
  // Calculate how far from perfect alignment
  const perfectColumn = Math.round(state.position);
  const actualColumn = state.position;
  const timingError = Math.abs(perfectColumn - actualColumn);
  
  // Store for analytics
  analytics.recordPress({
    level: state.level,
    timingError: timingError,
    pressTime: pressTime,
    success: timingError < 0.3 // Within 30% of column width
  });
}
```

---

## Rendering

### Canvas Rendering
```typescript
function render(state: GameState, ctx: CanvasRenderingContext2D) {
  const cellSize = 40; // pixels
  const gridMargin = 20;
  
  // Clear canvas
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  // Draw grid
  drawGrid(ctx, state, cellSize, gridMargin);
  
  // Draw placed blocks
  state.blocks.forEach(block => {
    drawBlock(ctx, block, cellSize, gridMargin, '#00d9ff');
  });
  
  // Draw moving blocks
  state.movingBlocks.forEach((block, index) => {
    const x = state.position + index;
    drawBlockAt(ctx, x, state.level, cellSize, gridMargin, '#00ffff');
  });
  
  // Draw prize indicators
  drawPrizeIndicator(ctx, state, cellSize, gridMargin);
  
  // Draw UI
  drawScore(ctx, state);
}

function drawGrid(ctx: CanvasRenderingContext2D, state: GameState, cellSize: number, margin: number) {
  ctx.strokeStyle = '#4a7ba7';
  ctx.lineWidth = 1;
  
  for (let row = 0; row < state.gridHeight; row++) {
    for (let col = 0; col < state.gridWidth; col++) {
      const x = margin + col * cellSize;
      const y = margin + (state.gridHeight - row - 1) * cellSize; // Invert Y for bottom-up
      
      ctx.strokeRect(x, y, cellSize, cellSize);
    }
  }
}

function drawBlock(ctx: CanvasRenderingContext2D, block: Block, cellSize: number, margin: number, color: string) {
  const x = margin + block.column * cellSize;
  const y = margin + (14 - block.row) * cellSize; // gridHeight - 1 - row for bottom-up
  
  ctx.fillStyle = color;
  ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
}

function drawBlockAt(ctx: CanvasRenderingContext2D, position: number, row: number, cellSize: number, margin: number, color: string) {
  const x = margin + position * cellSize;
  const y = margin + (14 - row) * cellSize;
  
  ctx.fillStyle = color;
  ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
  
  // Add glow effect for moving blocks
  ctx.shadowBlur = 10;
  ctx.shadowColor = color;
  ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
  ctx.shadowBlur = 0;
}

function drawPrizeIndicator(ctx: CanvasRenderingContext2D, state: GameState, cellSize: number, margin: number) {
  // Minor prize
  const minorY = margin + (14 - state.minorPrizeRow) * cellSize;
  ctx.fillStyle = state.minorPrizeReached ? '#00ffff' : '#4a7ba7';
  ctx.fillText('MINOR PRIZE', margin - 100, minorY + cellSize/2);
  
  // Major prize  
  const majorY = margin + (14 - state.majorPrizeRow) * cellSize;
  ctx.fillStyle = state.level >= state.majorPrizeRow ? '#ffd700' : '#4a7ba7';
  ctx.fillText('MAJOR PRIZE', margin - 100, majorY + cellSize/2);
}

function drawScore(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.fillStyle = '#ffffff';
  ctx.font = '24px Arial';
  ctx.fillText(`Score: ${state.score}`, 20, 30);
  ctx.fillText(`Level: ${state.level}`, 20, 60);
  ctx.fillText(`Best: ${state.highScore}`, 20, 90);
}
```

---

## Difficulty Configurations

### Complete Difficulty Settings
```typescript
interface DifficultyConfig {
  name: string;
  baseSpeed: number;
  speedIncrease: number;
  winWindow: number;
  description: string;
}

const DIFFICULTIES: Record<string, DifficultyConfig> = {
  easy: {
    name: 'Easy Mode',
    baseSpeed: 1500,
    speedIncrease: 0.05,
    winWindow: 50,
    description: 'Forgiving timing, slower progression. Great for learning!'
  },
  normal: {
    name: 'Normal Mode',
    baseSpeed: 1200,
    speedIncrease: 0.10,
    winWindow: 20,
    description: 'Matches the video timing. Standard practice mode.'
  },
  arcade: {
    name: 'Arcade Mode',
    baseSpeed: 1000,
    speedIncrease: 0.15,
    winWindow: 5,
    description: 'Challenging! Fast start with aggressive progression.'
  },
  rigged: {
    name: 'Rigged Arcade',
    baseSpeed: 1000,
    speedIncrease: 0.15,
    winWindow: 1, // Variable: 1-20ms
    description: 'Educational: Shows how real arcades manipulate difficulty.'
  }
};
```

---

## Analytics System

### Tracking Performance
```typescript
interface Analytics {
  session: {
    startTime: number;
    gamesPlayed: number;
    totalScore: number;
  };
  
  lifetime: {
    gamesPlayed: number;
    highestLevel: number;
    perfectPlacements: number;
    minorPrizesWon: number;
    majorPrizesWon: number;
  };
  
  timing: {
    reactionTimes: number[];
    earlyPresses: number;
    latePresses: number;
    perfectPresses: number;
  };
}

function recordGameEnd(state: GameState, analytics: Analytics): Analytics {
  return {
    ...analytics,
    session: {
      ...analytics.session,
      gamesPlayed: analytics.session.gamesPlayed + 1,
      totalScore: analytics.session.totalScore + state.score
    },
    lifetime: {
      ...analytics.lifetime,
      gamesPlayed: analytics.lifetime.gamesPlayed + 1,
      highestLevel: Math.max(analytics.lifetime.highestLevel, state.level),
      perfectPlacements: analytics.lifetime.perfectPlacements + state.perfectPlacements,
      minorPrizesWon: analytics.lifetime.minorPrizesWon + (state.minorPrizeReached ? 1 : 0),
      majorPrizesWon: analytics.lifetime.majorPrizesWon + (state.won ? 1 : 0)
    }
  };
}

function getImprovementTrend(analytics: Analytics): {
  improving: boolean;
  trend: number;
  recommendation: string;
} {
  // Analyze last 10 games
  const recentGames = analytics.session.gamesPlayed;
  const recentScore = analytics.session.totalScore;
  const averageScore = recentScore / recentGames;
  
  // Compare to lifetime average
  const lifetimeAverage = analytics.lifetime.totalScore / analytics.lifetime.gamesPlayed;
  
  const improving = averageScore > lifetimeAverage;
  const trend = ((averageScore - lifetimeAverage) / lifetimeAverage) * 100;
  
  let recommendation = '';
  if (trend > 20) {
    recommendation = "You're improving rapidly! Consider trying the next difficulty.";
  } else if (trend > 0) {
    recommendation = "Steady progress! Keep practicing for consistency.";
  } else if (trend > -20) {
    recommendation = "Your performance is stable. Focus on timing precision.";
  } else {
    recommendation = "Consider practicing at an easier difficulty to rebuild confidence.";
  }
  
  return { improving, trend, recommendation };
}
```

---

## Testing Utilities

### Test Game State
```typescript
function createTestState(overrides: Partial<GameState> = {}): GameState {
  const defaultState = initializeGame('normal');
  return {
    ...defaultState,
    ...overrides
  };
}

// Example tests:
function testAlignment() {
  const state = createTestState({
    level: 5,
    blocks: [
      { column: 2, row: 4, placed: true },
      { column: 3, row: 4, placed: true },
      { column: 4, row: 4, placed: true }
    ],
    movingBlocks: [
      { column: 0, row: 5, placed: false },
      { column: 1, row: 5, placed: false },
      { column: 2, row: 5, placed: false }
    ],
    position: 2 // Aligned with columns 2, 3, 4
  });
  
  const result = placeBlocks(state);
  
  console.assert(result.blocks.length === 4, 'Should have 4 placed blocks (3 base + 1 aligned)');
  console.assert(result.movingBlocks.length === 1, 'Should have 1 moving block for next level');
  console.log('✓ Alignment test passed');
}

function testSpeedProgression() {
  for (let level = 1; level <= 15; level++) {
    const time = calculateOscillationTime(level, 'normal');
    console.log(`Level ${level}: ${time}ms`);
  }
  
  const level1 = calculateOscillationTime(1, 'normal');
  const level15 = calculateOscillationTime(15, 'normal');
  
  console.assert(level15 < level1, 'Level 15 should be faster than level 1');
  console.assert(level15 >= 400, 'Should not go below 400ms minimum');
  console.log('✓ Speed progression test passed');
}
```

---

## Storage System

### Save/Load High Score
```typescript
function saveHighScore(score: number): void {
  const current = loadHighScore();
  if (score > current) {
    localStorage.setItem('carnival_stacker_high_score', score.toString());
  }
}

function loadHighScore(): number {
  const stored = localStorage.getItem('carnival_stacker_high_score');
  return stored ? parseInt(stored, 10) : 0;
}

function saveAnalytics(analytics: Analytics): void {
  localStorage.setItem('carnival_stacker_analytics', JSON.stringify(analytics));
}

function loadAnalytics(): Analytics {
  const stored = localStorage.getItem('carnival_stacker_analytics');
  if (stored) {
    return JSON.parse(stored);
  }
  
  return {
    session: { startTime: Date.now(), gamesPlayed: 0, totalScore: 0 },
    lifetime: { gamesPlayed: 0, highestLevel: 0, perfectPlacements: 0, minorPrizesWon: 0, majorPrizesWon: 0 },
    timing: { reactionTimes: [], earlyPresses: 0, latePresses: 0, perfectPresses: 0 }
  };
}
```

---

## Audio System

### Sound Effects Manager
```typescript
class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private enabled: boolean = true;
  
  constructor() {
    this.loadSounds();
  }
  
  private loadSounds() {
    const soundFiles = {
      'button_press': '/sounds/button.mp3',
      'block_place': '/sounds/place.mp3',
      'block_trim': '/sounds/trim.mp3',
      'perfect': '/sounds/perfect.mp3',
      'game_over': '/sounds/gameover.mp3',
      'minor_prize': '/sounds/minor.mp3',
      'major_prize': '/sounds/major.mp3'
    };
    
    Object.entries(soundFiles).forEach(([name, path]) => {
      const audio = new Audio(path);
      audio.preload = 'auto';
      this.sounds.set(name, audio);
    });
  }
  
  play(soundName: string) {
    if (!this.enabled) return;
    
    const sound = this.sounds.get(soundName);
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(e => console.warn('Audio play failed:', e));
    }
  }
  
  toggle() {
    this.enabled = !this.enabled;
  }
}

// Usage:
const soundManager = new SoundManager();

function handleButtonPress(state: GameState): GameState {
  soundManager.play('button_press');
  
  const newState = placeBlocks(state);
  
  if (newState.gameOver) {
    soundManager.play('game_over');
  } else if (newState.perfectPlacements > state.perfectPlacements) {
    soundManager.play('perfect');
  } else {
    soundManager.play('block_place');
  }
  
  return newState;
}
```

---

## React Implementation Example

### Main Component Structure
```typescript
import React, { useEffect, useRef, useState } from 'react';

function CarnivalStacker() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>(() => initializeGame('normal'));
  const animationRef = useRef<number>();
  
  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
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
  const handleClick = () => {
    setGameState(prevState => handleButtonPress(prevState));
  };
  
  const handleRestart = () => {
    setGameState(initializeGame(gameState.difficulty));
  };
  
  return (
    <div className="carnival-stacker">
      <canvas 
        ref={canvasRef}
        width={400}
        height={700}
        onClick={handleClick}
      />
      
      <div className="controls">
        <button onClick={handleClick} disabled={gameState.gameOver}>
          PLACE BLOCKS
        </button>
        <button onClick={handleRestart}>
          NEW GAME
        </button>
      </div>
      
      {gameState.minorPrizeReached && !gameState.won && (
        <div className="minor-prize-prompt">
          <h2>Minor Prize Reached!</h2>
          <button onClick={() => setGameState({...gameState, gameOver: true})}>
            Stop Here
          </button>
          <button onClick={handleClick}>
            Continue for Major Prize
          </button>
        </div>
      )}
      
      {gameState.won && (
        <div className="victory-screen">
          <h1>MAJOR PRIZE WON!</h1>
          <p>Score: {gameState.score}</p>
          <button onClick={handleRestart}>Play Again</button>
        </div>
      )}
    </div>
  );
}
```

---

## Deployment Checklist

### Pre-Launch
- [ ] Test all three difficulty modes
- [ ] Verify timing matches video analysis
- [ ] Test on mobile devices (touch input)
- [ ] Test on desktop (click input)
- [ ] Verify audio works (with fallback if blocked)
- [ ] Test localStorage persistence
- [ ] Verify responsive design
- [ ] Test offline functionality (PWA)

### Performance
- [ ] Maintain 60fps consistently
- [ ] No memory leaks during extended play
- [ ] Fast load time (<2 seconds)
- [ ] Smooth animations
- [ ] Immediate button response

### User Experience
- [ ] Clear tutorial/instructions
- [ ] Obvious visual feedback
- [ ] Accessible controls
- [ ] Clear win/loss conditions
- [ ] Satisfying audio feedback

---

## Quick Commands for Claude CLI

### To create the game structure:
```bash
# Create project structure
mkdir -p carnival-stacker/{src,public,sounds}
cd carnival-stacker

# Initialize with Vite + TypeScript
npm create vite@latest . -- --template react-ts
npm install

# Create game files
touch src/gameState.ts
touch src/gameLoop.ts
touch src/rendering.ts
touch src/analytics.ts
```

### To reference this document:
```bash
# This file contains all implementation details
# Use it for: timing calculations, state management, 
# rendering logic, and testing utilities
```

---

## Critical Implementation Notes

### Must-Have Features (MVP)
1. ✅ Exactly 3 starting blocks
2. ✅ Horizontal oscillation only
3. ✅ Block trimming on misalignment
4. ✅ Progressive speed increase (10% per level)
5. ✅ Immediate button response
6. ✅ Clear visual feedback

### Nice-to-Have Features (Post-MVP)
- Multiple difficulty modes
- Detailed analytics dashboard
- Replay system
- Multiplayer comparison
- Achievement system
- Daily challenges

### Don't Forget
- Save high score locally
- Track improvement metrics
- Provide clear feedback on timing
- Make easy mode actually easy
- Test on real mobile devices
- Optimize for 60fps
- Handle edge cases (perfect alignment, complete miss)

---

## Final Implementation Flow

1. **Initialize game state** with 3 blocks at level 1
2. **Start game loop** using requestAnimationFrame
3. **Update position** based on oscillation timing
4. **Render current state** to canvas every frame
5. **On button press** freeze blocks and check alignment
6. **Place aligned blocks** and create new moving blocks
7. **Increase speed** for next level
8. **Check win conditions** (minor/major prize)
9. **Repeat** until game over or victory

**You now have everything needed to implement the carnival block stacker!** 🚀
