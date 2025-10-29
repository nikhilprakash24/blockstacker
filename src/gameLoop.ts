import { GameState, Block, calculateTimePerColumn, calculateOscillationTime, saveHighScore, DIFFICULTIES } from './gameState';

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

  // Check for win conditions
  const minorPrizeReached = currentRow === state.minorPrizeRow;
  const won = currentRow === state.majorPrizeRow;

  // Calculate if this was a perfect placement
  const isPerfect = aligned.length === state.movingBlocks.length;

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

  return {
    ...state,
    blocks: newBlocks,
    movingBlocks: newMovingBlocks,
    level: currentRow + 1,
    position: newPosition,
    score: newScore,
    perfectPlacements: isPerfect ? state.perfectPlacements + 1 : state.perfectPlacements,
    comboStreak: newComboStreak,
    totalSpeedBonus: newTotalSpeedBonus,
    minorPrizeReached: minorPrizeReached || state.minorPrizeReached,
    won: won,
    gameOver: won,
    // Use (currentRow + 2) for speed calc (next level after placement)
    oscillationTime: calculateOscillationTime(currentRow + 2, state.difficulty)
  };
}

// Main game loop
export function gameLoop(state: GameState): GameState {
  if (state.gameOver || state.paused) {
    return state;
  }

  const currentTime = Date.now();
  const deltaTime = currentTime - state.lastUpdate;

  // Update block position
  const updatedState = updatePosition(state, deltaTime);

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
