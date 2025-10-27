import { GameState, Block, calculateTimePerColumn, calculateOscillationTime, saveHighScore } from './gameState';

// Update position (smooth movement)
export function updatePosition(state: GameState, deltaTime: number): GameState {
  const timePerColumn = calculateTimePerColumn(state.oscillationTime, state.gridWidth);
  const columnsMoved = deltaTime / timePerColumn;

  let newPosition = state.position;
  let newDirection = state.direction;

  if (state.direction === 'right') {
    newPosition += columnsMoved;

    // Reached right edge, reverse
    if (newPosition >= state.gridWidth - 1) {
      newPosition = state.gridWidth - 1 - (newPosition - (state.gridWidth - 1));
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

// Check alignment between moving blocks and placed blocks using overlap logic
// Blocks move as a UNIT, and we calculate overlap between the moving unit and base unit
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

  // Calculate the continuous range occupied by base blocks
  // Each block at column X occupies the range [X, X+1)
  const baseColumns = baseBlocks.map(b => b.column);
  const baseMin = Math.min(...baseColumns);
  const baseMax = Math.max(...baseColumns) + 1; // +1 because block extends to next column

  // Check each moving block based on overlap with base range
  const aligned: Block[] = [];
  const trimmed: Block[] = [];

  movingBlocks.forEach(movingBlock => {
    // Calculate the range this moving block occupies
    const blockStart = movingBlock.column;
    const blockEnd = movingBlock.column + 1;

    // Calculate overlap between this block and the base range
    const overlapStart = Math.max(blockStart, baseMin);
    const overlapEnd = Math.min(blockEnd, baseMax);
    const overlapWidth = Math.max(0, overlapEnd - overlapStart);

    // Tolerance affects the minimum overlap required
    // Higher tolerance = lower overlap needed
    // tolerance 0.45 (easy) -> need 0.3 overlap (30%)
    // tolerance 0.35 (normal) -> need 0.4 overlap (40%)
    // tolerance 0.25 (arcade) -> need 0.5 overlap (50%)
    const minOverlapRequired = 0.75 - tolerance;

    if (overlapWidth >= minOverlapRequired) {
      // Block has sufficient support - find nearest base block to snap to
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
      // Block overhangs too much - trim it
      trimmed.push(movingBlock);
    }
  });

  return { aligned, trimmed };
}

// Place blocks and check game state
export function placeBlocks(state: GameState): GameState {
  const currentRow = state.level;

  // Convert moving blocks positions to block objects (use actual position with decimals)
  const movingBlocksAtCurrentPosition = state.movingBlocks.map(mb => ({
    column: state.position + mb.column, // Keep decimal position for tolerance check
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

  // Create new moving blocks for next level (unless game won)
  let newMovingBlocks: Block[] = [];
  if (!won) {
    newMovingBlocks = aligned.map(b => ({
      column: b.column - Math.min(...aligned.map(ab => ab.column)), // Normalize to start at 0
      row: currentRow + 1,
      placed: false
    }));
  }

  // Use (currentRow + 1) for scoring so row 0 gives points
  const newScore = state.score + (aligned.length * 10 * (currentRow + 1));
  saveHighScore(newScore);

  return {
    ...state,
    blocks: newBlocks,
    movingBlocks: newMovingBlocks,
    level: currentRow + 1,
    score: newScore,
    perfectPlacements: aligned.length === state.movingBlocks.length ?
      state.perfectPlacements + 1 : state.perfectPlacements,
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

  // Freeze blocks and check placement
  const newState = placeBlocks({
    ...state,
    pressTime: pressTime
  });

  return newState;
}
