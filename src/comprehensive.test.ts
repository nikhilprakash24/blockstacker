import { describe, it, expect, beforeEach } from 'vitest';
import { initializeGame, type GameState } from './gameState';
import { placeBlocks, updatePosition, handleButtonPress } from './gameLoop';

describe('Comprehensive Integration Tests', () => {
  let state: GameState;

  beforeEach(() => {
    state = initializeGame('normal');
  });

  describe('Block Movement Range with Gaps', () => {
    it('should allow 2 consecutive blocks to reach rightmost position', () => {
      // Setup: 2 consecutive blocks at columns 0, 1
      const testState: GameState = {
        ...state,
        movingBlocks: [
          { column: 0, row: 1, placed: false },
          { column: 1, row: 1, placed: false }
        ]
      };

      // Simulate movement to maximum position
      let currentState = testState;
      for (let i = 0; i < 100; i++) {
        currentState = updatePosition(currentState, 50);

        // Check that blocks never go out of bounds
        const maxColumn = Math.max(...currentState.movingBlocks.map(b => b.column));
        const rightmostPosition = currentState.position + maxColumn;
        expect(rightmostPosition).toBeLessThanOrEqual(state.gridWidth);
      }

      // Verify blocks can reach the rightmost valid position
      // For 2 consecutive blocks in 7-column grid: max position should be 5
      // giving absolute columns 5 and 6
      const maxReachedPosition = Math.max(
        ...Array.from({ length: 100 }, (_, i) => {
          const s = updatePosition(testState, 50 * i);
          return s.position;
        })
      );
      expect(maxReachedPosition).toBeGreaterThanOrEqual(4.5); // Should get close to 5
    });

    it('should handle 2 blocks with a gap (columns 0, 2) correctly', () => {
      // Setup: 2 blocks with gap at columns 0, 2 (span of 3)
      const testState: GameState = {
        ...state,
        movingBlocks: [
          { column: 0, row: 1, placed: false },
          { column: 2, row: 1, placed: false }
        ]
      };

      // Simulate movement
      let currentState = testState;
      for (let i = 0; i < 100; i++) {
        currentState = updatePosition(currentState, 50);

        // Check that blocks never go out of bounds
        currentState.movingBlocks.forEach(block => {
          const absoluteColumn = currentState.position + block.column;
          expect(absoluteColumn).toBeGreaterThanOrEqual(0);
          expect(absoluteColumn).toBeLessThan(state.gridWidth);
        });
      }

      // For blocks spanning 3 columns (0, 2) in 7-column grid
      // Max position should be 4 (blocks at 4, 6)
      const maxReachedPosition = Math.max(
        ...Array.from({ length: 100 }, (_, i) => {
          const s = updatePosition(testState, 50 * i);
          return s.position;
        })
      );
      expect(maxReachedPosition).toBeLessThanOrEqual(4.5);
      expect(maxReachedPosition).toBeGreaterThanOrEqual(3.5); // Should reach near 4
    });

    it('should handle single block reaching rightmost column', () => {
      const testState: GameState = {
        ...state,
        movingBlocks: [{ column: 0, row: 1, placed: false }]
      };

      // Simulate movement
      let currentState = testState;
      for (let i = 0; i < 100; i++) {
        currentState = updatePosition(currentState, 50);

        const absoluteColumn = currentState.position + currentState.movingBlocks[0].column;
        expect(absoluteColumn).toBeGreaterThanOrEqual(0);
        expect(absoluteColumn).toBeLessThan(state.gridWidth);
      }

      // Single block should be able to reach position 6 (rightmost in 7-column grid)
      const maxReachedPosition = Math.max(
        ...Array.from({ length: 100 }, (_, i) => {
          const s = updatePosition(testState, 50 * i);
          return s.position;
        })
      );
      expect(maxReachedPosition).toBeGreaterThanOrEqual(5.5); // Should get close to 6
    });

    it('should handle 3 blocks with gaps (columns 0, 2, 5) correctly', () => {
      const testState: GameState = {
        ...state,
        movingBlocks: [
          { column: 0, row: 1, placed: false },
          { column: 2, row: 1, placed: false },
          { column: 5, row: 1, placed: false }
        ]
      };

      // Simulate movement - blocks span 6 columns (0-5)
      let currentState = testState;
      for (let i = 0; i < 100; i++) {
        currentState = updatePosition(currentState, 50);

        currentState.movingBlocks.forEach(block => {
          const absoluteColumn = currentState.position + block.column;
          expect(absoluteColumn).toBeGreaterThanOrEqual(0);
          expect(absoluteColumn).toBeLessThan(state.gridWidth);
        });
      }

      // Max position for span of 6 should be 1 (blocks at 1, 3, 6)
      const maxReachedPosition = Math.max(
        ...Array.from({ length: 100 }, (_, i) => {
          const s = updatePosition(testState, 50 * i);
          return s.position;
        })
      );
      expect(maxReachedPosition).toBeLessThanOrEqual(1.5);
    });
  });

  describe('Prize System Integration', () => {
    it('should show minor prize modal when reaching row 10', () => {
      let testState = state;

      // Play through to level 10
      for (let i = 0; i < 10; i++) {
        testState = placeBlocks({ ...testState, position: 0 });
      }

      expect(testState.level).toBe(10);
      expect(testState.minorPrizeReached).toBe(false);

      // Place on row 10
      testState = placeBlocks({ ...testState, position: 0 });
      expect(testState.minorPrizeReached).toBe(true);
      expect(testState.continuedFromMinorPrize).toBe(false);
      expect(testState.gameOver).toBe(false);
    });

    it('should allow continuing after minor prize with proper state', () => {
      let testState = state;

      // Reach minor prize
      for (let i = 0; i <= 10; i++) {
        testState = placeBlocks({ ...testState, position: 0 });
      }

      expect(testState.minorPrizeReached).toBe(true);
      expect(testState.continuedFromMinorPrize).toBe(false);

      // Simulate clicking Continue button
      testState = { ...testState, continueTime: Date.now(), continuedFromMinorPrize: true };

      // Modal should now be hidden (continuedFromMinorPrize is true)
      expect(testState.continuedFromMinorPrize).toBe(true);
      expect(testState.minorPrizeReached).toBe(true);

      // Should be able to continue playing
      testState = placeBlocks({ ...testState, position: 0 });
      expect(testState.level).toBe(12);
      expect(testState.gameOver).toBe(false);
    });

    it('should enforce 1-second cooldown after continuing from minor prize', () => {
      let testState = state;

      // Reach minor prize and continue
      for (let i = 0; i <= 10; i++) {
        testState = placeBlocks({ ...testState, position: 0 });
      }
      testState = { ...testState, continueTime: Date.now(), continuedFromMinorPrize: true };

      // Try to place blocks immediately (should be ignored)
      const beforePress = { ...testState };
      testState = handleButtonPress(testState);
      expect(testState).toEqual(beforePress);

      // Wait 1.1 seconds and try again (should work)
      testState = { ...testState, continueTime: Date.now() - 1100 };
      testState = handleButtonPress(testState);
      expect(testState.level).toBe(12); // Level should advance
    });

    it('should not show minor prize modal again after continuing', () => {
      let testState = state;

      // Reach minor prize
      for (let i = 0; i <= 10; i++) {
        testState = placeBlocks({ ...testState, position: 0 });
      }
      testState = { ...testState, continuedFromMinorPrize: true };

      // Continue playing
      testState = placeBlocks({ ...testState, position: 0 });

      // continuedFromMinorPrize should still be true (modal stays hidden)
      expect(testState.continuedFromMinorPrize).toBe(true);
      expect(testState.minorPrizeReached).toBe(true);
    });

    it('should win at major prize row (14) after continuing from minor', () => {
      let testState = state;

      // Reach minor prize and continue
      for (let i = 0; i <= 10; i++) {
        testState = placeBlocks({ ...testState, position: 0 });
      }
      testState = { ...testState, continueTime: Date.now() - 2000, continuedFromMinorPrize: true };

      // Continue to major prize
      for (let i = 11; i < 14; i++) {
        testState = placeBlocks({ ...testState, position: 0 });
      }

      expect(testState.level).toBe(14);
      expect(testState.won).toBe(false);

      // Place on row 14 to win
      testState = placeBlocks({ ...testState, position: 0 });
      expect(testState.won).toBe(true);
      expect(testState.gameOver).toBe(true);
    });
  });

  describe('Progressive Block Loss Scenarios', () => {
    it('should maintain correct movement range as blocks are progressively lost', () => {
      let testState = state;

      // Start with 3 blocks at position 2
      testState = placeBlocks({ ...testState, position: 2 });
      expect(testState.movingBlocks).toHaveLength(3);

      // Lose 1 block (offset by 1) - should have 2 blocks
      testState = placeBlocks({ ...testState, position: 3 });
      expect(testState.movingBlocks).toHaveLength(2);

      // Check that 2 blocks can still reach right edge
      let maxPosition = -1;
      let currentState = testState;
      for (let i = 0; i < 50; i++) {
        currentState = updatePosition(currentState, 100);
        if (currentState.position > maxPosition) {
          maxPosition = currentState.position;
        }

        // Verify no blocks go out of bounds
        currentState.movingBlocks.forEach(block => {
          const absoluteColumn = currentState.position + block.column;
          expect(absoluteColumn).toBeLessThan(state.gridWidth);
        });
      }

      // With 2 blocks, should be able to reach a reasonable position
      expect(maxPosition).toBeGreaterThan(3);
    });

    it('should handle losing blocks from the left side', () => {
      let testState = state;

      // Place at position 2
      testState = placeBlocks({ ...testState, position: 2 });
      expect(testState.movingBlocks).toHaveLength(3);

      // Place at position 1 (offset left) - lose rightmost block
      testState = placeBlocks({ ...testState, position: 1 });
      expect(testState.movingBlocks).toHaveLength(2);

      // Place at position 1 again - should keep at least 1 block or game over
      testState = placeBlocks({ ...testState, position: 1 });

      // Either we have blocks remaining or game is over (both are valid)
      if (testState.gameOver) {
        expect(testState.movingBlocks).toHaveLength(0);
      } else {
        expect(testState.movingBlocks.length).toBeGreaterThan(0);
      }
    });

    it('should handle asymmetric block loss correctly', () => {
      let testState = state;

      // First placement: 3 blocks at 2, 3, 4
      testState = placeBlocks({ ...testState, position: 2 });

      // Second placement: 3 blocks at 2.7
      // Some blocks will align, some might be trimmed
      testState = placeBlocks({ ...testState, position: 2.7 });

      // Check that remaining blocks can still move properly
      const movingBlockCount = testState.movingBlocks.length;
      expect(movingBlockCount).toBeGreaterThan(0);

      // Verify movement doesn't cause out-of-bounds
      let currentState = testState;
      for (let i = 0; i < 50; i++) {
        currentState = updatePosition(currentState, 50);
        currentState.movingBlocks.forEach(block => {
          const absoluteColumn = currentState.position + block.column;
          expect(absoluteColumn).toBeGreaterThanOrEqual(0);
          expect(absoluteColumn).toBeLessThan(state.gridWidth);
        });
      }
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle blocks at position 0 (leftmost)', () => {
      const testState = { ...state, position: 0 };
      const newState = placeBlocks(testState);

      expect(newState.blocks).toHaveLength(3);
      expect(newState.blocks[0].column).toBe(0);
      expect(newState.gameOver).toBe(false);
    });

    it('should handle empty moving blocks gracefully', () => {
      const testState: GameState = {
        ...state,
        movingBlocks: []
      };

      // Should not crash
      expect(() => updatePosition(testState, 100)).not.toThrow();
      expect(() => placeBlocks(testState)).not.toThrow();
    });

    it('should handle very small deltaTime in updatePosition', () => {
      const testState = state;
      const newState = updatePosition(testState, 0.1);

      expect(newState.position).toBeDefined();
      expect(Number.isFinite(newState.position)).toBe(true);
    });

    it('should handle reasonable deltaTime values without crashing', () => {
      const testState = state;

      // Test various realistic time steps (up to 200ms, typical for frame drops)
      const deltaValues = [10, 50, 100, 200];

      deltaValues.forEach(delta => {
        expect(() => updatePosition(testState, delta)).not.toThrow();
      });

      // Multiple sequential updates with normal timing
      let currentState = testState;
      for (let i = 0; i < 20; i++) {
        currentState = updatePosition(currentState, 50);

        // Position should stay within grid bounds
        expect(currentState.position).toBeGreaterThanOrEqual(0);
        const maxColumn = currentState.movingBlocks.length > 0
          ? Math.max(...currentState.movingBlocks.map(b => b.column))
          : 0;
        expect(currentState.position + maxColumn).toBeLessThanOrEqual(state.gridWidth);
      }
    });

    it('should maintain block normalization after multiple placements', () => {
      let testState = state;

      // Make several placements
      for (let i = 0; i < 5; i++) {
        testState = placeBlocks({ ...testState, position: i });

        // Moving blocks should always have min column >= 0
        const minColumn = Math.min(...testState.movingBlocks.map(b => b.column));
        expect(minColumn).toBeGreaterThanOrEqual(0);
      }
    });

    it('should handle game over correctly when all blocks are lost', () => {
      let testState = state;

      // Place first blocks
      testState = placeBlocks({ ...testState, position: 0 });

      // Place at opposite end to lose all blocks
      testState = placeBlocks({ ...testState, position: 6 });

      expect(testState.gameOver).toBe(true);
      expect(testState.movingBlocks).toHaveLength(0);
    });
  });

  describe('Difficulty Mode Consistency', () => {
    it('should maintain movement range consistency across difficulty modes', () => {
      ['easy', 'normal', 'arcade'].forEach(difficulty => {
        const testState = initializeGame(difficulty as any);

        // Check that initial blocks can move across grid
        let currentState = testState;
        for (let i = 0; i < 50; i++) {
          currentState = updatePosition(currentState, 50);

          currentState.movingBlocks.forEach(block => {
            const absoluteColumn = currentState.position + block.column;
            expect(absoluteColumn).toBeGreaterThanOrEqual(0);
            expect(absoluteColumn).toBeLessThan(currentState.gridWidth);
          });
        }
      });
    });

    it('should preserve alignment tolerance after block loss', () => {
      const testState = initializeGame('arcade'); // Strict tolerance
      const initialTolerance = testState.alignmentTolerance;

      // Lose some blocks
      let currentState = placeBlocks({ ...testState, position: 2 });
      currentState = placeBlocks({ ...currentState, position: 4 });

      // Tolerance should remain unchanged
      expect(currentState.alignmentTolerance).toBe(initialTolerance);
    });
  });
});
