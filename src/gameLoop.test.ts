import { describe, it, expect, beforeEach } from 'vitest';
import {
  updatePosition,
  placeBlocks,
  gameLoop,
  handleButtonPress,
} from './gameLoop';
import { initializeGame, type GameState } from './gameState';

describe('GameLoop', () => {
  let state: GameState;

  beforeEach(() => {
    state = initializeGame('normal');
  });

  describe('updatePosition', () => {
    it('should move blocks to the right initially', () => {
      const deltaTime = 100; // 100ms
      const newState = updatePosition(state, deltaTime);

      expect(newState.position).toBeGreaterThan(state.position);
      expect(newState.direction).toBe('right');
    });

    it('should reverse direction when reaching right edge', () => {
      // Position block at right edge
      const edgeState = { ...state, position: 6, direction: 'right' as const };
      const deltaTime = 1000; // Large delta to ensure movement past edge
      const newState = updatePosition(edgeState, deltaTime);

      expect(newState.direction).toBe('left');
      expect(newState.position).toBeLessThanOrEqual(6);
    });

    it('should reverse direction when reaching left edge', () => {
      const edgeState = { ...state, position: 0.5, direction: 'left' as const };
      const deltaTime = 1000; // Large delta to ensure movement past edge
      const newState = updatePosition(edgeState, deltaTime);

      expect(newState.direction).toBe('right');
      expect(newState.position).toBeGreaterThanOrEqual(0);
    });

    it('should maintain position within grid bounds', () => {
      let testState = state;

      // Simulate multiple updates
      for (let i = 0; i < 100; i++) {
        testState = updatePosition(testState, 50);
        expect(testState.position).toBeGreaterThanOrEqual(0);
        expect(testState.position).toBeLessThan(testState.gridWidth);
      }
    });
  });

  describe('placeBlocks', () => {
    it('should place blocks on first level (no base blocks)', () => {
      // Position at column 2
      const testState = { ...state, position: 2 };
      const newState = placeBlocks(testState);

      // Should have 3 placed blocks at row 0
      expect(newState.blocks).toHaveLength(3);
      expect(newState.blocks[0].column).toBe(2);
      expect(newState.blocks[1].column).toBe(3);
      expect(newState.blocks[2].column).toBe(4);
      expect(newState.blocks[0].row).toBe(0); // Row 0 now
    });

    it('should create moving blocks for next level after placement', () => {
      const testState = { ...state, position: 2 };
      const newState = placeBlocks(testState);

      // Should have moving blocks for level 1 (next after 0)
      expect(newState.movingBlocks).toHaveLength(3);
      expect(newState.level).toBe(1);
      expect(newState.movingBlocks[0].row).toBe(1);
    });

    it('should trim blocks that do not align with base', () => {
      // First placement
      const state1 = placeBlocks({ ...state, position: 2 });

      // Second placement offset by 1 (only 2 blocks align)
      const state2 = placeBlocks({ ...state1, position: 1 });

      // Should have 3 (first) + 2 (second aligned) = 5 total placed blocks
      expect(state2.blocks).toHaveLength(5);

      // Moving blocks for next level should only be 2
      expect(state2.movingBlocks).toHaveLength(2);
    });

    it('should game over if no blocks align', () => {
      // First placement at position 0
      const state1 = placeBlocks({ ...state, position: 0 });

      // Second placement at position 5 (no overlap)
      const state2 = placeBlocks({ ...state1, position: 5 });

      expect(state2.gameOver).toBe(true);
      expect(state2.movingBlocks).toHaveLength(0);
    });

    it('should calculate score with new system (base + speed + combo)', () => {
      const testState = { ...state, position: 2, score: 0, pressTime: Date.now() };
      const newState = placeBlocks(testState);

      // New scoring: base points × difficulty multiplier + speed bonus + combo bonus
      // Base: 3 blocks × 10 × (0+1) × 1.2 (normal multiplier) = 36
      // Speed bonus: 0-100 depending on timing
      // Combo bonus: first perfect, 1.1x multiplier = ~3 points
      // Total should be at least 36 (base minimum)
      expect(newState.score).toBeGreaterThanOrEqual(36);
      expect(newState.score).toBeLessThan(200); // Sanity check upper bound

      // Check that combo streak increased
      expect(newState.comboStreak).toBe(1); // First perfect placement
    });

    it('should track perfect placements when all blocks align', () => {
      const testState = { ...state, position: 2 };
      const newState = placeBlocks(testState);

      expect(newState.perfectPlacements).toBe(1);
    });

    it('should not track perfect placement when blocks are trimmed', () => {
      const state1 = placeBlocks({ ...state, position: 2 });
      const state2 = placeBlocks({ ...state1, position: 1 }); // Offset causes trim

      expect(state2.perfectPlacements).toBe(1); // Only first placement was perfect
    });

    it('should detect minor prize when reaching row 10', () => {
      let testState = state;

      // Play through to level 10 (0-indexed row 10)
      for (let i = 0; i < 10; i++) {
        testState = placeBlocks({ ...testState, position: 0 });
      }

      expect(testState.level).toBe(10);
      expect(testState.minorPrizeReached).toBe(false);

      // Place on row 10
      testState = placeBlocks({ ...testState, position: 0 });
      expect(testState.minorPrizeReached).toBe(true);
    });

    it('should detect win when reaching row 14', () => {
      let testState = state;

      // Play through to level 14 (0-indexed row 14)
      for (let i = 0; i < 14; i++) {
        testState = placeBlocks({ ...testState, position: 0 });
      }

      expect(testState.level).toBe(14);
      expect(testState.won).toBe(false);

      // Place on row 14
      testState = placeBlocks({ ...testState, position: 0 });
      expect(testState.won).toBe(true);
      expect(testState.gameOver).toBe(true);
      expect(testState.movingBlocks).toHaveLength(0);
    });

    it('should increase oscillation speed after each placement', () => {
      const testState = { ...state, position: 2 };
      const initialSpeed = testState.oscillationTime;
      const newState = placeBlocks(testState);

      expect(newState.oscillationTime).toBeLessThan(initialSpeed);
    });

    it('should normalize moving block columns to start at 0', () => {
      // Place blocks at position 3
      const state1 = placeBlocks({ ...state, position: 3 });

      // Moving blocks should have columns 0, 1, 2 (normalized)
      expect(state1.movingBlocks[0].column).toBe(0);
      expect(state1.movingBlocks[1].column).toBe(1);
      expect(state1.movingBlocks[2].column).toBe(2);
    });
  });

  describe('gameLoop', () => {
    it('should not update when game is over', () => {
      const gameOverState = { ...state, gameOver: true, position: 5 };
      const newState = gameLoop(gameOverState);

      expect(newState).toEqual(gameOverState);
    });

    it('should not update when game is paused', () => {
      const pausedState = { ...state, paused: true, position: 5 };
      const newState = gameLoop(pausedState);

      expect(newState).toEqual(pausedState);
    });

    it('should update lastUpdate timestamp', () => {
      const oldTime = Date.now() - 100;
      const testState = { ...state, lastUpdate: oldTime };
      const newState = gameLoop(testState);

      expect(newState.lastUpdate).toBeGreaterThan(oldTime);
    });

    it('should update position during active game', () => {
      const oldPosition = state.position;
      const newState = gameLoop(state);

      // Position should change (might be equal if deltaTime is very small)
      expect(newState.position).toBeGreaterThanOrEqual(oldPosition);
    });
  });

  describe('handleButtonPress', () => {
    it('should place blocks when button is pressed', () => {
      const testState = { ...state, position: 2 };
      const newState = handleButtonPress(testState);

      expect(newState.blocks).toHaveLength(3);
      expect(newState.level).toBe(1); // Level 0 -> 1 after first placement
    });

    it('should not respond when game is over', () => {
      const gameOverState = { ...state, gameOver: true };
      const newState = handleButtonPress(gameOverState);

      expect(newState).toEqual(gameOverState);
    });

    it('should not respond when game is paused', () => {
      const pausedState = { ...state, paused: true };
      const newState = handleButtonPress(pausedState);

      expect(newState).toEqual(pausedState);
    });

    it('should record press time', () => {
      const testState = { ...state, position: 2 };
      const before = Date.now();
      const newState = handleButtonPress(testState);
      const after = Date.now();

      expect(newState.pressTime).toBeGreaterThanOrEqual(before);
      expect(newState.pressTime).toBeLessThanOrEqual(after);
    });

    it('should ignore button press during 1-second cooldown after continue', () => {
      // Set continueTime to now (simulating just clicked continue)
      const testState = { ...state, position: 2, continueTime: Date.now() };
      const newState = handleButtonPress(testState);

      // State should remain unchanged (no blocks placed)
      expect(newState.blocks).toHaveLength(0);
      expect(newState.level).toBe(0);
      expect(newState).toEqual(testState);
    });

    it('should allow button press after 1-second cooldown expires', () => {
      // Set continueTime to 1.1 seconds ago
      const testState = { ...state, position: 2, continueTime: Date.now() - 1100 };
      const newState = handleButtonPress(testState);

      // Blocks should be placed normally
      expect(newState.blocks).toHaveLength(3);
      expect(newState.level).toBe(1);
    });
  });

  describe('Integration: Full Game Play', () => {
    it('should play through multiple levels successfully', () => {
      let testState = state;

      // Play 5 levels with perfect alignment (starting from level 0)
      for (let i = 0; i < 5; i++) {
        testState = { ...testState, position: 0 };
        testState = handleButtonPress(testState);

        expect(testState.gameOver).toBe(false);
        expect(testState.level).toBe(i + 1); // Level 0 -> 1 -> 2 -> 3 -> 4 -> 5
      }

      expect(testState.perfectPlacements).toBe(5);
      expect(testState.blocks.length).toBeGreaterThan(0);
    });

    it('should handle progressive block loss realistically', () => {
      let testState = state;

      // First placement: perfect at position 2 (blocks at columns 2, 3, 4)
      testState = placeBlocks({ ...testState, position: 2 });
      expect(testState.movingBlocks).toHaveLength(3);
      expect(testState.blocks).toHaveLength(3);

      // Second placement: offset right by 1 - blocks at 3, 4, 5
      // Base blocks are at 2, 3, 4, so blocks at 3, 4 align (2 blocks)
      testState = placeBlocks({ ...testState, position: 3 });
      expect(testState.movingBlocks).toHaveLength(2);
      expect(testState.blocks).toHaveLength(5); // 3 from first + 2 from second

      // Third placement: offset right by 1 again - blocks at 4, 5
      // Base blocks are at 3, 4, so only block at 4 aligns (1 block)
      testState = placeBlocks({ ...testState, position: 4 });
      expect(testState.movingBlocks).toHaveLength(1);
      expect(testState.blocks).toHaveLength(6); // 5 + 1

      // Fourth placement: complete miss (block at position 0, base at 4)
      testState = placeBlocks({ ...testState, position: 0 });
      expect(testState.gameOver).toBe(true);
      expect(testState.movingBlocks).toHaveLength(0);
    });
  });
});
