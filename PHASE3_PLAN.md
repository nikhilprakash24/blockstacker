# Phase 3: Game Modes & Content Expansion

**Branch:** `claude/phase-3-game-modes-011CUyxxAcJYCdjbceojkY2P`
**Start Date:** 2025-11-10
**Goal:** Transform single-mode game into multi-mode experience with progression system
**Estimated Scope:** 10-15 major features

---

## Executive Summary

Phase 3 adds **replayability** and **variety** to Block Stacker. Instead of one game mode, players will have:
- 5 distinct game modes (each with unique rules/goals)
- Achievements system (20+ achievements)
- Daily challenges (refreshes every 24h)
- Statistics tracking (persistent progress)
- Unlockable content (skins, themes, sound packs - future)

**Success Metric:** Average session length increases by 3x, return rate increases by 2x.

---

## Part 1: Game Mode System Architecture

### 1.1 Game Mode Interface

**New Type Definition** (`src/gameState.ts`):
```typescript
export type GameMode =
  | 'classic'      // Current mode (reach level 15)
  | 'time-attack'  // Score as much as possible in 2 minutes
  | 'endless'      // Play forever, increasing difficulty
  | 'challenge'    // Specific scenarios with constraints
  | 'zen'          // No score, no timer, relaxing practice

export interface GameModeConfig {
  id: GameMode;
  name: string;
  description: string;
  icon: string; // Emoji
  rules: {
    hasTimer?: boolean;
    timerDuration?: number; // seconds
    hasLevelGoal?: boolean;
    levelGoal?: number;
    scoreMultiplier?: number;
    difficultyProgression?: 'static' | 'increasing' | 'decreasing';
  };
  unlocked: boolean; // Progression-based unlocking
}
```

### 1.2 Game Mode Selector

**Location:** New screen between start screen and game
**UI Components:**
- Grid of mode cards (5 modes)
- Each card shows: Icon, Name, Best Score, "Locked" overlay if not unlocked
- Tappable to select
- "How to Play" modal specific to each mode

**Unlock Progression:**
- Classic: Always unlocked
- Time Attack: Unlock after reaching level 10 in Classic
- Endless: Unlock after completing Classic (reach level 15)
- Challenge: Unlock after 3 achievements
- Zen: Unlock after 10 total games played

---

## Part 2: Mode Implementations

### 2.1 Classic Mode (Already Exists)
**Status:** ✅ Complete
**No changes needed** - this is current gameplay

### 2.2 Time Attack Mode

**Goal:** Score as many points as possible in 2 minutes

**Rule Changes:**
- Timer: 120 seconds countdown
- No level goal (play forever until time runs out)
- Speed multiplier: 1.5x (faster oscillation)
- Score multiplier: 2.0x (higher stakes)
- Game ends when timer hits 0
- Bonus: +10 seconds for every 5-combo

**UI Additions:**
- Large timer display at top (format: "1:47")
- Timer flashes red when < 10 seconds
- Timer turns gold when bonus time added
- Final screen shows: Time survived, Score, Highest level reached

**Implementation:**
```typescript
// Add to GameState
timerStartTime?: number;
timerDuration?: number;
timeRemaining?: number; // Updated each frame

// Add to gameLoop
if (state.gameMode === 'time-attack' && state.timeRemaining !== undefined) {
  const newTimeRemaining = state.timeRemaining - deltaTime;
  if (newTimeRemaining <= 0) {
    return { ...state, gameOver: true, timeRemaining: 0 };
  }
  // Check for combo bonus time
  if (newComboStreak === 5) {
    newTimeRemaining += 10000; // +10 seconds
  }
  return { ...state, timeRemaining: newTimeRemaining };
}
```

### 2.3 Endless Mode

**Goal:** Survive as long as possible with progressively harder difficulty

**Rule Changes:**
- No level limit (infinite levels)
- Difficulty increases every 5 levels:
  - Levels 1-5: Normal speed
  - Levels 6-10: +10% speed
  - Levels 11-15: +20% speed
  - Levels 16+: +30% speed, tolerance decreases
- Score multiplier increases with level: `1.0 + (level / 10)`
- Game ends only on missed placement

**UI Additions:**
- "Level X" display (no "/ 15" cap)
- "Difficulty: [Normal/Hard/Expert/Master]" indicator
- Color-coded level indicator:
  - Green: Levels 1-10
  - Yellow: Levels 11-20
  - Orange: Levels 21-30
  - Red: Levels 31+

**Implementation:**
```typescript
// Modify calculateOscillationTime for endless mode
if (state.gameMode === 'endless') {
  const difficultyTier = Math.floor(level / 5);
  const speedMultiplier = 1.0 + (difficultyTier * 0.1);
  baseTime = baseTime / speedMultiplier;
}

// Modify alignment tolerance
if (state.gameMode === 'endless' && level > 15) {
  tolerance -= (level - 15) * 0.01; // Stricter alignment
  tolerance = Math.max(tolerance, 0.15); // Minimum 0.15
}
```

### 2.4 Challenge Mode

**Goal:** Complete specific scenarios with constraints

**Challenges (10 scenarios to start):**

1. **Perfect Start**
   - Reach level 5 with 100% perfect placements
   - 3-star rating system (timing-based)

2. **Speed Demon**
   - Complete 10 levels in under 30 seconds
   - All placements must be instant (max speed bonus)

3. **No Trim Zone**
   - Reach level 8 with zero trimmed blocks
   - Combo streak never breaks

4. **One Shot**
   - Only 1 attempt at each level
   - No retries on missed placements
   - Reach level 10

5. **Big Stack**
   - Start with 5 blocks instead of 3
   - Reach level 7
   - Much harder alignment

6. **Moving Target**
   - Oscillation speed changes randomly every level
   - Reach level 8

7. **Narrow Escape**
   - Grid width reduced to 5 columns
   - Reach level 6

8. **Time Crunch**
   - 10 seconds per level
   - Complete 5 levels

9. **Combo Master**
   - Maintain 10+ combo streak for 5 consecutive levels
   - Single mistake = fail

10. **Precision**
    - Tolerance reduced to 0.15 (very strict)
    - Reach level 5

**UI:**
- Challenge selection screen (scrollable list)
- Each shows: Name, Description, Best Stars, Locked status
- Completion badges (Bronze/Silver/Gold stars)
- "Replay" button to try for better score

**Implementation:**
```typescript
export interface Challenge {
  id: string;
  name: string;
  description: string;
  rules: {
    customBlocks?: number;
    customGridWidth?: number;
    customTolerance?: number;
    customSpeed?: number;
    timeLimit?: number;
    mustBePerfect?: boolean;
    randomSpeed?: boolean;
  };
  goal: {
    levelToReach?: number;
    timeLimit?: number;
    noTrims?: boolean;
  };
  stars: 0 | 1 | 2 | 3; // Best completion
  unlocked: boolean;
}
```

### 2.5 Zen Mode

**Goal:** Relaxing practice with no pressure

**Rule Changes:**
- No score
- No timer
- No game over (can retry any level infinitely)
- No combo system
- Slow, comfortable oscillation speed (4s per cycle)
- Forgiving tolerance (0.5)
- No visual effects (minimal animations)
- Soothing color palette (pastels)

**UI:**
- Minimalist design
- "Take your time" message
- Current level indicator only
- "Exit Zen Mode" button

**Implementation:**
```typescript
if (state.gameMode === 'zen') {
  // On missed placement, don't game over
  if (aligned.length === 0) {
    // Just retry the same level
    return {
      ...state,
      movingBlocks: prevLevelBlocks, // Restore previous blocks
      position: 0
    };
  }

  // No score updates
  // No combo tracking
  // No sound effects (except placement)
}
```

---

## Part 3: Achievements System

### 3.1 Achievement Types

**Categories:**
1. **Progression** - Reach milestones
2. **Mastery** - Perfect performance
3. **Variety** - Try different modes
4. **Persistence** - Play many games
5. **Secret** - Hidden achievements

### 3.2 Achievement List (25 Total)

**Progression (7):**
1. **First Steps** - Complete level 1 (Always first achievement)
2. **Rising Star** - Reach level 5
3. **Halfway There** - Reach level 10
4. **Minor Victory** - Reach level 11 (minor prize)
5. **Major Champion** - Reach level 15 (major prize)
6. **Veteran** - Complete Classic mode 10 times
7. **Legend** - Complete Classic mode on Carnivale-20 difficulty

**Mastery (7):**
8. **Perfectionist** - Get 5 consecutive perfect placements
9. **Combo King** - Reach 10x combo streak
10. **Combo God** - Reach 15x combo streak
11. **Speed Racer** - Get max speed bonus 10 times in one game
12. **Flawless** - Complete a game with no trimmed blocks
13. **High Roller** - Score 5,000+ points in one game
14. **Master Scorer** - Score 10,000+ points in one game

**Variety (5):**
15. **Explorer** - Try all 5 game modes
16. **Time Lord** - Complete Time Attack mode
17. **Infinite** - Reach level 20 in Endless mode
18. **Challenger** - Complete any challenge with 3 stars
19. **Zen Master** - Play Zen mode for 10 minutes

**Persistence (3):**
20. **Dedicated** - Play 50 total games
21. **Addicted** - Play 100 total games
22. **Daily Player** - Play 7 days in a row

**Secret (3):**
23. **Lucky Number** - Score exactly 777 points
24. **Symmetry** - Complete a level with block positions forming perfect symmetry
25. **Speed Demon** - Complete Classic mode in under 60 seconds

### 3.3 Achievement UI

**Display:**
- Dedicated "Achievements" screen in main menu
- Grid of achievement cards
- Each shows: Icon, Name, Description, Progress bar, Locked/Unlocked
- Toast notification on unlock (slides in from top)
- Sound effect on unlock (fanfare)

**Storage:**
```typescript
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji
  category: 'progression' | 'mastery' | 'variety' | 'persistence' | 'secret';
  unlocked: boolean;
  unlockedAt?: number; // Timestamp
  progress?: number; // For progressive achievements (e.g., 7/10 games)
  progressMax?: number;
  secret?: boolean; // Hide description if not unlocked
}

// Persisted in localStorage
interface PlayerProgress {
  achievements: Achievement[];
  totalGamesPlayed: number;
  totalScore: number;
  highScores: Record<GameMode, number>;
  lastPlayedDate: string;
  streakDays: number;
}
```

---

## Part 4: Daily Challenges

### 4.1 Daily Challenge System

**Concept:**
- One new challenge every 24 hours
- Same challenge for all players globally
- Leaderboard (local high score comparison)
- Refreshes at midnight UTC

**Challenge Types:**
- Random seed for block spawning (deterministic)
- Specific difficulty setting
- Specific mode (Classic, Time Attack, Endless)
- Unique modifier (e.g., "Double Speed Day", "Perfect Only Day")

**Rewards:**
- Bonus achievement: "Daily Dedication" (complete 10 daily challenges)
- Badge on profile: "X-day streak"

### 4.2 Implementation

```typescript
export interface DailyChallenge {
  date: string; // YYYY-MM-DD
  seed: number; // For deterministic randomness
  mode: GameMode;
  difficulty: Difficulty;
  modifier?: {
    name: string;
    description: string;
    effect: (state: GameState) => GameState;
  };
  yourBestScore: number;
  completed: boolean;
}

// Generate daily challenge
function generateDailyChallenge(date: Date): DailyChallenge {
  const seed = date.getTime() / (1000 * 60 * 60 * 24); // Days since epoch
  const rng = seedRandom(seed);

  const modes: GameMode[] = ['classic', 'time-attack', 'endless'];
  const difficulties: Difficulty[] = ['easy', 'normal', 'arcade', 'carnivale-30'];

  return {
    date: date.toISOString().split('T')[0],
    seed: seed,
    mode: modes[Math.floor(rng() * modes.length)],
    difficulty: difficulties[Math.floor(rng() * difficulties.length)],
    yourBestScore: loadBestScore(date),
    completed: loadCompletedStatus(date)
  };
}
```

---

## Part 5: Statistics Tracking

### 5.1 Stats to Track

**Global Stats:**
- Total games played
- Total blocks placed
- Total score accumulated
- Highest score (overall)
- Highest combo streak (overall)
- Highest level reached (overall)
- Total play time (minutes)
- Perfect placements (total)
- Trimmed blocks (total)

**Per-Mode Stats:**
- Games played
- Best score
- Average score
- Fastest completion (Classic/Time Attack)
- Highest level (Endless)
- Win rate (Classic)

**Per-Difficulty Stats:**
- Games played
- Best score
- Win rate

### 5.2 Stats Display

**UI Screen:**
- "Statistics" button in main menu
- Tabbed interface: Global / By Mode / By Difficulty
- Charts/graphs (ASCII art or simple bars)
- "Share Stats" button (export to clipboard)

**Storage:**
```typescript
interface PlayerStatistics {
  global: {
    totalGamesPlayed: number;
    totalBlocksPlaced: number;
    totalScore: number;
    highestScore: number;
    highestCombo: number;
    highestLevel: number;
    totalPlayTimeMs: number;
    perfectPlacements: number;
    trimmedBlocks: number;
  };
  byMode: Record<GameMode, {
    gamesPlayed: number;
    bestScore: number;
    avgScore: number;
    fastestCompletionMs?: number;
    highestLevel?: number;
    wins?: number;
  }>;
  byDifficulty: Record<Difficulty, {
    gamesPlayed: number;
    bestScore: number;
    wins: number;
  }>;
}
```

---

## Implementation Roadmap

### Phase 3.1: Game Mode Infrastructure (Day 1)
1. ✅ Create PHASE3_PLAN.md (this document)
2. [ ] Add `GameMode` type to gameState.ts
3. [ ] Add `gameMode` field to GameState
4. [ ] Create game mode selector screen
5. [ ] Update start flow: Start → Mode Select → Game
6. [ ] Test mode switching

### Phase 3.2: Time Attack Mode (Day 2)
1. [ ] Add timer state fields
2. [ ] Implement countdown logic in gameLoop
3. [ ] Add timer UI component
4. [ ] Add bonus time on 5-combo
5. [ ] Test and balance (is 2 min right?)

### Phase 3.3: Endless Mode (Day 2-3)
1. [ ] Remove level cap
2. [ ] Implement progressive difficulty
3. [ ] Add difficulty tier indicators
4. [ ] Test balance (does it get too hard?)

### Phase 3.4: Challenge Mode (Day 3-4)
1. [ ] Create Challenge interface
2. [ ] Implement 10 challenge scenarios
3. [ ] Create challenge selector UI
4. [ ] Implement star rating system
5. [ ] Test each challenge (are they beatable?)

### Phase 3.5: Zen Mode (Day 4)
1. [ ] Implement no-fail mode
2. [ ] Create calm UI theme
3. [ ] Disable scoring/combos
4. [ ] Test relaxation factor

### Phase 3.6: Achievements System (Day 5)
1. [ ] Create Achievement interface
2. [ ] Define 25 achievements
3. [ ] Implement unlock logic
4. [ ] Create achievements screen UI
5. [ ] Add toast notifications
6. [ ] Persist in localStorage

### Phase 3.7: Statistics Tracking (Day 5-6)
1. [ ] Create Statistics interface
2. [ ] Add tracking to gameLoop
3. [ ] Create statistics screen UI
4. [ ] Add charts/visualizations
5. [ ] Persist in localStorage

### Phase 3.8: Daily Challenges (Day 6)
1. [ ] Implement daily challenge generation
2. [ ] Add seeded randomness
3. [ ] Create daily challenge UI
4. [ ] Test date transitions

### Phase 3.9: Testing & Polish (Day 7)
1. [ ] Playtest all modes
2. [ ] Balance difficulty curves
3. [ ] Fix bugs
4. [ ] Update documentation
5. [ ] Commit & push Phase 3

---

## Technical Considerations

### localStorage Schema

```typescript
// Keys used
'blockstacker_high_score'         // Classic mode high score (already exists)
'blockstacker_player_progress'    // Achievements, streaks, unlocks
'blockstacker_statistics'         // All stats
'blockstacker_daily_challenges'   // Daily challenge history
'blockstacker_mode_high_scores'   // High scores per mode
```

### Performance

- localStorage writes should be batched (debounced)
- Stats updates should be efficient (incremental)
- Achievement checks should be O(1) with quick exits
- Mode switching should be instant (no reloads)

### Mobile Considerations

- Mode selector must be touch-friendly
- Timer must be large and readable
- Achievement toasts must not block gameplay
- All new screens must be responsive

---

## Success Metrics

**Before Phase 3:**
- Average session: 5 minutes
- Return rate: 20% (1 in 5 players return)
- Games per session: 2-3

**After Phase 3 (Target):**
- Average session: 15+ minutes (3x increase)
- Return rate: 40%+ (2x increase)
- Games per session: 5-8
- Achievement unlock rate: 50% of players unlock at least 5 achievements
- Daily challenge participation: 30% of returning players

---

## Future Enhancements (Phase 4+)

**Not in Phase 3, but planned for future:**
- **Leaderboards** - Global, friends, local
- **Multiplayer** - Head-to-head, co-op
- **Unlockable skins** - Different block themes
- **Sound packs** - Alternative sound effects
- **Background themes** - Visual customization
- **Replay system** - Save and watch replays
- **Share scores** - Social media integration

---

## Questions for User

Before implementing, please confirm:
1. **Priority order** - Which mode should I implement first?
2. **Scope** - All 5 modes, or start with 2-3?
3. **Daily challenges** - Important for v1, or save for later?
4. **Achievements** - 25 total, or start with 10?
5. **Testing** - Do you want to playtest each mode before I continue?

---

**Document Status:** ✅ Complete and ready for implementation
**Next Step:** Await user confirmation, then begin Phase 3.1
**Estimated Time:** 7-10 days for full Phase 3 implementation
