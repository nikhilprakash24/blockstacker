# Phase 3 Branch Strategy

**Strategy**: Tiered feature branches with incremental merges

**Naming Convention**: `claude/phase3-<feature>-<session-id>`

---

## Branch Hierarchy

```
main (production - untouched)
│
└── claude/phase3-base-011CUyxxAcJYCdjbceojkY2P
    │   (Core mode system + mode selection UI)
    │
    ├── claude/phase3-timeattack-011CUyxxAcJYCdjbceojkY2P
    │   (Time Attack mode logic + UI)
    │
    ├── claude/phase3-endless-011CUyxxAcJYCdjbceojkY2P
    │   (Endless mode logic + UI)
    │
    ├── claude/phase3-stats-011CUyxxAcJYCdjbceojkY2P
    │   (Statistics system)
    │
    └── claude/phase3-final-011CUyxxAcJYCdjbceojkY2P
        (Merge all features + final polish)
```

---

## Branch Details

### Branch 1: phase3-base
**Purpose**: Core game mode architecture
**From**: `claude/block-falling-animation-011CUyxxAcJYCdjbceojkY2P` (current Phase 2.5 branch)
**Features**:
- Task 1.1: Mode system foundation
- Task 1.2: Mode selection UI
- Task 2.1: Classic mode branding

**Merge Target**: Not merged until all complete (stays as base for other branches)

**Commits Expected**:
1. Add GameMode types and interfaces
2. Add mode field to GameState
3. Create mode configuration system
4. Update initializeGame for modes
5. Build + test
6. Create mode selection screen UI
7. Add mode selection CSS
8. Wire mode selection handlers
9. Build + test
10. Update Classic mode branding
11. Final build + regression test

---

### Branch 2: phase3-timeattack
**Purpose**: Time Attack game mode
**From**: `claude/phase3-base-011CUyxxAcJYCdjbceojkY2P`
**Features**:
- Task 3.1: Time Attack logic
- Task 3.2: Time Attack UI

**Merge Target**: `phase3-final` after testing

**Commits Expected**:
1. Add timer fields to GameState
2. Implement countdown logic
3. Add time-based scoring
4. Build + test logic
5. Add timer display rendering
6. Add color-coded timer
7. Add urgency effects
8. Build + test UI
9. Integration test

---

### Branch 3: phase3-endless
**Purpose**: Endless game mode
**From**: `claude/phase3-base-011CUyxxAcJYCdjbceojkY2P`
**Features**:
- Task 4.1: Endless logic
- Task 4.2: Endless UI

**Merge Target**: `phase3-final` after testing

**Commits Expected**:
1. Remove height limit
2. Add camera offset system
3. Implement progressive difficulty
4. Build + test logic
5. Add height display
6. Add camera panning
7. Update rendering for camera
8. Build + test UI
9. Integration test

---

### Branch 4: phase3-stats
**Purpose**: Statistics tracking system
**From**: `claude/phase3-base-011CUyxxAcJYCdjbceojkY2P`
**Features**:
- Task 5.1: Stats storage
- Task 5.2: Stats display

**Merge Target**: `phase3-final` after testing

**Commits Expected**:
1. Create statistics.ts
2. Add stats tracking logic
3. Add localStorage save/load
4. Build + test storage
5. Create stats modal
6. Add stats UI
7. Wire stats display
8. Build + test UI
9. Integration test

---

### Branch 5: phase3-final
**Purpose**: Merge all features + final polish
**From**: `claude/phase3-base-011CUyxxAcJYCdjbceojkY2P`
**Features**:
- Merge timeattack
- Merge endless
- Merge stats
- Resolve conflicts
- Final testing
- Documentation updates

**Merge Target**: `main` (eventually, after full testing)

**Commits Expected**:
1. Merge phase3-timeattack
2. Resolve conflicts
3. Test Time Attack
4. Merge phase3-endless
5. Resolve conflicts
6. Test Endless
7. Merge phase3-stats
8. Resolve conflicts
9. Test Stats
10. Full integration test
11. Update CHANGELOG.md
12. Update README if needed
13. Final build
14. Final commit

---

## Git Workflow

### Creating Branches
```bash
# Start from current Phase 2.5 branch
git checkout claude/block-falling-animation-011CUyxxAcJYCdjbceojkY2P

# Create base branch
git checkout -b claude/phase3-base-011CUyxxAcJYCdjbceojkY2P

# Work on base...
# Commit base work

# Create feature branches FROM base
git checkout -b claude/phase3-timeattack-011CUyxxAcJYCdjbceojkY2P
git checkout -b claude/phase3-endless-011CUyxxAcJYCdjbceojkY2P
git checkout -b claude/phase3-stats-011CUyxxAcJYCdjbceojkY2P
```

### Merging Strategy
```bash
# After all features complete, create final branch
git checkout claude/phase3-base-011CUyxxAcJYCdjbceojkY2P
git checkout -b claude/phase3-final-011CUyxxAcJYCdjbceojkY2P

# Merge features one by one
git merge claude/phase3-timeattack-011CUyxxAcJYCdjbceojkY2P
# Test
git merge claude/phase3-endless-011CUyxxAcJYCdjbceojkY2P
# Test
git merge claude/phase3-stats-011CUyxxAcJYCdjbceojkY2P
# Test

# Final polish and testing
```

---

## Commit Message Format

**Format**: `[PHASE 3.X] Description`

**Examples**:
- `[PHASE 3.1] Add GameMode type system and interfaces`
- `[PHASE 3.1] Create mode selection UI with card grid`
- `[PHASE 3.2] Implement Time Attack countdown logic`
- `[PHASE 3.3] Add Endless mode camera panning`
- `[PHASE 3.4] Create statistics tracking system`

**Detail Level**: Each commit message should include:
- What was changed
- Why (if not obvious)
- Test status (e.g., "Build passes", "Tested in browser")

---

## Push Strategy

**When to Push**:
- After each major feature completion
- After successful build
- After successful testing
- At end of each work session

**Remote Tracking**:
```bash
git push -u origin claude/phase3-base-011CUyxxAcJYCdjbceojkY2P
git push -u origin claude/phase3-timeattack-011CUyxxAcJYCdjbceojkY2P
git push -u origin claude/phase3-endless-011CUyxxAcJYCdjbceojkY2P
git push -u origin claude/phase3-stats-011CUyxxAcJYCdjbceojkY2P
git push -u origin claude/phase3-final-011CUyxxAcJYCdjbceojkY2P
```

---

## Branch Status Tracking

| Branch | Status | Current Task | Last Push | Notes |
|--------|--------|--------------|-----------|-------|
| phase3-base | ⏳ Planned | - | - | Starting point |
| phase3-timeattack | ⏳ Planned | - | - | Waits for base |
| phase3-endless | ⏳ Planned | - | - | Waits for base |
| phase3-stats | ⏳ Planned | - | - | Waits for base |
| phase3-final | ⏳ Planned | - | - | Merges all |

---

## Rollback Plan

**If Feature Branch Fails**:
1. Don't merge to final
2. Fix on feature branch
3. Re-test
4. Try merge again

**If Final Branch Has Issues**:
1. Identify problematic feature
2. Revert merge commit
3. Fix on feature branch
4. Re-merge

**If Everything Fails**:
- Base branch is always safe
- Can restart from base
- Feature branches are isolated

---

**Last Updated**: 2025-11-10 00:04

**Next Action**: Create phase3-base branch and begin Task 1.1
