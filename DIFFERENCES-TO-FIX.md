# Differences from Video Gameplay - To Fix

## 🔴 CRITICAL ISSUES

### 1. Starting Position
- **Current**: Blocks start at row 1, level 1
- **Expected**: Blocks should start at row 0 (bottom row), level 0
- **Impact**: Visual mismatch, stacking doesn't start from absolute bottom
- **Files**: `gameState.ts` (initializeGame)

### 2. Stacking Tolerance (TOO STRICT)
- **Current**: Uses `Math.round(state.position)` for exact column matching
- **Expected**: Should allow tolerance (e.g., within 0.3-0.5 of a column width)
- **Impact**: Game is nearly impossible - requires pixel-perfect alignment
- **Files**: `gameLoop.ts` (placeBlocks line 77)
- **Video Analysis**: Players can be slightly off and still align

### 3. Row Numbering System
- **Current**: Rows numbered 1-15 (level starts at 1)
- **Expected**: Should be 0-14 for proper 15-row grid from bottom
- **Impact**: Confusing row references, prize rows incorrect
- **Files**: `gameState.ts`, `gameLoop.ts`, all tests

## 🟡 VISUAL ISSUES

### 4. Prize Row Visual Indicators
- **Current**: Thin dashed lines (#666 color when inactive)
- **Expected**: Prominent colored "belts" that fill the row height
- **Video Reference**: Prize rows have distinct colored bands across entire row
- **Impact**: Hard to see prize levels during gameplay
- **Files**: `rendering.ts` (drawPrizeIndicator)

### 5. Prize Row Positions
- **Current**: Minor at row 11, Major at row 15
- **Expected**: If 0-indexed (rows 0-14), should be Minor at row 10, Major at row 14
- **Video Analysis**: Minor prize is at middle (row ~10-11), Major at top (row 15)
- **Files**: `gameState.ts` (minorPrizeRow, majorPrizeRow)

### 6. Prize Labels
- **Current**: Small text "MINOR PRIZE" / "MAJOR PRIZE" on left
- **Expected**: Should be more prominent, positioned clearly at prize belt level
- **Files**: `rendering.ts`

## 🟢 GAMEPLAY MECHANICS

### 7. Alignment Tolerance Logic
- **Current**: Checks exact column match: `baseBlock.column === movingBlock.column`
- **Expected**: Should check if block is "close enough" to column (within tolerance)
- **Impact**: Makes game too hard, not matching video gameplay feel
- **Files**: `gameLoop.ts` (checkAlignment function)

### 8. Block Position Snapping
- **Current**: `Math.round(state.position)` snaps to nearest integer
- **Expected**: Should round with tolerance, allow partial overlaps
- **Files**: `gameLoop.ts` (placeBlocks)

## 📊 TESTING GAPS

### 9. Tolerance Edge Cases
- **Missing**: Tests for blocks that are 0.3, 0.4, 0.5 columns off
- **Needed**: Tests to verify tolerance works correctly
- **Expected**: Blocks within tolerance should align

### 10. Starting Position Tests
- **Missing**: Tests verifying blocks start at row 0
- **Needed**: Tests for initial moving blocks at bottom row

### 11. Visual Prize Belt Tests
- **Missing**: Tests for prize indicator rendering
- **Needed**: Visual regression tests or rendering validation

## 🎯 PRIORITY ORDER

1. **HIGH**: Fix stacking tolerance (game is too hard)
2. **HIGH**: Fix starting position at row 0
3. **HIGH**: Fix row numbering system (0-14 instead of 1-15)
4. **MEDIUM**: Fix prize row visual indicators (belts)
5. **MEDIUM**: Verify prize row positions are correct
6. **LOW**: Polish prize labels

## 📋 IMPLEMENTATION PLAN

### Phase 1: Core Mechanics (HIGH PRIORITY)
1. Add tolerance parameter to game state
2. Implement tolerance-based alignment checking
3. Update starting position to row 0
4. Fix row numbering throughout codebase
5. Write comprehensive tests for tolerance

### Phase 2: Visual Polish (MEDIUM PRIORITY)
6. Redesign prize indicators as colored belts
7. Verify prize row positions match video
8. Improve prize label visibility

### Phase 3: Testing & Validation (ALL)
9. Add edge case tests for tolerance
10. Add visual rendering tests
11. Playtest to verify difficulty matches video

## 🧪 TEST REQUIREMENTS

### Tolerance Tests Needed:
- [ ] Block at position 2.0 → should align with column 2
- [ ] Block at position 2.2 → should align with column 2 (within tolerance)
- [ ] Block at position 2.4 → should align with column 2 (within tolerance)
- [ ] Block at position 2.5 → should align with column 2 or 3 (edge case)
- [ ] Block at position 2.6 → should NOT align with column 2 (outside tolerance)
- [ ] Block at position 1.7 → should align with column 2 (within tolerance from other side)

### Starting Position Tests Needed:
- [ ] Game initializes with level 0
- [ ] Moving blocks start at row 0
- [ ] First placement creates blocks at row 0
- [ ] Second level moves to row 1

### Prize Row Tests Needed:
- [ ] Minor prize detected at correct row
- [ ] Major prize detected at correct row
- [ ] Prize indicators render at correct Y positions

---

## 📝 NOTES FROM VIDEO ANALYSIS

- Players can be slightly off-center and still succeed
- Game feels fair and achievable with practice
- Visual feedback is clear and prominent
- Stack visibly grows from absolute bottom of grid
- Prize rows are unmistakable visual markers

