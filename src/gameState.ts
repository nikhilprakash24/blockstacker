// Core game state interfaces and types

export type Difficulty = 'easy' | 'normal' | 'arcade' | 'carnivale-30' | 'carnivale-25' | 'carnivale-20';
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
  continueTime: number;     // When continue was pressed from prize screen

  // Scoring
  score: number;
  highScore: number;
  perfectPlacements: number;

  // Prize system
  minorPrizeRow: number;    // 11
  majorPrizeRow: number;    // 15
  minorPrizeReached: boolean;
  continuedFromMinorPrize: boolean; // User chose to continue after reaching minor prize

  // Game status
  gameOver: boolean;
  won: boolean;
  paused: boolean;
  difficulty: Difficulty;
  alignmentTolerance: number; // How close blocks need to be to align (0.0-0.5)
}

export interface DifficultyConfig {
  name: string;
  baseSpeed: number;
  speedIncrease: number;
  winWindow: number;
  alignmentTolerance: number; // How close to column center is acceptable (0.0-0.5)
  description: string;
}

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  'carnivale-30': {
    name: 'Carnivale -30%',
    baseSpeed: 1560, // 30% slower than normal (1200 * 1.30)
    speedIncrease: 0.10, // Same progression as normal
    winWindow: 20,
    alignmentTolerance: 0.35,
    description: 'Testing: 30% slower start, same progression'
  },
  'carnivale-25': {
    name: 'Carnivale -25%',
    baseSpeed: 1500, // 25% slower than normal (1200 * 1.25)
    speedIncrease: 0.10, // Same progression as normal
    winWindow: 20,
    alignmentTolerance: 0.35,
    description: 'Testing: 25% slower start, same progression'
  },
  'carnivale-20': {
    name: 'Carnivale -20%',
    baseSpeed: 1440, // 20% slower than normal (1200 * 1.20)
    speedIncrease: 0.10, // Same progression as normal
    winWindow: 20,
    alignmentTolerance: 0.35,
    description: 'Testing: 20% slower start, same progression'
  },
  easy: {
    name: 'Easy Mode',
    baseSpeed: 1500,
    speedIncrease: 0.05,
    winWindow: 50,
    alignmentTolerance: 0.45, // Very forgiving - almost half a block
    description: 'Forgiving timing, slower progression. Great for learning!'
  },
  normal: {
    name: 'Normal Mode',
    baseSpeed: 1200,
    speedIncrease: 0.10,
    winWindow: 20,
    alignmentTolerance: 0.35, // Moderate tolerance - matches video feel
    description: 'Matches the video timing. Standard practice mode.'
  },
  arcade: {
    name: 'Arcade Mode',
    baseSpeed: 1000,
    speedIncrease: 0.15,
    winWindow: 5,
    alignmentTolerance: 0.25, // Strict but fair
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
export function initializeGame(difficulty: Difficulty = 'carnivale-25', gridWidth: number = 7): GameState {
  // Start at row 0 (bottom of grid), level 0
  const initialMovingBlocks: Block[] = [
    { column: 0, row: 0, placed: false },
    { column: 1, row: 0, placed: false },
    { column: 2, row: 0, placed: false }
  ];

  const config = DIFFICULTIES[difficulty];

  return {
    gridWidth: gridWidth,
    gridHeight: 15,
    level: 0, // Start at level 0 (row 0 = bottom)
    blocks: [],
    movingBlocks: initialMovingBlocks,
    oscillationTime: calculateOscillationTime(1, difficulty), // Still use 1 for speed calc
    direction: 'right',
    position: 0,
    lastUpdate: Date.now(),
    pressTime: 0,
    continueTime: 0,
    score: 0,
    highScore: loadHighScore(),
    perfectPlacements: 0,
    minorPrizeRow: 10, // Row 10 (11th row from bottom, 0-indexed)
    majorPrizeRow: 14, // Row 14 (15th row from bottom, 0-indexed)
    minorPrizeReached: false,
    continuedFromMinorPrize: false,
    gameOver: false,
    won: false,
    paused: false,
    difficulty: difficulty,
    alignmentTolerance: config.alignmentTolerance
  };
}
