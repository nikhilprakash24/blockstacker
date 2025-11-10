# Phase 3 Task Breakdown

**Status Legend**:
- ⏳ Planned
- 🔨 In Progress
- ✅ Complete
- ❌ Blocked
- 🧪 Testing
- 📝 Needs Review

---

## Priority 1: Core Architecture (MUST HAVE)

### Task 1.1: Game Mode System Foundation
**Priority**: CRITICAL
**Estimated Time**: 2 hours
**Dependencies**: None
**Status**: ⏳ Planned

**Subtasks**:
- [ ] 1.1.1: Create GameMode type system (Classic, TimeAttack, Endless, Challenge, Zen)
- [ ] 1.1.2: Add `gameMode` field to GameState
- [ ] 1.1.3: Create mode-specific configuration interface
- [ ] 1.1.4: Implement mode switching logic
- [ ] 1.1.5: Update initializeGame() to accept mode parameter

**Files to Modify**:
- src/gameState.ts
- src/gameLoop.ts

**Acceptance Criteria**:
- [ ] GameState includes gameMode field
- [ ] Each mode has distinct configuration
- [ ] Game can initialize in any mode
- [ ] Build passes
- [ ] No existing functionality broken

---

### Task 1.2: Mode Selection UI
**Priority**: CRITICAL
**Estimated Time**: 2 hours
**Dependencies**: Task 1.1
**Status**: ⏳ Planned

**Subtasks**:
- [ ] 1.2.1: Design mode selection screen layout
- [ ] 1.2.2: Create mode selection component/screen
- [ ] 1.2.3: Add mode icons and descriptions
- [ ] 1.2.4: Implement mode selection handlers
- [ ] 1.2.5: Add CSS styling for mode cards
- [ ] 1.2.6: Add animations for mode selection

**Files to Modify**:
- src/App.tsx
- src/App.css

**Acceptance Criteria**:
- [ ] Beautiful mode selection screen
- [ ] Each mode clearly explained
- [ ] Smooth transitions
- [ ] Mobile-friendly
- [ ] Accessible

---

## Priority 2: Classic Mode Enhancement (MUST HAVE)

### Task 2.1: Rename Current Game to "Classic Mode"
**Priority**: HIGH
**Estimated Time**: 30 minutes
**Dependencies**: Task 1.1, 1.2
**Status**: ⏳ Planned

**Subtasks**:
- [ ] 2.1.1: Update all UI text to say "Classic Mode"
- [ ] 2.1.2: Keep all existing functionality intact
- [ ] 2.1.3: Add "Classic" badge/indicator during gameplay

**Files to Modify**:
- src/App.tsx
- src/App.css

**Acceptance Criteria**:
- [ ] Current game labeled as Classic Mode
- [ ] All features work identically
- [ ] No regressions

---

## Priority 3: Time Attack Mode (HIGH PRIORITY)

### Task 3.1: Time Attack Core Logic
**Priority**: HIGH
**Estimated Time**: 2 hours
**Dependencies**: Task 1.1
**Status**: ⏳ Planned

**Subtasks**:
- [ ] 3.1.1: Add timer field to GameState
- [ ] 3.1.2: Implement countdown logic (60 seconds)
- [ ] 3.1.3: Add time multiplier scoring
- [ ] 3.1.4: Game over when timer reaches 0
- [ ] 3.1.5: Score based on points accumulated in time

**Files to Modify**:
- src/gameState.ts
- src/gameLoop.ts

**Acceptance Criteria**:
- [ ] Timer counts down from 60s
- [ ] Game ends at 0
- [ ] Score multiplier works
- [ ] No prize system in Time Attack

---

### Task 3.2: Time Attack UI
**Priority**: HIGH
**Estimated Time**: 1 hour
**Dependencies**: Task 3.1
**Status**: ⏳ Planned

**Subtasks**:
- [ ] 3.2.1: Add timer display (large, prominent)
- [ ] 3.2.2: Color-code timer (green > yellow > red)
- [ ] 3.2.3: Add "hurry up" visual effects at 10s
- [ ] 3.2.4: Display "Time Attack" mode indicator

**Files to Modify**:
- src/rendering.ts
- src/App.tsx

**Acceptance Criteria**:
- [ ] Timer clearly visible
- [ ] Urgency communicated visually
- [ ] Does not obstruct gameplay

---

## Priority 4: Endless Mode (HIGH PRIORITY)

### Task 4.1: Endless Mode Core Logic
**Priority**: HIGH
**Estimated Time**: 1.5 hours
**Dependencies**: Task 1.1
**Status**: ⏳ Planned

**Subtasks**:
- [ ] 4.1.1: Remove height limit
- [ ] 4.1.2: Implement dynamic camera/viewport
- [ ] 4.1.3: Progressive difficulty scaling
- [ ] 4.1.4: Score based on height reached
- [ ] 4.1.5: No prize system

**Files to Modify**:
- src/gameState.ts
- src/gameLoop.ts
- src/rendering.ts

**Acceptance Criteria**:
- [ ] Grid extends infinitely
- [ ] Camera follows player upward
- [ ] Difficulty increases smoothly
- [ ] Performance remains good (1000+ blocks)

---

### Task 4.2: Endless Mode UI
**Priority**: HIGH
**Estimated Time**: 1 hour
**Dependencies**: Task 4.1
**Status**: ⏳ Planned

**Subtasks**:
- [ ] 4.2.1: Show "Height: X" instead of level
- [ ] 4.2.2: Add vertical progress indicator
- [ ] 4.2.3: Display "Endless Mode" indicator
- [ ] 4.2.4: Show personal best height

**Files to Modify**:
- src/rendering.ts
- src/App.tsx

---

## Priority 5: Statistics System (MEDIUM PRIORITY)

### Task 5.1: Stats Storage
**Priority**: MEDIUM
**Estimated Time**: 1.5 hours
**Dependencies**: None
**Status**: ⏳ Planned

**Subtasks**:
- [ ] 5.1.1: Create Statistics interface
- [ ] 5.1.2: Track games played per mode
- [ ] 5.1.3: Track high scores per mode
- [ ] 5.1.4: Track total playtime
- [ ] 5.1.5: Track best combo streak
- [ ] 5.1.6: Save to localStorage

**Files to Create**:
- src/statistics.ts

**Acceptance Criteria**:
- [ ] Stats persist across sessions
- [ ] Stats track accurately
- [ ] No performance impact

---

### Task 5.2: Stats Display
**Priority**: MEDIUM
**Estimated Time**: 1 hour
**Dependencies**: Task 5.1
**Status**: ⏳ Planned

**Subtasks**:
- [ ] 5.2.1: Create stats modal/screen
- [ ] 5.2.2: Display all tracked stats
- [ ] 5.2.3: Add per-mode breakdowns
- [ ] 5.2.4: Nice formatting and icons

**Files to Modify**:
- src/App.tsx
- src/App.css

---

## Priority 6: Challenge Mode (NICE TO HAVE)

### Task 6.1: Challenge System
**Priority**: LOW
**Estimated Time**: 2 hours
**Dependencies**: Task 1.1
**Status**: ⏳ Planned

**Subtasks**:
- [ ] 6.1.1: Define challenge types
- [ ] 6.1.2: Implement challenge modifiers
- [ ] 6.1.3: Create 5 initial challenges
- [ ] 6.1.4: Challenge completion tracking

**Status**: MAY BE DEFERRED

---

## Priority 7: Zen Mode (NICE TO HAVE)

### Task 7.1: Zen Mode Implementation
**Priority**: LOW
**Estimated Time**: 1 hour
**Dependencies**: Task 1.1
**Status**: ⏳ Planned

**Subtasks**:
- [ ] 7.1.1: Disable timer/speed increases
- [ ] 7.1.2: Slower base speed
- [ ] 7.1.3: Calming visual effects
- [ ] 7.1.4: Focus on perfect placements

**Status**: MAY BE DEFERRED

---

## Priority 8: Achievements (NICE TO HAVE)

### Task 8.1: Achievement System
**Priority**: LOW
**Estimated Time**: 3 hours
**Dependencies**: Task 5.1
**Status**: ⏳ Planned

**Subtasks**:
- [ ] 8.1.1: Create Achievement interface
- [ ] 8.1.2: Define 10 core achievements
- [ ] 8.1.3: Achievement checking logic
- [ ] 8.1.4: Achievement notifications
- [ ] 8.1.5: Achievement display screen

**Status**: MAY BE DEFERRED

---

## Task Dependency Graph

```
1.1 (Mode Foundation)
├── 1.2 (Mode Selection UI)
│   ├── 2.1 (Classic Mode Branding)
│   ├── 3.1 (Time Attack Logic)
│   │   └── 3.2 (Time Attack UI)
│   ├── 4.1 (Endless Logic)
│   │   └── 4.2 (Endless UI)
│   ├── 6.1 (Challenge Mode)
│   └── 7.1 (Zen Mode)
└── 5.1 (Stats Storage)
    ├── 5.2 (Stats Display)
    └── 8.1 (Achievements)
```

---

## Implementation Order (Optimized)

**Phase 3A** (Core - 6-8 hours):
1. Task 1.1: Mode Foundation
2. Task 1.2: Mode Selection UI
3. Task 2.1: Classic Mode Branding

**Phase 3B** (Time Attack - 3 hours):
4. Task 3.1: Time Attack Logic
5. Task 3.2: Time Attack UI

**Phase 3C** (Endless - 2.5 hours):
6. Task 4.1: Endless Logic
7. Task 4.2: Endless UI

**Phase 3D** (Stats - 2.5 hours):
8. Task 5.1: Stats Storage
9. Task 5.2: Stats Display

**Phase 3E** (Optional - 6+ hours):
10. Task 6.1: Challenge Mode
11. Task 7.1: Zen Mode
12. Task 8.1: Achievements

**Total Estimated Time**: 14-20 hours

---

**Decision**: Focus on Phase 3A, 3B, 3C, 3D first. Defer 3E based on time/quality.

**Last Updated**: 2025-11-10 00:01
