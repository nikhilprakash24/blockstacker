# Phase 3 Testing Documentation

**Testing Philosophy**: Manual testing with comprehensive checklists for game modes.

**Why Manual**: UI-heavy features, game feel evaluation, mobile testing required.

---

## Test Environment

**Browser Targets**:
- Chrome/Edge (primary)
- Safari (iOS compatibility)
- Firefox (verification)

**Device Targets**:
- Desktop (1920x1080)
- Tablet (768x1024)
- Mobile (375x667)

**Test Build**: `npm run build` then serve from dist/

---

## Pre-Implementation Baseline Tests

### Baseline Test 1: Current Game Works
**Date**: TBD
**Tester**: Claude
**Status**: ⏳ Pending

**Checklist**:
- [ ] Game starts without errors
- [ ] Block placement works
- [ ] Scoring works
- [ ] Difficulty selection works
- [ ] Settings modal works
- [ ] Sound effects play
- [ ] Haptic feedback fires
- [ ] Alignment indicator shows
- [ ] Combo display works
- [ ] Game over restart works
- [ ] Mobile touch works

**Result**: PENDING

---

## Task 1.1 Tests: Mode Foundation

### Test 1.1: Mode System Integration
**Date**: 2025-11-10
**Prerequisites**: Task 1.1 complete
**Status**: ✅ Passed (Code-Level Verification)

**Checklist**:
- [x] Build succeeds with no errors
- [x] GameState includes gameMode field
- [x] Can initialize Classic mode (default)
- [x] Can initialize Time Attack mode (timeRemaining = 60)
- [x] Can initialize Endless mode (cameraOffsetY, maxHeightReached initialized)
- [x] Mode configs are distinct (5 configs with different properties)
- [x] Existing game still works (no breaking changes to initializeGame interface)

**Test Cases**:
1. Initialize Classic mode → ✅ gameMode='classic', timeRemaining=null, hasPrizes=true
2. Initialize Time Attack mode → ✅ gameMode='timeAttack', timeRemaining=60, hasTimer=true
3. Initialize Endless mode → ✅ gameMode='endless', cameraOffsetY=0, hasHeightLimit=false
4. Play full Classic game → ⏳ Pending browser test (backward compatible)

**Expected Result**: All modes initialize, Classic unchanged

**Actual Result**:
- ✅ TypeScript compilation successful
- ✅ All mode types defined correctly
- ✅ initializeGame() accepts gameMode parameter with 'classic' default (backward compatible)
- ✅ Mode-specific fields initialized conditionally (timeRemaining based on mode)
- ⏳ Browser testing pending (requires dev server + manual interaction)

**Notes**: Code-level verification complete. Full UI testing deferred to after mode selection UI is implemented.

---

## Task 1.2 Tests: Mode Selection UI

### Test 1.2: Mode Selection Screen
**Date**: TBD
**Prerequisites**: Task 1.2 complete
**Status**: ⏳ Pending

**Checklist**:
- [ ] Mode selection screen appears on start
- [ ] All 3 modes visible (Classic, Time Attack, Endless)
- [ ] Mode cards are clickable/tappable
- [ ] Mode descriptions are clear
- [ ] Mode selection starts correct game mode
- [ ] Can return to mode selection from settings
- [ ] Mobile-friendly layout
- [ ] Animations smooth

**Test Cases**:
1. Start app → mode selection shown
2. Tap "Classic Mode" → starts classic game
3. Tap "Time Attack" → starts time attack game
4. Tap "Endless" → starts endless game
5. Game over → can return to mode selection
6. Test on mobile (375px width)

**Visual Tests**:
- [ ] Mode cards aligned nicely
- [ ] Icons visible and appropriate
- [ ] Text readable on all backgrounds
- [ ] Hover effects work
- [ ] Touch feedback on mobile

**Expected Result**: Beautiful, functional mode selection

**Actual Result**: TBD

---

## Task 3.1 Tests: Time Attack Logic

### Test 3.1: Time Attack Gameplay
**Date**: TBD
**Prerequisites**: Task 3.1 complete
**Status**: ⏳ Pending

**Checklist**:
- [ ] Timer starts at 60 seconds
- [ ] Timer counts down every second
- [ ] Game ends when timer reaches 0
- [ ] Score accumulates during play
- [ ] No prize prompts appear
- [ ] Speed increases over time
- [ ] Blocks still work normally
- [ ] Game over shows final score

**Test Cases**:
1. Start Time Attack → timer at 60s
2. Play for 10s → timer at 50s
3. Place blocks → score increases
4. Wait for timer to expire → game over
5. Check final score → accurate

**Edge Cases**:
- [ ] Pause game → timer stops
- [ ] Rapid placements → timer accurate
- [ ] Game over at 0s → no negative time

**Performance**:
- [ ] Timer updates smoothly (60 FPS)
- [ ] No lag during countdown

**Expected Result**: Clean 60-second time limit mode

**Actual Result**: TBD

---

## Task 3.2 Tests: Time Attack UI

### Test 3.2: Timer Display
**Date**: TBD
**Prerequisites**: Task 3.2 complete
**Status**: ⏳ Pending

**Checklist**:
- [ ] Timer visible at top center
- [ ] Timer color-coded (green/yellow/red)
- [ ] Timer pulses at < 10 seconds
- [ ] "Time Attack" mode indicator shown
- [ ] Timer doesn't obstruct gameplay
- [ ] Timer readable on mobile

**Visual Tests**:
- [ ] 60s-30s: Green timer
- [ ] 29s-10s: Yellow timer
- [ ] 9s-0s: Red timer + pulsing
- [ ] Font size appropriate
- [ ] Shadow/glow for visibility

**Expected Result**: Clear, urgent timer display

**Actual Result**: TBD

---

## Task 4.1 Tests: Endless Logic

### Test 4.1: Endless Gameplay
**Date**: TBD
**Prerequisites**: Task 4.1 complete
**Status**: ⏳ Pending

**Checklist**:
- [ ] No height limit (can go past row 15)
- [ ] Camera follows player upward
- [ ] Difficulty scales progressively
- [ ] Score based on height reached
- [ ] No prize prompts
- [ ] Can play to height 50+
- [ ] Performance good at 100+ blocks

**Test Cases**:
1. Start Endless → no height limit
2. Place blocks to row 20 → game continues
3. Place blocks to row 50 → no issues
4. Game over → score = final height

**Performance Tests**:
- [ ] Render 100 blocks → no lag
- [ ] Render 500 blocks → acceptable FPS
- [ ] Camera panning smooth

**Edge Cases**:
- [ ] Camera doesn't jitter
- [ ] Out-of-bounds blocks handled
- [ ] Very high numbers display correctly

**Expected Result**: Infinite vertical gameplay

**Actual Result**: TBD

---

## Task 4.2 Tests: Endless UI

### Test 4.2: Endless Visuals
**Date**: TBD
**Prerequisites**: Task 4.2 complete
**Status**: ⏳ Pending

**Checklist**:
- [ ] "Height: X" displayed instead of "Level"
- [ ] "Endless Mode" indicator shown
- [ ] Camera pans smoothly
- [ ] All UI elements visible during camera pan
- [ ] Personal best height shown

**Visual Tests**:
- [ ] Height counter updates correctly
- [ ] No UI clipping during pan
- [ ] Prize indicators removed/hidden
- [ ] Score display appropriate

**Expected Result**: Clean endless mode presentation

**Actual Result**: TBD

---

## Task 5.1 Tests: Statistics Storage

### Test 5.1: Stats Tracking
**Date**: TBD
**Prerequisites**: Task 5.1 complete
**Status**: ⏳ Pending

**Checklist**:
- [ ] Stats save to localStorage
- [ ] Stats persist after page reload
- [ ] Stats track per mode correctly
- [ ] Stats update in real-time
- [ ] No performance impact

**Test Cases**:
1. Play Classic → stats increment
2. Play Time Attack → separate stats
3. Play Endless → separate stats
4. Refresh page → stats preserved
5. Check localStorage → JSON valid

**Stat Verification**:
- [ ] Games played counts correctly
- [ ] High score saves correctly
- [ ] Total score accumulates
- [ ] Best combo tracked
- [ ] Playtime accumulates

**Expected Result**: Accurate, persistent stats

**Actual Result**: TBD

---

## Task 5.2 Tests: Stats Display

### Test 5.2: Stats Modal
**Date**: TBD
**Prerequisites**: Task 5.2 complete
**Status**: ⏳ Planned

**Checklist**:
- [ ] Stats modal opens from menu
- [ ] All stats displayed clearly
- [ ] Per-mode breakdown shown
- [ ] Icons and formatting nice
- [ ] Mobile-friendly layout

**Visual Tests**:
- [ ] Modal centered and readable
- [ ] Stats aligned properly
- [ ] Colors consistent with theme
- [ ] Close button works

**Expected Result**: Informative stats screen

**Actual Result**: TBD

---

## Regression Test Suite

**Run after EACH task completion**

### Critical Path Test
- [ ] Can start game
- [ ] Can place blocks
- [ ] Can game over
- [ ] Can restart
- [ ] Can change settings

### Phase 2.5 Features (No Regressions)
- [ ] Instant restart works
- [ ] Haptic feedback fires
- [ ] Bass sound on placement
- [ ] Alignment indicator shows colors
- [ ] Score counts up smoothly
- [ ] Combo indicator appears

### Mobile Experience
- [ ] Touch controls work
- [ ] No zoom on tap
- [ ] Tap-to-restart works
- [ ] Settings accessible
- [ ] All buttons tappable

---

## Final Integration Test

### Full Game Test - All Modes
**Date**: TBD
**Duration**: 30 minutes
**Status**: ⏳ Pending

**Test Script**:
1. Start app → mode selection appears
2. Select Classic → play full game → win/lose
3. Return to mode selection
4. Select Time Attack → play until time up
5. Return to mode selection
6. Select Endless → play to height 30+
7. Open stats → verify all data
8. Test on mobile device
9. Test all difficulty levels
10. Test all settings

**Success Criteria**:
- [ ] All modes playable
- [ ] No crashes
- [ ] No visual glitches
- [ ] Stats accurate
- [ ] Mobile works perfectly
- [ ] Performance good

**Expected Result**: Polished, complete Phase 3

**Actual Result**: TBD

---

## Bug Log

| ID | Date | Description | Severity | Status | Fix |
|----|------|-------------|----------|--------|-----|
| - | - | - | - | - | - |

---

## Performance Benchmarks

| Test | Target | Result | Pass/Fail |
|------|--------|--------|-----------|
| Initial load | < 2s | TBD | - |
| Mode switch | < 500ms | TBD | - |
| Build size | < 200KB JS | TBD | - |
| 100 blocks render | 60 FPS | TBD | - |
| 500 blocks render | 30+ FPS | TBD | - |

---

**Last Updated**: 2025-11-10 00:03
