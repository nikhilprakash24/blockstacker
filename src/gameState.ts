// Core game state interfaces and types

export type Difficulty = 'easy' | 'normal' | 'arcade' | 'carnivale-30' | 'carnivale-25' | 'carnivale-20';
export type Direction = 'left' | 'right';
export type SpawnMode = 'reset-left' | 'resume'; // Reset to left edge vs continue from last position

export interface Block {
  column: number;           // Grid column position (0-based)
  row: number;             // Grid row position (0-based)
  placed: boolean;         // Is this block placed or moving?
}

export interface FallingBlock {
  column: number;           // X position (can be decimal)
  row: number;             // Y position (can be decimal, increases as it falls)
  velocity: number;         // Falling velocity (rows per second)
  opacity: number;          // 0-1 for fade out effect
}

export interface SquashEffect {
  column: number;           // Grid column
  row: number;             // Grid row
  intensity: number;        // 0-1, 1 = maximum squash
  duration: number;         // Remaining duration in ms
}

export interface Particle {
  x: number;                // X position in pixels
  y: number;                // Y position in pixels
  vx: number;               // X velocity in pixels/second
  vy: number;               // Y velocity in pixels/second
  color: string;            // Particle color
  size: number;             // Particle size in pixels
  lifetime: number;         // Remaining lifetime in ms
  maxLifetime: number;      // Original lifetime for fade calculation
}

export interface GameState {
  // Grid configuration
  gridWidth: number;        // 7 for mobile, 11 for arcade
  gridHeight: number;       // 15 rows

  // Current game
  level: number;            // Current row (1-15)
  blocks: Block[];          // Currently placed blocks
  movingBlocks: Block[];    // Blocks currently oscillating
  fallingBlocks: FallingBlock[]; // Blocks falling off (trimmed overhangs)
  squashEffects: SquashEffect[]; // Visual squash effects on block placement
  particles: Particle[];    // Particle effects (bursts, celebrations)

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
  comboStreak: number;        // Current consecutive perfect placements
  totalSpeedBonus: number;    // Accumulated speed bonus points

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
  spawnMode: SpawnMode;       // How blocks spawn after placement
}

export interface DifficultyConfig {
  name: string;
  baseSpeed: number;
  speedIncrease: number;
  winWindow: number;
  alignmentTolerance: number; // How close to column center is acceptable (0.0-0.5)
  scoreMultiplier: number;    // For fair leaderboard comparison across difficulties
  description: string;
}

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  'carnivale-30': {
    name: 'Carnivale -30%',
    baseSpeed: 1950, // 30% slower than easy (1500 * 1.30)
    speedIncrease: 0.10, // Same progression as normal
    winWindow: 20,
    alignmentTolerance: 0.35,
    scoreMultiplier: 0.8, // Slowest = lowest multiplier
    description: 'Testing: 30% slower than Easy mode'
  },
  'carnivale-25': {
    name: 'Carnivale -25%',
    baseSpeed: 1875, // 25% slower than easy (1500 * 1.25)
    speedIncrease: 0.10, // Same progression as normal
    winWindow: 20,
    alignmentTolerance: 0.35,
    scoreMultiplier: 0.85,
    description: 'Testing: 25% slower than Easy mode'
  },
  'carnivale-20': {
    name: 'Carnivale -20%',
    baseSpeed: 1800, // 20% slower than easy (1500 * 1.20)
    speedIncrease: 0.10, // Same progression as normal
    winWindow: 20,
    alignmentTolerance: 0.35,
    scoreMultiplier: 0.9,
    description: 'Testing: 20% slower than Easy mode'
  },
  easy: {
    name: 'Easy Mode',
    baseSpeed: 1500,
    speedIncrease: 0.05,
    winWindow: 50,
    alignmentTolerance: 0.45, // Very forgiving - almost half a block
    scoreMultiplier: 1.0, // Baseline multiplier
    description: 'Forgiving timing, slower progression. Great for learning!'
  },
  normal: {
    name: 'Normal Mode',
    baseSpeed: 1200,
    speedIncrease: 0.10,
    winWindow: 20,
    alignmentTolerance: 0.35, // Moderate tolerance - matches video feel
    scoreMultiplier: 1.2, // Harder than easy
    description: 'Matches the video timing. Standard practice mode.'
  },
  arcade: {
    name: 'Arcade Mode',
    baseSpeed: 1000,
    speedIncrease: 0.15,
    winWindow: 5,
    alignmentTolerance: 0.25, // Strict but fair
    scoreMultiplier: 1.5, // Hardest = highest multiplier
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
export function initializeGame(
  difficulty: Difficulty = 'carnivale-30',
  gridWidth: number = 7,
  spawnMode: SpawnMode = 'resume'
): GameState {
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
    fallingBlocks: [],
    squashEffects: [],
    particles: [],
    oscillationTime: calculateOscillationTime(1, difficulty), // Still use 1 for speed calc
    direction: 'right',
    position: 0,
    lastUpdate: Date.now(),
    pressTime: 0,
    continueTime: 0,
    score: 0,
    highScore: loadHighScore(),
    perfectPlacements: 0,
    comboStreak: 0,
    totalSpeedBonus: 0,
    minorPrizeRow: 10, // Row 10 (11th row from bottom, 0-indexed)
    majorPrizeRow: 14, // Row 14 (15th row from bottom, 0-indexed)
    minorPrizeReached: false,
    continuedFromMinorPrize: false,
    gameOver: false,
    won: false,
    paused: false,
    difficulty: difficulty,
    alignmentTolerance: config.alignmentTolerance,
    spawnMode: spawnMode
  };
}
