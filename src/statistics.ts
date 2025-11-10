// Statistics tracking for Block Stacker
// Tracks per-mode stats: games played, wins, scores, prizes, etc.

import { GameMode } from './gameState';

export interface ModeStatistics {
  gamesPlayed: number;
  gamesWon: number;           // Reached major prize (Classic) or completed session (others)
  bestScore: number;
  totalScore: number;
  averageScore: number;
  perfectPlacements: number;
  totalBlocks: number;

  // Classic mode specific
  minorPrizesWon: number;     // Times reached row 11
  majorPrizesWon: number;     // Times reached row 15

  // Time Attack specific
  bestTime: number | null;    // Best time to reach a score

  // Endless specific
  bestHeight: number;         // Highest row reached

  // Play time
  totalPlaytime: number;      // Total seconds played in this mode
}

export interface GlobalStatistics {
  totalGamesPlayed: number;
  totalPlaytime: number;
  favoriteMode: GameMode | null;
  firstPlayed: string;        // ISO date string
  lastPlayed: string;         // ISO date string
}

export interface GameStatistics {
  classic: ModeStatistics;
  timeAttack: ModeStatistics;
  endless: ModeStatistics;
  challenge: ModeStatistics;
  zen: ModeStatistics;
  global: GlobalStatistics;
}

const STORAGE_KEY = 'blockstacker_statistics';

// Create empty mode statistics
function createEmptyModeStats(): ModeStatistics {
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    bestScore: 0,
    totalScore: 0,
    averageScore: 0,
    perfectPlacements: 0,
    totalBlocks: 0,
    minorPrizesWon: 0,
    majorPrizesWon: 0,
    bestTime: null,
    bestHeight: 0,
    totalPlaytime: 0
  };
}

// Load statistics from localStorage
export function loadStatistics(): GameStatistics {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Ensure all modes exist (for backwards compatibility)
      return {
        classic: parsed.classic || createEmptyModeStats(),
        timeAttack: parsed.timeAttack || createEmptyModeStats(),
        endless: parsed.endless || createEmptyModeStats(),
        challenge: parsed.challenge || createEmptyModeStats(),
        zen: parsed.zen || createEmptyModeStats(),
        global: parsed.global || {
          totalGamesPlayed: 0,
          totalPlaytime: 0,
          favoriteMode: null,
          firstPlayed: new Date().toISOString(),
          lastPlayed: new Date().toISOString()
        }
      };
    }
  } catch (error) {
    console.error('Error loading statistics:', error);
  }

  // Return default empty stats
  return {
    classic: createEmptyModeStats(),
    timeAttack: createEmptyModeStats(),
    endless: createEmptyModeStats(),
    challenge: createEmptyModeStats(),
    zen: createEmptyModeStats(),
    global: {
      totalGamesPlayed: 0,
      totalPlaytime: 0,
      favoriteMode: null,
      firstPlayed: new Date().toISOString(),
      lastPlayed: new Date().toISOString()
    }
  };
}

// Save statistics to localStorage
export function saveStatistics(stats: GameStatistics): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Error saving statistics:', error);
  }
}

// Record a completed game
export function recordGame(
  mode: GameMode,
  score: number,
  won: boolean,
  perfectPlacements: number,
  blocksPlaced: number,
  playtimeSeconds: number,
  minorPrizeReached: boolean = false,
  majorPrizeReached: boolean = false,
  maxHeight: number = 0
): void {
  const stats = loadStatistics();
  const modeStats = stats[mode];

  // Update mode statistics
  modeStats.gamesPlayed++;
  if (won) modeStats.gamesWon++;
  if (score > modeStats.bestScore) modeStats.bestScore = score;
  modeStats.totalScore += score;
  modeStats.averageScore = Math.floor(modeStats.totalScore / modeStats.gamesPlayed);
  modeStats.perfectPlacements += perfectPlacements;
  modeStats.totalBlocks += blocksPlaced;
  modeStats.totalPlaytime += playtimeSeconds;

  // Classic mode specific
  if (mode === 'classic') {
    if (minorPrizeReached) modeStats.minorPrizesWon++;
    if (majorPrizeReached) modeStats.majorPrizesWon++;
  }

  // Endless mode specific
  if (mode === 'endless') {
    if (maxHeight > modeStats.bestHeight) modeStats.bestHeight = maxHeight;
  }

  // Update global statistics
  stats.global.totalGamesPlayed++;
  stats.global.totalPlaytime += playtimeSeconds;
  stats.global.lastPlayed = new Date().toISOString();

  // Determine favorite mode (most played)
  let maxGames = 0;
  let favorite: GameMode | null = null;
  (['classic', 'timeAttack', 'endless', 'challenge', 'zen'] as GameMode[]).forEach(m => {
    if (stats[m].gamesPlayed > maxGames) {
      maxGames = stats[m].gamesPlayed;
      favorite = m;
    }
  });
  stats.global.favoriteMode = favorite;

  saveStatistics(stats);
}

// Reset all statistics
export function resetStatistics(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// Get statistics for a specific mode
export function getModeStatistics(mode: GameMode): ModeStatistics {
  const stats = loadStatistics();
  return stats[mode];
}

// Get global statistics
export function getGlobalStatistics(): GlobalStatistics {
  const stats = loadStatistics();
  return stats.global;
}
