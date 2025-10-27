import { describe, it, expect, beforeEach } from 'vitest';
import { initializeGame, type GameState } from './gameState';
import { placeBlocks } from './gameLoop';

describe('Tolerance-Based Alignment', () => {
  let state: GameState;

  beforeEach(() => {
    state = initializeGame('normal'); // Normal has 0.35 tolerance
  });

  describe('Tolerance Configuration', () => {
    it('should set correct tolerance for easy mode', () => {
      const easy = initializeGame('easy');
      expect(easy.alignmentTolerance).toBe(0.45);
    });

    it('should set correct tolerance for normal mode', () => {
      const normal = initializeGame('normal');
      expect(normal.alignmentTolerance).toBe(0.35);
    });

    it('should set correct tolerance for arcade mode', () => {
      const arcade = initializeGame('arcade');
      expect(arcade.alignmentTolerance).toBe(0.25);
    });
  });

  describe('First Level Placement (No Base)', () => {
    it('should place all blocks on first level at exact position', () => {
      const testState = { ...state, position: 2.0 };
      const newState = placeBlocks(testState);

      expect(newState.blocks).toHaveLength(3);
      expect(newState.blocks[0].column).toBe(2.0);
      expect(newState.blocks[1].column).toBe(3.0);
      expect(newState.blocks[2].column).toBe(4.0);
    });

    it('should place all blocks on first level even with decimal position', () => {
      const testState = { ...state, position: 2.3 };
      const newState = placeBlocks(testState);

      expect(newState.blocks).toHaveLength(3);
      // First level has no base, so all blocks placed regardless of position
      expect(newState.gameOver).toBe(false);
    });
  });

  describe('Tolerance Edge Cases - Within Tolerance', () => {
    it('should align block at exact column position (0.0 offset)', () => {
      // First placement at column 2
      const state1 = placeBlocks({ ...state, position: 2.0 });

      // Second placement exactly at column 2
      const state2 = placeBlocks({ ...state1, position: 2.0 });

      expect(state2.gameOver).toBe(false);
      expect(state2.movingBlocks.length).toBeGreaterThan(0);
    });

    it('should align block at 0.2 columns offset (within 0.35 tolerance)', () => {
      const state1 = placeBlocks({ ...state, position: 2.0 });
      const state2 = placeBlocks({ ...state1, position: 2.2 });

      expect(state2.gameOver).toBe(false);
      expect(state2.movingBlocks.length).toBeGreaterThan(0);
    });

    it('should align block at 0.3 columns offset (within 0.35 tolerance)', () => {
      const state1 = placeBlocks({ ...state, position: 2.0 });
      const state2 = placeBlocks({ ...state1, position: 2.3 });

      expect(state2.gameOver).toBe(false);
      expect(state2.movingBlocks.length).toBeGreaterThan(0);
    });

    it('should align block at 0.35 columns offset (exactly at tolerance)', () => {
      const state1 = placeBlocks({ ...state, position: 2.0 });
      const state2 = placeBlocks({ ...state1, position: 2.35 });

      expect(state2.gameOver).toBe(false);
      expect(state2.movingBlocks.length).toBeGreaterThan(0);
    });

    it('should align block at -0.3 columns offset (within tolerance, left side)', () => {
      const state1 = placeBlocks({ ...state, position: 2.0 });
      const state2 = placeBlocks({ ...state1, position: 1.7 });

      expect(state2.gameOver).toBe(false);
      expect(state2.movingBlocks.length).toBeGreaterThan(0);
    });
  });

  describe('Tolerance Edge Cases - Outside Tolerance', () => {
    it('should NOT align block at 0.4 columns offset (outside 0.35 tolerance)', () => {
      const state1 = placeBlocks({ ...state, position: 2.0 });
      const state2 = placeBlocks({ ...state1, position: 2.4 });

      // At least one block should be trimmed or game over
      expect(state2.movingBlocks.length).toBeLessThan(3);
    });

    it('should NOT align block at 0.5 columns offset (outside tolerance)', () => {
      const state1 = placeBlocks({ ...state, position: 2.0 });
      const state2 = placeBlocks({ ...state1, position: 2.5 });

      expect(state2.movingBlocks.length).toBeLessThan(3);
    });

    it('should NOT align block at 1.0 column offset (way outside tolerance)', () => {
      const state1 = placeBlocks({ ...state, position: 2.0 });
      const state2 = placeBlocks({ ...state1, position: 3.0 });

      // Should lose at least one block
      expect(state2.movingBlocks.length).toBeLessThan(3);
    });
  });

  describe('Block Snapping to Base Column', () => {
    it('should snap aligned blocks to base block column', () => {
      // First placement at column 2 (row 0)
      const state1 = placeBlocks({ ...state, position: 2.0 });
      expect(state1.blocks[0].column).toBe(2);
      expect(state1.blocks[0].row).toBe(0);

      // Second placement at 2.3 (within tolerance) -> row 1
      const state2 = placeBlocks({ ...state1, position: 2.3 });

      // Find the block in row 1 that aligned
      const row1Block = state2.blocks.find(b => b.row === 1 && b.column === 2);
      expect(row1Block).toBeDefined();
      expect(row1Block?.column).toBe(2); // Should snap to base column, not 2.3
    });

    it('should snap to nearest base block when multiple options exist', () => {
      // First placement creates blocks at columns 2, 3, 4 (row 0)
      const state1 = placeBlocks({ ...state, position: 2.0 });

      // Second placement at 2.8 - closer to column 3 than column 2 (row 1)
      const state2 = placeBlocks({ ...state1, position: 2.8 });

      // First moving block at 2.8 should snap to column 3 (nearest)
      const row1Blocks = state2.blocks.filter(b => b.row === 1);
      const hasColumn3 = row1Blocks.some(b => b.column === 3);
      expect(hasColumn3).toBe(true);
    });
  });

  describe('Partial Alignment with Tolerance', () => {
    it('should keep blocks within tolerance and trim those outside', () => {
      // First placement at columns 2, 3, 4
      const state1 = placeBlocks({ ...state, position: 2.0 });

      // Second placement at 2.6
      // Block at 2.6 -> distance to col 2 = 0.6 (outside tolerance)
      // Block at 3.6 -> distance to col 3 = 0.6, to col 4 = 0.4 (outside tolerance for normal)
      // Block at 4.6 -> distance to col 4 = 0.6 (outside tolerance)
      const state2 = placeBlocks({ ...state1, position: 2.6 });

      // With normal tolerance (0.35), likely no blocks align
      // So game should either end or have fewer blocks
      expect(state2.movingBlocks.length).toBeLessThanOrEqual(1);
    });

    it('should align multiple blocks when all are within tolerance', () => {
      // First placement at columns 2, 3, 4 (row 0)
      const state1 = placeBlocks({ ...state, position: 2.0 });
      expect(state1.blocks[0].row).toBe(0); // Verify it's at row 0

      // Second placement at 2.2 - all blocks should be within tolerance (row 1)
      // Block at 2.2 -> distance to col 2 = 0.2 (within 0.35)
      // Block at 3.2 -> distance to col 3 = 0.2 (within 0.35)
      // Block at 4.2 -> distance to col 4 = 0.2 (within 0.35)
      const state2 = placeBlocks({ ...state1, position: 2.2 });

      expect(state2.gameOver).toBe(false);
      expect(state2.movingBlocks).toHaveLength(3); // All 3 should align
      expect(state2.blocks.filter(b => b.row === 1)).toHaveLength(3); // 3 blocks at row 1
    });
  });

  describe('Tolerance Across Difficulty Modes', () => {
    it('easy mode should be more forgiving than normal', () => {
      const easy = initializeGame('easy'); // 0.45 tolerance
      const normal = initializeGame('normal'); // 0.35 tolerance

      // Test with 0.4 offset
      const easyState1 = placeBlocks({ ...easy, position: 2.0 });
      const easyState2 = placeBlocks({ ...easyState1, position: 2.4 });

      const normalState1 = placeBlocks({ ...normal, position: 2.0 });
      const normalState2 = placeBlocks({ ...normalState1, position: 2.4 });

      // Easy should align with 0.4 offset, normal should not
      expect(easyState2.movingBlocks.length).toBeGreaterThan(normalState2.movingBlocks.length);
    });

    it('arcade mode should be stricter than normal', () => {
      const arcade = initializeGame('arcade'); // 0.25 tolerance
      const normal = initializeGame('normal'); // 0.35 tolerance

      // Test with 0.3 offset
      const arcadeState1 = placeBlocks({ ...arcade, position: 2.0 });
      const arcadeState2 = placeBlocks({ ...arcadeState1, position: 2.3 });

      const normalState1 = placeBlocks({ ...normal, position: 2.0 });
      const normalState2 = placeBlocks({ ...normalState1, position: 2.3 });

      // Normal should align with 0.3 offset, arcade should not
      expect(normalState2.movingBlocks.length).toBeGreaterThan(arcadeState2.movingBlocks.length);
    });
  });

  describe('Progressive Difficulty with Tolerance', () => {
    it('should maintain tolerance as game progresses', () => {
      let testState = state;
      const initialTolerance = testState.alignmentTolerance;

      // Play through 5 levels
      for (let i = 0; i < 5; i++) {
        testState = placeBlocks({ ...testState, position: 0 });
      }

      // Tolerance should remain constant
      expect(testState.alignmentTolerance).toBe(initialTolerance);
    });
  });

  describe('Edge Case: Multiple Base Blocks Near Position', () => {
    it('should align to nearest base block when two are equidistant', () => {
      // Create a scenario with blocks at columns 2 and 4
      const state1 = placeBlocks({ ...state, position: 2.0 });

      // Manually create a state with only blocks at columns 2 and 4
      const customState: GameState = {
        ...state1,
        blocks: [
          { column: 2, row: 1, placed: true },
          { column: 4, row: 1, placed: true },
        ],
        movingBlocks: [
          { column: 0, row: 2, placed: false },
        ],
        level: 2,
      };

      // Place at 3.0 - exactly between columns 2 and 4
      const state2 = placeBlocks({ ...customState, position: 3.0 });

      // Block at 3.0 should be outside tolerance (0.35) from both 2 and 4
      // Distance to 2: 1.0, Distance to 4: 1.0 - both outside tolerance
      expect(state2.gameOver).toBe(true);
    });
  });
});
