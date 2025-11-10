import { GameState, Block, FallingBlock, SquashEffect, Particle, ScreenShake, ColorFlash, LevelUpEffect, calculateTimePerColumn, calculateOscillationTime, saveHighScore, DIFFICULTIES, MODE_CONFIGS } from './gameState';

// Constants for rendering
const CELL_SIZE = 40;
const GRID_MARGIN_LEFT = 120;
const GRID_MARGIN_TOP = 100;

// Create screen shake effect
export function createScreenShake(intensity: number): ScreenShake {
  const baseDuration = 300; // 300ms base shake
  const duration = baseDuration * intensity;

  return {
    offsetX: 0,
    offsetY: 0,
    intensity: intensity,
    duration: duration
  };
}

// Update screen shake (dampen over time, apply random offset)
export function updateScreenShake(state: GameState, deltaTime: number): GameState {
  if (!state.screenShake) {
    return state;
  }

  const shake = state.screenShake;
  const newDuration = shake.duration - deltaTime;

  // Shake finished
  if (newDuration <= 0) {
    return {
      ...state,
      screenShake: null
    };
  }

  // Calculate new intensity (ease out)
  const newIntensity = newDuration / 300; // Normalize to original duration

  // Apply random offset based on intensity
  const maxOffset = 8 * newIntensity; // Max 8 pixels at full intensity
  const newOffsetX = (Math.random() - 0.5) * 2 * maxOffset;
  const newOffsetY = (Math.random() - 0.5) * 2 * maxOffset;

  return {
    ...state,
    screenShake: {
      ...shake,
      offsetX: newOffsetX,
      offsetY: newOffsetY,
      intensity: newIntensity,
      duration: newDuration
    }
  };
}

// Create color flash effect
export function createColorFlash(color: string): ColorFlash {
  return {
    color: color,
    opacity: 0.4, // Start at 40% opacity
    duration: 200 // 200ms flash
  };
}

// Update color flash (fade out)
export function updateColorFlash(state: GameState, deltaTime: number): GameState {
  if (!state.colorFlash) {
    return state;
  }

  const flash = state.colorFlash;
  const newDuration = flash.duration - deltaTime;

  // Flash finished
  if (newDuration <= 0) {
    return {
      ...state,
      colorFlash: null
    };
  }

  // Fade out linearly
  const newOpacity = (newDuration / 200) * 0.4; // From 0.4 to 0

  return {
    ...state,
    colorFlash: {
      ...flash,
      opacity: newOpacity,
      duration: newDuration
    }
  };
}

// Create particle burst at a specific position
export function createParticleBurst(x: number, y: number, color: string, count: number): Particle[] {
  const particles: Particle[] = [];
  const lifetime = 800; // 800ms particle lifetime

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const speed = 100 + Math.random() * 100; // 100-200 pixels/second

    particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: color,
      size: 3 + Math.random() * 3, // 3-6 pixels
      lifetime: lifetime,
      maxLifetime: lifetime
    });
  }

  return particles;
}

// Update particles (movement, fade, remove dead)
export function updateParticles(state: GameState, deltaTime: number): GameState {
  const deltaSeconds = deltaTime / 1000;
  const gravity = 200; // Particles fall slightly (pixels/s²)

  const updatedParticles = state.particles
    .map(p => ({
      ...p,
      x: p.x + p.vx * deltaSeconds,
      y: p.y + p.vy * deltaSeconds,
      vy: p.vy + gravity * deltaSeconds, // Apply gravity
      lifetime: p.lifetime - deltaTime
    }))
    .filter(p => p.lifetime > 0);

  return {
    ...state,
    particles: updatedParticles
  };
}

// Update squash effects (decrease intensity over time)
export function updateSquashEffects(state: GameState, deltaTime: number): GameState {
  const squashDuration = 200; // Total squash animation duration in ms

  const updatedSquashEffects = state.squashEffects
    .map(effect => ({
      ...effect,
      duration: effect.duration - deltaTime,
      // Ease out: intensity decreases as duration runs out
      intensity: Math.max(0, effect.duration - deltaTime) / squashDuration
    }))
    .filter(effect => effect.duration > 0); // Remove completed effects

  return {
    ...state,
    squashEffects: updatedSquashEffects
  };
}

// Create level-up effect
export function createLevelUpEffect(level: number): LevelUpEffect {
  return {
    level: level,
    opacity: 1.0, // Start fully visible
    scale: 0.5, // Start small, will grow
    duration: 1200 // 1.2 second effect
  };
}

// Update level-up effect (fade out and scale up)
export function updateLevelUpEffect(state: GameState, deltaTime: number): GameState {
  if (!state.levelUpEffect) {
    return state;
  }

  const effect = state.levelUpEffect;
  const newDuration = effect.duration - deltaTime;

  // Effect finished
  if (newDuration <= 0) {
    return {
      ...state,
      levelUpEffect: null
    };
  }

  // Progress through animation (0 at end, 1 at start)
  const progress = newDuration / 1200;

  // Scale up from 0.5 to 1.5 (ease-out cubic)
  const easeProgress = 1 - progress;
  const easedProgress = 1 - Math.pow(1 - easeProgress, 3);
  const newScale = 0.5 + (easedProgress * 1.0); // 0.5 -> 1.5

  // Fade out in last 30% of animation
  let newOpacity = 1.0;
  if (progress < 0.3) {
    newOpacity = progress / 0.3; // Fade out
  }

  return {
    ...state,
    levelUpEffect: {
      ...effect,
      opacity: newOpacity,
      scale: newScale,
      duration: newDuration
    }
  };
}

// Update falling blocks (gravity + fade effect)
export function updateFallingBlocks(state: GameState, deltaTime: number): GameState {
  const deltaSeconds = deltaTime / 1000;
  const gravity = 8; // rows per second^2
  const fadeSpeed = 2.0; // opacity per second

  const updatedFallingBlocks = state.fallingBlocks
    .map(fb => ({
      ...fb,
      velocity: fb.velocity + gravity * deltaSeconds, // Apply gravity
      row: fb.row - fb.velocity * deltaSeconds, // Move down (row decreases as it falls)
      opacity: Math.max(0, fb.opacity - fadeSpeed * deltaSeconds) // Fade out
    }))
    .filter(fb => fb.row > -2); // Remove blocks that fell off screen

  return {
    ...state,
    fallingBlocks: updatedFallingBlocks
  };
}

// Update position (smooth movement)
export function updatePosition(state: GameState, deltaTime: number): GameState {
  const timePerColumn = calculateTimePerColumn(state.oscillationTime, state.gridWidth);
  const columnsMoved = deltaTime / timePerColumn;

  // Calculate max position based on the span of moving blocks (not just count)
  // Blocks might have gaps after trimming, e.g., [{column: 0}, {column: 2}]
  const maxMovingBlockColumn = state.movingBlocks.length > 0
    ? Math.max(...state.movingBlocks.map(b => b.column))
    : 0;
  const blockSpan = maxMovingBlockColumn + 1; // +1 because column 2 occupies space up to position 3
  const maxPosition = state.gridWidth - blockSpan;

  let newPosition = state.position;
  let newDirection = state.direction;

  if (state.direction === 'right') {
    newPosition += columnsMoved;

    // Reached right edge, reverse
    if (newPosition >= maxPosition) {
      newPosition = maxPosition - (newPosition - maxPosition);
      newDirection = 'left';
    }
  } else {
    newPosition -= columnsMoved;

    // Reached left edge, reverse
    if (newPosition < 0) {
      newPosition = Math.abs(newPosition);
      newDirection = 'right';
    }
  }

  return {
    ...state,
    position: newPosition,
    direction: newDirection
  };
}

// Check alignment using continuous platform + discrete blocks + overhang threshold
// Base blocks form a continuous platform, moving blocks are discrete and can overhang
function checkAlignment(
  movingBlocks: Block[],
  placedBlocks: Block[],
  currentRow: number,
  tolerance: number
): {
  aligned: Block[],
  trimmed: Block[]
} {
  // Get all blocks in the row below (the base for alignment)
  const baseBlocks = placedBlocks.filter(b => b.row === currentRow - 1);

  // If first row (no base blocks), all moving blocks are aligned
  if (baseBlocks.length === 0) {
    return {
      aligned: movingBlocks.map(b => ({ ...b, placed: true, row: currentRow })),
      trimmed: []
    };
  }

  // BASE = CONTINUOUS PLATFORM
  // Calculate the continuous platform formed by base blocks
  const baseColumns = baseBlocks.map(b => b.column);
  const platformStart = Math.min(...baseColumns); // Left edge of platform
  const platformEnd = Math.max(...baseColumns) + 1; // Right edge of platform

  // MOVING BLOCKS = DISCRETE with OVERHANG THRESHOLD
  const aligned: Block[] = [];
  const trimmed: Block[] = [];

  // Tolerance controls maximum allowed overhang
  // tolerance 0.45 (easy) -> allow 0.75 (75%) overhang = need 25% support
  // tolerance 0.35 (normal) -> allow 0.65 (65%) overhang = need 35% support
  // tolerance 0.25 (arcade) -> allow 0.55 (55%) overhang = need 45% support
  const maxOverhangAllowed = 0.3 + tolerance;

  movingBlocks.forEach(movingBlock => {
    // Each discrete block occupies [column, column+1)
    const blockLeft = movingBlock.column;
    const blockRight = movingBlock.column + 1;

    // Calculate how much of this block is supported by the platform
    const supportedLeft = Math.max(blockLeft, platformStart);
    const supportedRight = Math.min(blockRight, platformEnd);
    const supportedWidth = Math.max(0, supportedRight - supportedLeft);

    // Calculate overhang (portion NOT on platform)
    const overhang = 1.0 - supportedWidth;

    if (overhang <= maxOverhangAllowed) {
      // Block has acceptable overhang - keep it!
      // Snap to nearest base column for placement
      const nearestBase = baseBlocks.reduce((nearest, base) => {
        const distToNearest = Math.abs(nearest.column - movingBlock.column);
        const distToBase = Math.abs(base.column - movingBlock.column);
        return distToBase < distToNearest ? base : nearest;
      });

      aligned.push({
        ...movingBlock,
        column: nearestBase.column,
        placed: true,
        row: currentRow
      });
    } else {
      // Block overhangs too much - it falls off!
      trimmed.push(movingBlock);
    }
  });

  return { aligned, trimmed };
}

// Place blocks and check game state
export function placeBlocks(state: GameState): GameState {
  const currentRow = state.level;

  // Clamp position to ensure blocks don't go out of bounds
  // Use block span (not just count) to handle gaps in block positions
  const maxMovingBlockColumn = state.movingBlocks.length > 0
    ? Math.max(...state.movingBlocks.map(b => b.column))
    : 0;
  const blockSpan = maxMovingBlockColumn + 1;
  const maxPosition = state.gridWidth - blockSpan;
  const clampedPosition = Math.max(0, Math.min(state.position, maxPosition));

  // Convert moving blocks positions to block objects (use actual position with decimals)
  const movingBlocksAtCurrentPosition = state.movingBlocks.map(mb => ({
    column: clampedPosition + mb.column, // Keep decimal position for overhang calculation
    row: currentRow,
    placed: false
  }));

  // Check alignment with blocks below (with tolerance)
  const { aligned, trimmed } = checkAlignment(
    movingBlocksAtCurrentPosition,
    state.blocks,
    currentRow,
    state.alignmentTolerance
  );

  // Game over if no blocks aligned
  if (aligned.length === 0) {
    saveHighScore(state.score);
    return {
      ...state,
      gameOver: true,
      movingBlocks: []
    };
  }

  // Add aligned blocks to placed blocks
  const newBlocks = [...state.blocks, ...aligned];

  // Convert trimmed blocks to falling blocks with animation state
  const newFallingBlocks: FallingBlock[] = trimmed.map(block => ({
    column: block.column, // Keep decimal position
    row: currentRow,
    velocity: 0, // Start with zero velocity, gravity will accelerate
    opacity: 1.0 // Start fully visible
  }));

  // Create squash effects for newly placed blocks
  const squashDuration = 200; // ms
  const newSquashEffects: SquashEffect[] = aligned.map(block => ({
    column: block.column,
    row: block.row,
    intensity: 1.0, // Start at maximum squash
    duration: squashDuration
  }));

  // Check for win conditions (only for modes with prizes)
  const modeConfig = MODE_CONFIGS[state.gameMode];
  const minorPrizeReached = modeConfig.hasPrizes && currentRow === state.minorPrizeRow;
  const won = modeConfig.hasPrizes && currentRow === state.majorPrizeRow;

  // Calculate if this was a perfect placement
  const isPerfect = aligned.length === state.movingBlocks.length;

  // Create particle burst for perfect placements
  let newParticles: Particle[] = [];
  if (isPerfect && aligned.length > 0) {
    // Calculate center position of aligned blocks
    const avgColumn = aligned.reduce((sum, b) => sum + b.column, 0) / aligned.length;
    const pixelX = GRID_MARGIN_LEFT + avgColumn * CELL_SIZE + CELL_SIZE / 2;
    const pixelY = GRID_MARGIN_TOP + (state.gridHeight - 1 - currentRow) * CELL_SIZE + CELL_SIZE / 2;

    // Spawn particles based on combo streak (more particles for higher combos)
    const particleCount = Math.min(12 + state.comboStreak * 3, 30);
    const color = state.comboStreak > 5 ? '#ffd700' : '#00ffff'; // Gold for high combo, cyan otherwise
    newParticles = createParticleBurst(pixelX, pixelY, color, particleCount);
  }

  // Create screen shake on block placement
  // Intensity scales with number of blocks placed and combo
  const shakeIntensity = Math.min(0.3 + (aligned.length / 10) + (state.comboStreak * 0.1), 1.0);
  const newScreenShake = createScreenShake(shakeIntensity);

  // Create level-up effect (show the new level number)
  const newLevelUpEffect = createLevelUpEffect(currentRow + 1);

  // --- NEW SCORING SYSTEM ---
  const config = DIFFICULTIES[state.difficulty];

  // 1. Base points: blocks × 10 × level × difficulty multiplier
  const basePoints = aligned.length * 10 * (currentRow + 1) * config.scoreMultiplier;

  // 2. Speed bonus: Based on how quickly they placed (max 100 points per placement)
  const timeSinceLastUpdate = state.pressTime - state.lastUpdate;
  const expectedTime = state.oscillationTime; // One full oscillation
  const speedRatio = Math.max(0, 1 - (timeSinceLastUpdate / expectedTime));
  const speedBonus = Math.floor(speedRatio * 100);

  // 3. Combo multiplier: Consecutive perfect placements (up to 5x)
  const newComboStreak = isPerfect ? state.comboStreak + 1 : 0;
  const comboMultiplier = Math.min(1 + (newComboStreak * 0.1), 1.5); // 1.0 to 1.5x
  const comboBonus = Math.floor(basePoints * (comboMultiplier - 1));

  // Create color flash at combo milestones
  let newColorFlash: ColorFlash | null = null;
  if (newComboStreak === 3) {
    newColorFlash = createColorFlash('#00ffff'); // Cyan flash at 3x combo
  } else if (newComboStreak === 5) {
    newColorFlash = createColorFlash('#ffd700'); // Gold flash at 5x combo
  } else if (newComboStreak === 10) {
    newColorFlash = createColorFlash('#ff00ff'); // Magenta flash at 10x combo
  } else if (newComboStreak >= 15) {
    newColorFlash = createColorFlash('#ffffff'); // White flash at 15+ combo
  }

  // Total score for this placement
  const placementScore = Math.floor(basePoints + speedBonus + comboBonus);
  const newScore = state.score + placementScore;
  const newTotalSpeedBonus = state.totalSpeedBonus + speedBonus;

  saveHighScore(newScore);

  // Create new moving blocks for next level (unless game won)
  let newMovingBlocks: Block[] = [];
  let newPosition = state.position;

  if (!won) {
    if (state.spawnMode === 'reset-left') {
      // RESET LEFT: Always start from left edge (position 0)
      newMovingBlocks = aligned.map(b => ({
        column: b.column - Math.min(...aligned.map(ab => ab.column)), // Normalize to start at 0
        row: currentRow + 1,
        placed: false
      }));
      newPosition = 0; // Reset position to left
    } else {
      // RESUME: Continue from where blocks were placed
      newMovingBlocks = aligned.map(b => ({
        column: b.column - Math.min(...aligned.map(ab => ab.column)), // Normalize to start at 0
        row: currentRow + 1,
        placed: false
      }));
      // Position stays where it was
    }
  }

  // Update Endless mode camera and height tracking
  const newMaxHeightReached = Math.max(state.maxHeightReached, currentRow + 1);

  // For Endless mode, pan camera up as player progresses
  // Camera offset keeps player centered (show ~5 rows below current position)
  let newCameraOffsetY = state.cameraOffsetY;
  if (modeConfig.hasHeightLimit === false) {
    // Calculate desired camera position to keep player roughly centered
    // gridHeight = 15, so show player around row 10 (5 rows from top)
    const targetRow = currentRow + 1 - 10; // Keep 10 rows visible below
    if (targetRow > 0) {
      // Camera offset in grid rows (positive = move up)
      newCameraOffsetY = targetRow;
    }
  }

  return {
    ...state,
    blocks: newBlocks,
    movingBlocks: newMovingBlocks,
    fallingBlocks: [...state.fallingBlocks, ...newFallingBlocks], // Add new falling blocks
    squashEffects: [...state.squashEffects, ...newSquashEffects], // Add new squash effects
    particles: [...state.particles, ...newParticles], // Add new particles
    screenShake: newScreenShake, // Add screen shake effect
    colorFlash: newColorFlash || state.colorFlash, // Add color flash if milestone reached
    levelUpEffect: newLevelUpEffect, // Add level-up effect
    level: currentRow + 1,
    position: newPosition,
    blockSpawnTime: newMovingBlocks.length > 0 ? Date.now() : state.blockSpawnTime, // Update spawn time when new blocks created
    score: newScore,
    perfectPlacements: isPerfect ? state.perfectPlacements + 1 : state.perfectPlacements,
    comboStreak: newComboStreak,
    totalSpeedBonus: newTotalSpeedBonus,
    minorPrizeReached: minorPrizeReached || state.minorPrizeReached,
    won: won,
    gameOver: won,
    // Use (currentRow + 2) for speed calc (next level after placement)
    oscillationTime: calculateOscillationTime(currentRow + 2, state.difficulty),
    // Endless mode fields
    cameraOffsetY: newCameraOffsetY,
    maxHeightReached: newMaxHeightReached
  };
}

// Update display score animation (count-up effect)
export function updateDisplayScore(state: GameState): GameState {
  const scoreDiff = state.score - state.displayScore;

  // Already at target
  if (scoreDiff === 0) {
    return state;
  }

  // Calculate increment speed (faster for larger differences, minimum 1)
  // This creates a satisfying count-up that's fast but visible
  const increment = Math.max(1, Math.ceil(Math.abs(scoreDiff) * 0.15));

  // Move displayScore towards score
  let newDisplayScore = state.displayScore;
  if (scoreDiff > 0) {
    newDisplayScore = Math.min(state.score, state.displayScore + increment);
  } else {
    newDisplayScore = Math.max(state.score, state.displayScore - increment);
  }

  return {
    ...state,
    displayScore: newDisplayScore
  };
}

// Update Time Attack timer (countdown)
export function updateTimeAttackTimer(state: GameState, deltaTime: number): GameState {
  // Only update timer for Time Attack mode
  if (state.gameMode !== 'timeAttack' || state.timeRemaining === null) {
    return state;
  }

  // Convert deltaTime from ms to seconds
  const deltaSeconds = deltaTime / 1000;
  const newTimeRemaining = Math.max(0, state.timeRemaining - deltaSeconds);

  // Check if time's up
  if (newTimeRemaining === 0 && state.timeRemaining > 0) {
    // Time's up! Game over
    saveHighScore(state.score);
    return {
      ...state,
      timeRemaining: 0,
      gameOver: true
    };
  }

  return {
    ...state,
    timeRemaining: newTimeRemaining
  };
}

// Main game loop
export function gameLoop(state: GameState): GameState {
  const currentTime = Date.now();
  const deltaTime = currentTime - state.lastUpdate;

  let updatedState = state;

  // Update Time Attack timer (if applicable)
  updatedState = updateTimeAttackTimer(updatedState, deltaTime);

  // Update visual effects (always update, even when game is over)
  updatedState = updateFallingBlocks(updatedState, deltaTime);
  updatedState = updateSquashEffects(updatedState, deltaTime);
  updatedState = updateParticles(updatedState, deltaTime);
  updatedState = updateScreenShake(updatedState, deltaTime);
  updatedState = updateColorFlash(updatedState, deltaTime);
  updatedState = updateLevelUpEffect(updatedState, deltaTime);
  updatedState = updateDisplayScore(updatedState); // Animate score count-up

  // Only update block position if game is active
  if (!state.gameOver && !state.paused) {
    updatedState = updatePosition(updatedState, deltaTime);
  }

  return {
    ...updatedState,
    lastUpdate: currentTime
  };
}

// Handle button press
export function handleButtonPress(state: GameState): GameState {
  if (state.gameOver || state.paused) {
    return state;
  }

  // Record press time
  const pressTime = Date.now();

  // Check for 1-second cooldown after continuing from prize screen
  if (state.continueTime > 0 && pressTime - state.continueTime < 1000) {
    // Still in cooldown period, ignore button press
    return state;
  }

  // Freeze blocks and check placement
  const newState = placeBlocks({
    ...state,
    pressTime: pressTime
  });

  return newState;
}
