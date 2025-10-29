# Fair Scoring System for Global Leaderboard

## Overview

This scoring system is designed to be **fair across all difficulty modes** to enable a global leaderboard where players on different settings can compete fairly.

## Scoring Components

### 1. Base Points
```
basePoints = blocks × 10 × (level + 1) × difficultyMultiplier
```

**Difficulty Multipliers:**
- Carnivale -30%: **0.8x** (slowest, easiest)
- Carnivale -25%: **0.85x**
- Carnivale -20%: **0.9x**
- Easy: **1.0x** (baseline)
- Normal: **1.2x** (faster, moderate tolerance)
- Arcade: **1.5x** (fastest, strictest tolerance)

**Why this is fair:** Harder difficulties have faster speeds and stricter alignment tolerance, making them objectively more challenging. The multiplier compensates for this increased difficulty.

### 2. Speed Bonus (0-100 points per placement)
```
speedBonus = (1 - timeTaken / expectedTime) × 100
```

- **timeTaken**: Time from last update to button press
- **expectedTime**: One full oscillation period
- Rewards quick, decisive placements
- Capped at 100 points to prevent extreme variance

**Why this is fair:** Speed requirements scale with difficulty (faster modes = less time available), so the bonus is relative to the difficulty's oscillation time.

### 3. Combo Multiplier (up to 1.5x on base points)
```
comboMultiplier = min(1 + (comboStreak × 0.1), 1.5)
comboBonus = basePoints × (comboMultiplier - 1)
```

- Starts at 1.0x (no bonus)
- Increases by 0.1x per consecutive perfect placement
- Caps at 1.5x (5+ perfect placements in a row)
- Resets to 0 if any blocks are trimmed

**Why this is fair:** Rewards consistency regardless of difficulty. Perfect placements are harder on higher difficulties, but the combo reward is the same.

## Total Score Formula

```
placementScore = floor(basePoints + speedBonus + comboBonus)
totalScore = sum of all placementScores
```

## Spawn Mode Impact

### Reset Left Mode
- Blocks always spawn from position 0
- Adds challenge: must wait for full oscillation
- Slightly increases expected time, slightly reducing speed bonus

### Resume Mode (Default)
- Blocks continue from last placement position
- Can place quickly if positioned well
- Higher potential speed bonuses

**Fairness:** Both modes available to all players. Score multipliers are the same. Player choice of strategy.

## Why This System is Fair

1. **Difficulty Compensation**: Harder modes get higher multipliers
2. **Relative Rewards**: Speed and combo bonuses scale with difficulty
3. **Skill-Based**: Rewards precision, speed, and consistency
4. **Capped Variance**: Speed bonus capped to prevent extreme outliers
5. **Transparent**: All calculations visible and deterministic

## Score Breakdown Display

Players can see:
- **Total Score**: Final leaderboard score
- **Combo Streak**: Current consecutive perfect placements
- **Total Speed Bonus**: Accumulated speed bonus points

This transparency helps players understand and optimize their strategy.

## Example Calculations

### Easy Mode (Level 0, 3 blocks, perfect, medium speed)
- Base: 3 × 10 × 1 × 1.0 = **30**
- Speed: 50% of max = **50**
- Combo: 1st perfect = 30 × 0.1 = **3**
- **Total: 83 points**

### Arcade Mode (Level 0, 3 blocks, perfect, fast)
- Base: 3 × 10 × 1 × 1.5 = **45**
- Speed: 80% of max = **80**
- Combo: 1st perfect = 45 × 0.1 = **4.5**
- **Total: 129 points**

Arcade gives ~55% more points for the same achievement, which is fair given the increased difficulty.

## Global Leaderboard Integrity

- Scores are directly comparable across all settings
- Difficulty multipliers balance the challenge vs reward
- No "gaming the system" by choosing easier modes
- Skill, precision, and consistency always rewarded

---

**Generated for BlockStacker v1.0**
Fair Play Certified ✅
