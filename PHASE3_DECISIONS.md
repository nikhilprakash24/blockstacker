# Phase 3 Architectural Decisions

This document records all major technical and design decisions made during Phase 3 development.

**Format**: Each decision includes Context, Options Considered, Decision Made, Rationale, Trade-offs

---

## Decision Log

### [D001] Game Mode Architecture Pattern
**Date**: 2025-11-10
**Context**: Need to add 5 game modes (Classic, Time Attack, Endless, Challenge, Zen) without breaking existing code

**Options Considered**:
1. **Separate components for each mode** - Complete isolation
2. **Single game with mode flags** - Conditional logic throughout
3. **Mode-specific configuration objects** - Centralized mode definitions

**Decision**: Option 3 - Mode-specific configuration objects

**Rationale**:
- Keeps codebase DRY (don't repeat yourself)
- Centralized mode logic in gameState.ts
- Easy to add new modes in future
- Minimal changes to existing systems
- Each mode config defines: rules, UI, scoring, win conditions

**Trade-offs**:
- ✅ Easy to maintain
- ✅ Clean separation of concerns
- ⚠️ Conditional logic still needed in some places
- ❌ Slightly more complex than pure flags

**Implementation**:
```typescript
export type GameMode = 'classic' | 'timeAttack' | 'endless' | 'challenge' | 'zen';

export interface ModeConfig {
  name: string;
  description: string;
  hasTimer: boolean;
  hasPrizes: boolean;
  hasHeightLimit: boolean;
  baseSpeed: number;
  speedProgression: 'normal' | 'aggressive' | 'none';
  scoringMultiplier: number;
  icon: string;
}
```

---

### [D002] Mode Selection UI Pattern
**Date**: 2025-11-10
**Context**: Need intuitive, beautiful mode selection that works on mobile

**Options Considered**:
1. **Dropdown menu** - Simple but not exciting
2. **Tab interface** - Common but limited space
3. **Card grid with descriptions** - Visual and informative

**Decision**: Option 3 - Card grid with descriptions

**Rationale**:
- Visual appeal matches Flappy Bird polish from Phase 2.5
- Each mode can show icon, name, description, best score
- Works well on mobile (scrollable grid)
- Exciting and inviting
- Room for mode-specific visual theming

**Trade-offs**:
- ✅ Beautiful and engaging
- ✅ Clear information architecture
- ✅ Mobile-friendly
- ⚠️ Takes more screen space
- ⚠️ More CSS work

---

### [D003] Endless Mode Viewport Strategy
**Date**: 2025-11-10
**Context**: Endless mode needs infinite vertical space, but canvas is fixed 740px

**Options Considered**:
1. **Dynamic canvas resizing** - Canvas grows with game
2. **Fixed canvas with camera/viewport** - Canvas stays fixed, view pans up
3. **Scrollable container** - HTML scroll

**Decision**: Option 2 - Fixed canvas with camera offset

**Rationale**:
- Maintains performance (fixed canvas size)
- Smooth camera tracking like platformer games
- Can show "height" indicator
- No HTML scroll issues on mobile
- Keeps rendering logic clean

**Trade-offs**:
- ✅ Performance-friendly
- ✅ Smooth gameplay
- ⚠️ Requires camera offset in rendering.ts
- ⚠️ Need to track visible region

**Implementation**:
```typescript
// GameState adds:
cameraOffsetY: number; // Track camera position
visibleRowStart: number; // First visible row
visibleRowEnd: number; // Last visible row

// Rendering adjusts all Y positions by cameraOffsetY
```

---

### [D004] Statistics Storage Strategy
**Date**: 2025-11-10
**Context**: Need to track stats per mode without bloating localStorage

**Options Considered**:
1. **Separate localStorage keys per stat** - Many keys
2. **Single JSON object** - One key, nested structure
3. **IndexedDB** - More powerful but overkill

**Decision**: Option 2 - Single JSON object in localStorage

**Rationale**:
- Simple and sufficient for scale (5 modes × ~10 stats)
- Easy to backup/export
- No dependencies
- Fast read/write
- Easy migration path to IndexedDB if needed

**Trade-offs**:
- ✅ Simple implementation
- ✅ Fast enough
- ✅ Easy to debug
- ⚠️ 5MB localStorage limit (not an issue for stats)
- ❌ No query capabilities (don't need them)

**Structure**:
```typescript
{
  classic: { gamesPlayed, wins, bestScore, totalScore, ... },
  timeAttack: { ... },
  endless: { ... },
  global: { totalGames, totalPlaytime, ... }
}
```

---

### [D005] Mode-Specific High Scores
**Date**: 2025-11-10
**Context**: Each mode needs its own leaderboard/best score

**Options Considered**:
1. **Shared high score** - One score across modes
2. **Per-mode high scores** - Separate tracking
3. **Per-mode per-difficulty** - Most granular

**Decision**: Option 2 - Per-mode high scores

**Rationale**:
- Modes play very differently (time vs height vs classic)
- Each deserves own "best" tracking
- Simpler than per-difficulty per-mode
- Difficulty still matters within each mode

**Trade-offs**:
- ✅ Fair comparisons
- ✅ More replay value
- ⚠️ More localStorage keys
- ❌ More complex than single score

**Implementation**:
```typescript
localStorage keys:
- blockstacker_highscore_classic
- blockstacker_highscore_timeattack
- blockstacker_highscore_endless
```

---

### [D006] Timer Display for Time Attack
**Date**: 2025-11-10
**Context**: Time Attack needs prominent, urgent timer

**Options Considered**:
1. **Small timer in corner** - Unobtrusive
2. **Large center-top timer** - Prominent
3. **Progress bar timer** - Visual

**Decision**: Combination - Large center-top timer + color coding

**Rationale**:
- Time is THE core mechanic of Time Attack mode
- Must be impossible to ignore
- Color shifts create urgency (green → yellow → red → flashing)
- Flappy Bird principle: immediate, visceral feedback

**Trade-offs**:
- ✅ Impossible to miss
- ✅ Creates tension
- ⚠️ Takes screen space
- ⚠️ Could be distracting

**Mitigation**: Timer fades slightly during normal play, pulses when < 10s

---

### [D007] Branch Strategy for Phase 3
**Date**: 2025-11-10
**Context**: Large feature set, want to maintain stability

**Options Considered**:
1. **Single branch for all Phase 3** - Simple
2. **Feature branches for each mode** - Isolated
3. **Tiered branches** - Base + feature branches

**Decision**: Option 3 - Tiered branch structure

**Rationale**:
- `claude/phase3-base` - Core mode system (Tasks 1.1, 1.2)
- `claude/phase3-timeattack` - Branches from base
- `claude/phase3-endless` - Branches from base
- Can merge modes incrementally
- Can test each mode independently
- Clear history of what went where

**Branch Plan**:
```
main (untouched)
└── claude/phase3-base
    ├── claude/phase3-timeattack
    ├── claude/phase3-endless
    ├── claude/phase3-stats
    └── claude/phase3-final (merge all)
```

---

### [D008] Testing Strategy
**Date**: 2025-11-10
**Context**: No automated UI tests, need quality assurance

**Options Considered**:
1. **Write full test suite** - Time-intensive
2. **Manual testing checklist** - Practical
3. **No testing** - Risky

**Decision**: Option 2 - Comprehensive manual testing checklist

**Rationale**:
- Phase 3 is UI-heavy (hard to unit test)
- Manual testing more appropriate for game feel
- Checklist ensures consistency
- Each mode gets full test pass
- Document test results

**Testing Protocol**:
- ✅ Build succeeds
- ✅ Each mode playable start to finish
- ✅ No regressions in existing features
- ✅ Mobile touch works
- ✅ All UI elements render correctly
- ✅ Stats save/load correctly
- ✅ Difficulty modes work in all game modes

---

### [D009] Scope Management for Autonomous Development
**Date**: 2025-11-10
**Context**: Large feature set, finite time/context

**Options Considered**:
1. **Implement everything (Phase 3E included)** - Ambitious
2. **Core modes only (Phase 3A-D)** - Realistic
3. **Minimum viable (just one new mode)** - Too minimal

**Decision**: Option 2 - Focus on Phase 3A-D, treat 3E as stretch

**Rationale**:
- Core modes (Classic, Time Attack, Endless) are highest value
- Statistics add replay value
- Challenge/Zen/Achievements are "nice to have"
- Better to ship polished core than rushed everything
- Can always add more modes later

**Success Criteria**:
- ✅ 3 fully functional modes
- ✅ Mode selection UI
- ✅ Statistics tracking
- ✅ All features tested
- ✅ Documentation complete

**Stretch Goals**:
- ⭐ Challenge mode
- ⭐ Zen mode
- ⭐ Achievements

---

## Decision Summary

**Critical Decisions**:
- D001: Mode config pattern (affects architecture)
- D003: Endless viewport strategy (affects rendering)
- D007: Branch strategy (affects workflow)

**Important Decisions**:
- D002: Mode selection UI
- D004: Stats storage
- D009: Scope management

**Minor Decisions**:
- D005: Per-mode high scores
- D006: Timer display
- D008: Testing strategy

---

**Next Steps**:
1. ✅ Create remaining planning docs
2. ⏳ Set up branch structure
3. ⏳ Begin Task 1.1 implementation

**Last Updated**: 2025-11-10 00:02
