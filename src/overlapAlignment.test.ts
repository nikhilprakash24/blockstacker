import { describe, it, expect, beforeEach } from 'vitest';
import { initializeGame, type GameState } from './gameState';
import { placeBlocks } from './gameLoop';

describe('Overlap-Based Alignment Logic', () => {
  let state: GameState;

  beforeEach(() => {
    state = initializeGame('normal');
  });

  describe('The Bug: Individual Block Checking Fails', () => {
    it('CURRENT BUG: offset by 0.4 should keep some blocks but loses all', () => {
      // First placement at position 2 (blocks at 2, 3, 4)
      const state1 = placeBlocks({ ...state, position: 2.0 });
      expect(state1.blocks).toHaveLength(3);

      // Second placement offset by 0.4 (blocks at 2.4, 3.4, 4.4)
      // Overlap is from 2.4 to 5.0 = 2.6 blocks of overlap!
      // Should keep 2-3 blocks, but current logic might trim all
      const state2 = placeBlocks({ ...state1, position: 2.4 });

      // With tolerance 0.35, individual checks fail at 0.4 offset
      // But we should still have blocks based on overlap!
      console.log('Blocks after 0.4 offset:', state2.movingBlocks.length);
      console.log('Game over?', state2.gameOver);

      // This test documents the current buggy behavior
      // After fix, we should keep at least 2 blocks
    });

    it('offset by 0.5 with 3 blocks should keep 2 blocks (2.5 blocks overlap)', () => {
      const state1 = placeBlocks({ ...state, position: 2.0 });

      // Offset by 0.5: blocks at 2.5, 3.5, 4.5
      // Base at 2, 3, 4 (range 2-5)
      // Moving range: 2.5-5.5
      // Overlap: 2.5-5.0 = 2.5 blocks
      // Should keep 2 or 3 blocks based on overlap
      const state2 = placeBlocks({ ...state1, position: 2.5 });

      expect(state2.gameOver).toBe(false);
      expect(state2.movingBlocks.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Expected Behavior: Overlap-Based Logic', () => {
    it('should calculate overlap correctly for perfect alignment', () => {
      // Base: 2-5 (3 blocks at 2,3,4)
      // Moving: 2-5 (3 blocks at 2,3,4)
      // Overlap: 2-5 (3 blocks)
      // Should keep all 3 blocks
      const state1 = placeBlocks({ ...state, position: 2.0 });
      const state2 = placeBlocks({ ...state1, position: 2.0 });

      expect(state2.movingBlocks).toHaveLength(3);
    });

    it('should keep 2 blocks when offset by 1 (1 block overhang)', () => {
      // Base: 2-5 (blocks at 2,3,4)
      // Moving: 3-6 (blocks at 3,4,5 - offset by 1)
      // Overlap: 3-5 (2 blocks)
      // Should keep 2 blocks
      const state1 = placeBlocks({ ...state, position: 2.0 });
      const state2 = placeBlocks({ ...state1, position: 3.0 });

      expect(state2.movingBlocks).toHaveLength(2);
      expect(state2.gameOver).toBe(false);
    });

    it('should keep 1 block when offset by 2 (2 blocks overhang)', () => {
      // Base: 2-5 (blocks at 2,3,4)
      // Moving: 4-7 (blocks at 4,5,6 - offset by 2)
      // Overlap: 4-5 (1 block)
      // Should keep 1 block
      const state1 = placeBlocks({ ...state, position: 2.0 });
      const state2 = placeBlocks({ ...state1, position: 4.0 });

      expect(state2.movingBlocks).toHaveLength(1);
      expect(state2.gameOver).toBe(false);
    });

    it('should game over when offset by 3 or more (no overlap)', () => {
      // Base: 2-5 (blocks at 2,3,4)
      // Moving: 5-8 (blocks at 5,6,7 - offset by 3)
      // Overlap: 5-5 (0 blocks, or very minimal)
      // Should be game over
      const state1 = placeBlocks({ ...state, position: 2.0 });
      const state2 = placeBlocks({ ...state1, position: 5.0 });

      expect(state2.gameOver).toBe(true);
    });

    it('should handle negative offset (left overhang)', () => {
      // Base: 2-5 (blocks at 2,3,4)
      // Moving: 1-4 (blocks at 1,2,3 - offset by -1)
      // Overlap: 2-4 (2 blocks)
      // Should keep 2 blocks
      const state1 = placeBlocks({ ...state, position: 2.0 });
      const state2 = placeBlocks({ ...state1, position: 1.0 });

      expect(state2.movingBlocks).toHaveLength(2);
      expect(state2.gameOver).toBe(false);
    });
  });

  describe('Fractional Offsets (The Real Test)', () => {
    it('offset by 0.3 should keep all 3 blocks (2.7 blocks overlap)', () => {
      // Base: 2-5
      // Moving: 2.3-5.3
      // Overlap: 2.3-5.0 = 2.7 blocks
      // Should keep all 3 blocks (>= 50% overlap for each)
      const state1 = placeBlocks({ ...state, position: 2.0 });
      const state2 = placeBlocks({ ...state1, position: 2.3 });

      expect(state2.movingBlocks).toHaveLength(3);
      expect(state2.gameOver).toBe(false);
    });

    it('offset by 0.6 should keep all 3 blocks (rightmost has 40% overlap)', () => {
      // Base: 2-5
      // Moving: 2.6-5.6
      // Block at 2.6: 100% overlap ✓
      // Block at 3.6: 100% overlap ✓
      // Block at 4.6: 40% overlap (4.6-5.0 = 0.4) ✓ (exactly at 40% threshold for normal)
      const state1 = placeBlocks({ ...state, position: 2.0 });
      const state2 = placeBlocks({ ...state1, position: 2.6 });

      expect(state2.movingBlocks).toHaveLength(3);
      expect(state2.gameOver).toBe(false);
    });

    it('offset by 1.5 should keep 1-2 blocks (1.5 blocks overlap)', () => {
      // Base: 2-5
      // Moving: 3.5-6.5
      // Overlap: 3.5-5.0 = 1.5 blocks
      // Should keep 1 or 2 blocks
      const state1 = placeBlocks({ ...state, position: 2.0 });
      const state2 = placeBlocks({ ...state1, position: 3.5 });

      expect(state2.movingBlocks.length).toBeGreaterThanOrEqual(1);
      expect(state2.movingBlocks.length).toBeLessThanOrEqual(2);
      expect(state2.gameOver).toBe(false);
    });

    it('offset by 2.6 should keep 1 block or game over (0.4 blocks overlap)', () => {
      // Base: 2-5
      // Moving: 4.6-7.6
      // Overlap: 4.6-5.0 = 0.4 blocks
      // This is borderline - might keep 1 block or game over depending on threshold
      const state1 = placeBlocks({ ...state, position: 2.0 });
      const state2 = placeBlocks({ ...state1, position: 4.6 });

      // Should either keep 1 block or be game over
      if (!state2.gameOver) {
        expect(state2.movingBlocks.length).toBe(1);
      }
    });
  });

  describe('Overlap Threshold Edge Cases', () => {
    it('exactly 0.4 blocks overlap should keep 1 block (normal mode 40% threshold)', () => {
      // Normal mode needs 40% overlap (0.75 - 0.35)
      // Base: 2-5 (3 blocks)
      // Moving: 4.6-7.6 (3 blocks)
      // Block at 4.6: overlap 4.6-5.0 = 0.4 (exactly 40%)
      const state1 = placeBlocks({ ...state, position: 2.0 });
      const state2 = placeBlocks({ ...state1, position: 4.6 });

      expect(state2.gameOver).toBe(false);
      expect(state2.movingBlocks.length).toBe(1);
    });

    it('less than 0.4 blocks overlap should game over (below normal threshold)', () => {
      // Base: 2-5
      // Moving: 4.65-7.65
      // Block at 4.65: overlap 4.65-5.0 = 0.35 (35% < 40%)
      const state1 = placeBlocks({ ...state, position: 2.0 });
      const state2 = placeBlocks({ ...state1, position: 4.65 });

      expect(state2.gameOver).toBe(true);
    });
  });
});
