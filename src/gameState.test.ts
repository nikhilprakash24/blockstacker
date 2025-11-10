import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  initializeGame,
  calculateOscillationTime,
  calculateTimePerColumn,
  saveHighScore,
  loadHighScore,
  DIFFICULTIES,
} from './gameState';

describe('GameState', () => {
  // Clean up localStorage before and after tests
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('initializeGame', () => {
    it('should initialize game with correct defaults for normal difficulty', () => {
      const state = initializeGame('normal');

      expect(state.gridWidth).toBe(7);
      expect(state.gridHeight).toBe(15);
      expect(state.level).toBe(0); // Now starts at level 0
      expect(state.blocks).toEqual([]);
      expect(state.movingBlocks).toHaveLength(3);
      expect(state.direction).toBe('right');
      expect(state.position).toBe(0);
      expect(state.score).toBe(0);
      expect(state.perfectPlacements).toBe(0);
      expect(state.minorPrizeRow).toBe(10); // Row 10 (0-indexed)
      expect(state.majorPrizeRow).toBe(14); // Row 14 (0-indexed)
      expect(state.minorPrizeReached).toBe(false);
      expect(state.gameOver).toBe(false);
      expect(state.won).toBe(false);
      expect(state.paused).toBe(false);
      expect(state.difficulty).toBe('normal');
      expect(state.alignmentTolerance).toBe(0.35);
    });

    it('should initialize with 3 moving blocks in correct positions', () => {
      const state = initializeGame('normal');

      expect(state.movingBlocks).toEqual([
        { column: 0, row: 0, placed: false }, // Start at row 0
        { column: 1, row: 0, placed: false },
        { column: 2, row: 0, placed: false },
      ]);
    });

    it('should initialize moving blocks on row 0 (matching level 0)', () => {
      const state = initializeGame('normal');

      expect(state.level).toBe(0); // Start at level 0
      state.movingBlocks.forEach(block => {
        expect(block.row).toBe(0); // Start at row 0
      });
    });

    it('should support custom grid width', () => {
      const state = initializeGame('normal', 11);

      expect(state.gridWidth).toBe(11);
    });

    it('should set correct oscillation time based on difficulty', () => {
      const easy = initializeGame('easy');
      const normal = initializeGame('normal');
      const arcade = initializeGame('arcade');

      expect(easy.oscillationTime).toBe(calculateOscillationTime(1, 'easy'));
      expect(normal.oscillationTime).toBe(calculateOscillationTime(1, 'normal'));
      expect(arcade.oscillationTime).toBe(calculateOscillationTime(1, 'arcade'));
    });
  });

  describe('calculateOscillationTime', () => {
    it('should calculate correct oscillation time for level 1 normal', () => {
      const time = calculateOscillationTime(1, 'normal');
      // Level 1, normal: baseTime (1200) / (1.0 + 1 * 0.1) = 1200 / 1.1 ≈ 1091ms
      expect(time).toBeCloseTo(1091, 0);
    });

    it('should calculate faster times for higher levels', () => {
      const level1 = calculateOscillationTime(1, 'normal');
      const level5 = calculateOscillationTime(5, 'normal');
      const level10 = calculateOscillationTime(10, 'normal');

      expect(level5).toBeLessThan(level1);
      expect(level10).toBeLessThan(level5);
    });

    it('should respect minimum oscillation time of 400ms', () => {
      const time = calculateOscillationTime(100, 'normal');
      expect(time).toBeGreaterThanOrEqual(400);
    });

    it('should calculate different speeds for different difficulties', () => {
      const easy = calculateOscillationTime(1, 'easy');
      const normal = calculateOscillationTime(1, 'normal');
      const arcade = calculateOscillationTime(1, 'arcade');

      // Easy should be slowest (highest time)
      expect(easy).toBeGreaterThan(normal);
      expect(normal).toBeGreaterThan(arcade);
    });

    it('should match expected timing for level 15 normal', () => {
      const time = calculateOscillationTime(15, 'normal');
      // Level 15: 1200 / (1.0 + 15 * 0.1) = 1200 / 2.5 = 480ms
      expect(time).toBe(480);
    });
  });

  describe('calculateTimePerColumn', () => {
    it('should calculate correct time per column', () => {
      const oscillationTime = 1200;
      const gridWidth = 7;
      const time = calculateTimePerColumn(oscillationTime, gridWidth);

      // Full oscillation = 2 * gridWidth = 14 columns
      // Time per column = 1200 / 14 ≈ 85.7ms
      expect(time).toBeCloseTo(85.71, 1);
    });

    it('should handle different grid widths', () => {
      const oscillationTime = 1200;

      const time7 = calculateTimePerColumn(oscillationTime, 7);
      const time11 = calculateTimePerColumn(oscillationTime, 11);

      // Wider grid = less time per column
      expect(time11).toBeLessThan(time7);
    });
  });

  describe('High Score Storage', () => {
    it('should save and load high score', () => {
      saveHighScore(1000);
      expect(loadHighScore()).toBe(1000);
    });

    it('should only save if score is higher than current high score', () => {
      saveHighScore(1000);
      saveHighScore(500);
      expect(loadHighScore()).toBe(1000);
    });

    it('should update high score when new score is higher', () => {
      saveHighScore(1000);
      saveHighScore(2000);
      expect(loadHighScore()).toBe(2000);
    });

    it('should return 0 if no high score exists', () => {
      expect(loadHighScore()).toBe(0);
    });
  });

  describe('Difficulty Configurations', () => {
    it('should have all required difficulty modes', () => {
      expect(DIFFICULTIES.easy).toBeDefined();
      expect(DIFFICULTIES.normal).toBeDefined();
      expect(DIFFICULTIES.arcade).toBeDefined();
    });

    it('should have correct base speeds', () => {
      expect(DIFFICULTIES.easy.baseSpeed).toBe(1500);
      expect(DIFFICULTIES.normal.baseSpeed).toBe(1200);
      expect(DIFFICULTIES.arcade.baseSpeed).toBe(1000);
    });

    it('should have increasing speed progression rates', () => {
      expect(DIFFICULTIES.easy.speedIncrease).toBe(0.05);
      expect(DIFFICULTIES.normal.speedIncrease).toBe(0.10);
      expect(DIFFICULTIES.arcade.speedIncrease).toBe(0.15);
    });
  });
});
