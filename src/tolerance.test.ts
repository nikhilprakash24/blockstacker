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

  describe('Overlap-Based Logic (replaces strict tolerance)', () => {
    it('offset by 0.4 keeps all blocks (60-100% overlap per block)', () => {
      // Normal mode needs 40% overlap (0.75 - 0.35)
      const state1 = placeBlocks({ ...state, position: 2.0 });
      const state2 = placeBlocks({ ...state1, position: 2.4 });

      // Block at 4.4 has 0.6 overlap (60%) - above 40% threshold
      expect(state2.movingBlocks).toHaveLength(3);
      expect(state2.gameOver).toBe(false);
    });

    it('offset by 0.5 keeps all blocks (50-100% overlap per block)', () => {
      const state1 = placeBlocks({ ...state, position: 2.0 });
      const state2 = placeBlocks({ ...state1, position: 2.5 });

      // Block at 4.5 has 0.5 overlap (50%) - above 40% threshold
      expect(state2.movingBlocks).toHaveLength(3);
      expect(state2.gameOver).toBe(false);
    });

    it('offset by 1.0 loses 1 block (rightmost has no overlap)', () => {
      const state1 = placeBlocks({ ...state, position: 2.0 });
      const state2 = placeBlocks({ ...state1, position: 3.0 });

      // Block at 5.0 has 0 overlap - trimmed
      expect(state2.movingBlocks).toHaveLength(2);
    });

    it('offset by 0.7 trims rightmost block (30% overlap < 40% needed)', () => {
      const state1 = placeBlocks({ ...state, position: 2.0 });
      const state2 = placeBlocks({ ...state1, position: 2.7 });

      // Block at 4.7 has 0.3 overlap (30%) - below 40% threshold for normal
      expect(state2.movingBlocks).toHaveLength(2);
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

  describe('Partial Alignment with Overlap', () => {
    it('should keep blocks with sufficient overlap and trim those without', () => {
      // First placement at columns 2, 3, 4
      const state1 = placeBlocks({ ...state, position: 2.0 });

      // Second placement at 2.6
      // Block at 2.6 (2.6-3.6): overlap with base (2-5) = 3.6-2.6 = 1.0 (100%) ✓
      // Block at 3.6 (3.6-4.6): overlap with base (2-5) = 4.6-3.6 = 1.0 (100%) ✓
      // Block at 4.6 (4.6-5.6): overlap with base (2-5) = 5.0-4.6 = 0.4 (40%) ✓ (exactly at threshold)
      const state2 = placeBlocks({ ...state1, position: 2.6 });

      // All blocks have >= 40% overlap (normal threshold)
      expect(state2.movingBlocks.length).toBe(3);
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
    it('easy mode should be more forgiving than normal (lower overlap needed)', () => {
      const easy = initializeGame('easy'); // 0.45 tolerance -> 30% overlap needed
      const normal = initializeGame('normal'); // 0.35 tolerance -> 40% overlap needed

      // Test with 0.65 offset - rightmost block has 0.35 overlap (35%)
      const easyState1 = placeBlocks({ ...easy, position: 2.0 });
      const easyState2 = placeBlocks({ ...easyState1, position: 2.65 });

      const normalState1 = placeBlocks({ ...normal, position: 2.0 });
      const normalState2 = placeBlocks({ ...normalState1, position: 2.65 });

      // Easy keeps block with 35% overlap (> 30% threshold)
      expect(easyState2.movingBlocks.length).toBe(3);
      // Normal loses block with 35% overlap (< 40% threshold)
      expect(normalState2.movingBlocks.length).toBe(2);
    });

    it('arcade mode should be stricter than normal (higher overlap needed)', () => {
      const arcade = initializeGame('arcade'); // 0.25 tolerance -> 50% overlap needed
      const normal = initializeGame('normal'); // 0.35 tolerance -> 40% overlap needed

      // Test with 0.6 offset - rightmost block has 0.4 overlap (40%)
      const arcadeState1 = placeBlocks({ ...arcade, position: 2.0 });
      const arcadeState2 = placeBlocks({ ...arcadeState1, position: 2.6 });

      const normalState1 = placeBlocks({ ...normal, position: 2.0 });
      const normalState2 = placeBlocks({ ...normalState1, position: 2.6 });

      // Normal keeps block with 40% overlap (exactly at 40% threshold)
      expect(normalState2.movingBlocks.length).toBe(3);
      // Arcade loses block with 40% overlap (< 50% threshold)
      expect(arcadeState2.movingBlocks.length).toBe(2);
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
    it('should keep block when it overlaps with base range', () => {
      // Create a scenario with blocks at columns 2 and 4 (gap in between)
      const state1 = placeBlocks({ ...state, position: 2.0 });

      // Manually create a state with only blocks at columns 2 and 4
      const customState: GameState = {
        ...state1,
        blocks: [
          { column: 2, row: 0, placed: true },
          { column: 4, row: 0, placed: true },
        ],
        movingBlocks: [
          { column: 0, row: 1, placed: false },
        ],
        level: 1,
      };

      // Place at 3.0 - between columns 2 and 4
      // Block at 3.0 (3.0-4.0) overlaps with base range (2-5)
      // Overlap: 4.0-3.0 = 1.0 (100%)
      const state2 = placeBlocks({ ...customState, position: 3.0 });

      // Block has 100% overlap - should be kept
      expect(state2.gameOver).toBe(false);
      expect(state2.movingBlocks.length).toBe(1);
    });
  });
});
