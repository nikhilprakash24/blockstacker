// Core game state interfaces and types

export type Difficulty = 'easy' | 'normal' | 'arcade';
export type Direction = 'left' | 'right';

export interface Block {
  column: number;           // Grid column position (0-based)
  row: number;             // Grid row position (0-based)
  placed: boolean;         // Is this block placed or moving?
}

export interface GameState {
  // Grid configuration
  gridWidth: number;        // 7 for mobile, 11 for arcade
  gridHeight: number;       // 15 rows

  // Current game
  level: number;            // Current row (1-15)
  blocks: Block[];          // Currently placed blocks
  movingBlocks: Block[];    // Blocks currently oscillating

  // Movement
  oscillationTime: number;  // Current oscillation duration (ms)
  direction: Direction;
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
  difficulty: Difficulty;
}

export interface DifficultyConfig {
  name: string;
  baseSpeed: number;
  speedIncrease: number;
  winWindow: number;
  description: string;
}

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
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
  }
};

// Timing calculations
export function calculateOscillationTime(level: number, difficulty: Difficulty): number {
  const config = DIFFICULTIES[difficulty];
  const baseTime = config.baseSpeed;
  const speedIncrease = config.speedIncrease;
  const speedMultiplier = 1.0 + (level * speedIncrease);

  // Don't go faster than minimum
  const minTime = 400; // 0.4 seconds minimum
  return Math.max(minTime, baseTime / speedMultiplier);
}

export function calculateTimePerColumn(oscillationTime: number, gridWidth: number): number {
  // Full oscillation = left to right to left = 2 * gridWidth movements
  const totalColumns = gridWidth * 2;
  return oscillationTime / totalColumns;
}

// Storage functions
export function saveHighScore(score: number): void {
  const current = loadHighScore();
  if (score > current) {
    localStorage.setItem('carnival_stacker_high_score', score.toString());
  }
}

export function loadHighScore(): number {
  const stored = localStorage.getItem('carnival_stacker_high_score');
  return stored ? parseInt(stored, 10) : 0;
}

// Initialize new game
export function initializeGame(difficulty: Difficulty = 'normal', gridWidth: number = 7): GameState {
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
