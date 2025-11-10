import { GameState, Block, FallingBlock, SquashEffect, Particle, LevelUpEffect } from './gameState';

const CELL_SIZE = 40; // pixels
const GRID_MARGIN_LEFT = 120; // Space for prize labels on left
const GRID_MARGIN_TOP = 100; // Space for score display on top

// Alignment quality indicator colors (Flappy Bird-style instant feedback)
type AlignmentQuality = 'perfect' | 'good' | 'warning' | 'danger';

// Calculate alignment quality for visual feedback BEFORE placement
function calculateAlignmentQuality(
  movingBlocks: Block[],
  placedBlocks: Block[],
  currentPosition: number,
  currentRow: number,
  gridWidth: number,
  tolerance: number
): AlignmentQuality {
  // Get base blocks from row below
  const baseBlocks = placedBlocks.filter(b => b.row === currentRow - 1);

  // First row is always perfect (no base to compare to)
  if (baseBlocks.length === 0) {
    return 'perfect';
  }

  // Calculate platform boundaries
  const baseColumns = baseBlocks.map(b => b.column);
  const platformStart = Math.min(...baseColumns);
  const platformEnd = Math.max(...baseColumns) + 1;

  // Clamp position to grid bounds
  const maxMovingBlockColumn = Math.max(...movingBlocks.map(b => b.column));
  const blockSpan = maxMovingBlockColumn + 1;
  const maxPosition = gridWidth - blockSpan;
  const clampedPosition = Math.max(0, Math.min(currentPosition, maxPosition));

  // Calculate worst overhang among all moving blocks
  const maxOverhangAllowed = 0.3 + tolerance;
  let worstOverhang = 0;
  let perfectCount = 0;

  movingBlocks.forEach(movingBlock => {
    const blockLeft = clampedPosition + movingBlock.column;
    const blockRight = blockLeft + 1;

    const supportedLeft = Math.max(blockLeft, platformStart);
    const supportedRight = Math.min(blockRight, platformEnd);
    const supportedWidth = Math.max(0, supportedRight - supportedLeft);
    const overhang = 1.0 - supportedWidth;

    worstOverhang = Math.max(worstOverhang, overhang);

    // Check if this block is perfectly aligned (fully supported)
    if (overhang <= 0.05) { // Allow 5% tolerance for "perfect"
      perfectCount++;
    }
  });

  // All blocks perfectly aligned
  if (perfectCount === movingBlocks.length) {
    return 'perfect';
  }

  // Categorize based on worst overhang
  if (worstOverhang <= maxOverhangAllowed * 0.5) {
    return 'good'; // Excellent placement
  } else if (worstOverhang <= maxOverhangAllowed) {
    return 'warning'; // Acceptable but will trim
  } else {
    return 'danger'; // Blocks will fall!
  }
}

// Get color for alignment quality
function getAlignmentColor(quality: AlignmentQuality): string {
  switch (quality) {
    case 'perfect': return '#00ff00'; // Bright green
    case 'good': return '#7fff00'; // Yellow-green
    case 'warning': return '#ffaa00'; // Orange
    case 'danger': return '#ff0000'; // Red
  }
}

// Main render function
export function render(state: GameState, ctx: CanvasRenderingContext2D): void {
  // Clear canvas
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Set background
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Apply camera offset for Endless mode (before screen shake)
  ctx.save();
  if (state.cameraOffsetY > 0) {
    // Translate canvas down by camera offset (in pixels)
    // Positive cameraOffsetY means we're higher up, so translate down to show higher rows
    const cameraPixelOffset = state.cameraOffsetY * CELL_SIZE;
    ctx.translate(0, cameraPixelOffset);
  }

  // Apply screen shake offset if present
  if (state.screenShake) {
    ctx.translate(state.screenShake.offsetX, state.screenShake.offsetY);
  }

  // Draw grid
  drawGrid(ctx, state);

  // Draw placed blocks (with squash effects if active)
  state.blocks.forEach(block => {
    // Find squash effect for this block
    const squash = state.squashEffects.find(
      effect => effect.column === block.column && effect.row === block.row
    );
    drawBlock(ctx, block, state.gridHeight, '#00d9ff', squash);
  });

  // Draw moving blocks (with spawn animation + alignment indicator)
  // Calculate spawn progress (0-1 over 300ms)
  const spawnDuration = 300; // ms
  const spawnElapsed = Math.min(Date.now() - state.blockSpawnTime, spawnDuration);
  const spawnProgress = spawnElapsed / spawnDuration; // 0 at start, 1 when complete

  // Calculate alignment quality for visual feedback
  const alignmentQuality = calculateAlignmentQuality(
    state.movingBlocks,
    state.blocks,
    state.position,
    state.level,
    state.gridWidth,
    state.alignmentTolerance
  );
  const alignmentColor = getAlignmentColor(alignmentQuality);

  state.movingBlocks.forEach((block) => {
    const x = state.position + block.column;
    drawBlockAt(ctx, x, block.row, state.gridHeight, '#00ffff', spawnProgress, alignmentColor);
  });

  // Draw falling blocks (with opacity fade)
  state.fallingBlocks.forEach(fallingBlock => {
    drawFallingBlock(ctx, fallingBlock, state.gridHeight);
  });

  // Draw particles
  state.particles.forEach(particle => {
    drawParticle(ctx, particle);
  });

  // Draw prize indicators
  drawPrizeIndicator(ctx, state);

  // Draw UI
  drawScore(ctx, state);
  drawComboIndicator(ctx, state);

  // Draw Time Attack timer if applicable
  if (state.gameMode === 'timeAttack' && state.timeRemaining !== null) {
    drawTimeAttackTimer(ctx, state.timeRemaining);
  }

  // Restore context (camera offset + screen shake)
  ctx.restore();

  // Draw color flash overlay (after screen shake restore, so it covers entire screen)
  if (state.colorFlash) {
    ctx.save();
    ctx.globalAlpha = state.colorFlash.opacity;
    ctx.fillStyle = state.colorFlash.color;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();
  }

  // Draw level-up effect (centered, scaled text)
  if (state.levelUpEffect) {
    drawLevelUpEffect(ctx, state.levelUpEffect);
  }
}

function drawLevelUpEffect(ctx: CanvasRenderingContext2D, effect: LevelUpEffect): void {
  ctx.save();

  // Center of canvas
  const centerX = ctx.canvas.width / 2;
  const centerY = ctx.canvas.height / 2;

  // Apply opacity
  ctx.globalAlpha = effect.opacity;

  // Apply scale transform
  ctx.translate(centerX, centerY);
  ctx.scale(effect.scale, effect.scale);
  ctx.translate(-centerX, -centerY);

  // Draw "LEVEL" text
  ctx.font = 'bold 48px Arial';
  ctx.fillStyle = '#00d9ff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowBlur = 20;
  ctx.shadowColor = '#00d9ff';
  ctx.fillText('LEVEL', centerX, centerY - 40);

  // Draw level number
  ctx.font = 'bold 96px Arial';
  ctx.fillStyle = '#ffd700';
  ctx.shadowColor = '#ffd700';
  ctx.shadowBlur = 30;
  ctx.fillText(effect.level.toString(), centerX, centerY + 40);

  ctx.restore();
}

function drawTimeAttackTimer(ctx: CanvasRenderingContext2D, timeRemaining: number): void {
  ctx.save();

  // Position: Top center of canvas
  const centerX = ctx.canvas.width / 2;
  const timerY = 50;

  // Format time: display as seconds with 1 decimal (e.g., "45.3")
  const displayTime = Math.max(0, timeRemaining).toFixed(1);

  // Color-code based on time remaining
  let timerColor: string;
  let shadowColor: string;
  let pulseOpacity = 1.0;

  if (timeRemaining > 30) {
    // Green: plenty of time
    timerColor = '#00ff00';
    shadowColor = '#00ff00';
  } else if (timeRemaining > 15) {
    // Yellow: moderate urgency
    timerColor = '#ffff00';
    shadowColor = '#ffff00';
  } else if (timeRemaining > 10) {
    // Red: high urgency
    timerColor = '#ff0000';
    shadowColor = '#ff0000';
  } else {
    // Flashing red: critical urgency (<10s)
    timerColor = '#ff0000';
    shadowColor = '#ff0000';
    // Pulse effect using sine wave (2 Hz = 2 pulses per second)
    const time = Date.now() / 1000;
    pulseOpacity = 0.6 + 0.4 * Math.abs(Math.sin(time * Math.PI * 2));
  }

  // Apply pulse opacity
  ctx.globalAlpha = pulseOpacity;

  // Draw "TIME" label
  ctx.font = 'bold 24px Arial';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowBlur = 15;
  ctx.shadowColor = shadowColor;
  ctx.fillText('TIME', centerX, timerY - 25);

  // Draw timer value (large and prominent)
  ctx.font = 'bold 64px Arial';
  ctx.fillStyle = timerColor;
  ctx.shadowBlur = 30;
  ctx.shadowColor = shadowColor;
  ctx.fillText(displayTime, centerX, timerY + 20);

  ctx.restore();
}

function drawGrid(ctx: CanvasRenderingContext2D, state: GameState): void {
  ctx.strokeStyle = '#4a7ba7';
  ctx.lineWidth = 1;

  for (let row = 0; row < state.gridHeight; row++) {
    for (let col = 0; col < state.gridWidth; col++) {
      const x = GRID_MARGIN_LEFT + col * CELL_SIZE;
      const y = GRID_MARGIN_TOP + (state.gridHeight - row - 1) * CELL_SIZE; // Invert Y for bottom-up

      ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
    }
  }
}

function drawBlock(ctx: CanvasRenderingContext2D, block: Block, gridHeight: number, color: string, squash?: SquashEffect): void {
  const x = GRID_MARGIN_LEFT + block.column * CELL_SIZE;
  const y = GRID_MARGIN_TOP + (gridHeight - 1 - block.row) * CELL_SIZE; // gridHeight - 1 - row for bottom-up

  // Apply squash effect if present
  if (squash && squash.intensity > 0) {
    const centerX = x + CELL_SIZE / 2;
    const centerY = y + CELL_SIZE / 2;

    // Squash: wider and shorter (scaleX > 1, scaleY < 1)
    const squashAmount = squash.intensity * 0.3; // Max 30% squash
    const scaleX = 1 + squashAmount;
    const scaleY = 1 - squashAmount;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(scaleX, scaleY);
    ctx.translate(-centerX, -centerY);
  }

  ctx.fillStyle = color;
  ctx.fillRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);

  // Add border highlight
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);

  // Restore context if squash was applied
  if (squash && squash.intensity > 0) {
    ctx.restore();
  }
}

function drawBlockAt(ctx: CanvasRenderingContext2D, position: number, row: number, gridHeight: number, color: string, spawnProgress: number = 1.0, alignmentColor?: string): void {
  const x = GRID_MARGIN_LEFT + position * CELL_SIZE;
  const y = GRID_MARGIN_TOP + (gridHeight - 1 - row) * CELL_SIZE;

  // Apply spawn animation (scale from 0.5 to 1.0, fade from 0 to 1)
  const scale = 0.5 + (spawnProgress * 0.5); // 0.5 -> 1.0
  const opacity = spawnProgress; // 0 -> 1

  ctx.save();

  // Apply spawn animation transform
  if (spawnProgress < 1.0) {
    const centerX = x + CELL_SIZE / 2;
    const centerY = y + CELL_SIZE / 2;
    ctx.globalAlpha = opacity;
    ctx.translate(centerX, centerY);
    ctx.scale(scale, scale);
    ctx.translate(-centerX, -centerY);
  }

  // Add glow effect for moving blocks (use alignment color if provided)
  const glowColor = alignmentColor || color;
  ctx.shadowBlur = 20; // Increased from 15 for more visibility
  ctx.shadowColor = glowColor;
  ctx.fillStyle = color;
  ctx.fillRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);
  ctx.shadowBlur = 0;

  // Add alignment indicator border (thick, colored border for feedback)
  if (alignmentColor) {
    ctx.strokeStyle = alignmentColor;
    ctx.lineWidth = 4; // Thick border for visibility
    ctx.strokeRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);

    // Add inner white border for contrast
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 4, y + 4, CELL_SIZE - 8, CELL_SIZE - 8);
  } else {
    // Default border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);
  }

  ctx.restore();
}

function drawFallingBlock(ctx: CanvasRenderingContext2D, fallingBlock: FallingBlock, gridHeight: number): void {
  const x = GRID_MARGIN_LEFT + fallingBlock.column * CELL_SIZE;
  const y = GRID_MARGIN_TOP + (gridHeight - 1 - fallingBlock.row) * CELL_SIZE;

  // Save current context state
  ctx.save();

  // Set opacity for fade effect
  ctx.globalAlpha = fallingBlock.opacity;

  // Draw with red/orange color to indicate falling
  const color = '#ff4444';
  ctx.shadowBlur = 10;
  ctx.shadowColor = color;
  ctx.fillStyle = color;
  ctx.fillRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);
  ctx.shadowBlur = 0;

  // Add border
  ctx.strokeStyle = '#ffaaaa';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);

  // Restore context state
  ctx.restore();
}

function drawParticle(ctx: CanvasRenderingContext2D, particle: Particle): void {
  ctx.save();

  // Calculate opacity based on remaining lifetime
  const opacity = particle.lifetime / particle.maxLifetime;
  ctx.globalAlpha = opacity;

  // Draw particle as a circle with glow
  ctx.fillStyle = particle.color;
  ctx.shadowBlur = 8;
  ctx.shadowColor = particle.color;

  ctx.beginPath();
  ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawPrizeIndicator(ctx: CanvasRenderingContext2D, state: GameState): void {
  const gridWidth = state.gridWidth * CELL_SIZE;

  // Minor prize belt - at row 10 (0-indexed)
  const minorY = GRID_MARGIN_TOP + (state.gridHeight - 1 - state.minorPrizeRow) * CELL_SIZE;
  const minorActive = state.minorPrizeReached;

  // Draw semi-transparent belt across the row
  ctx.fillStyle = minorActive ? 'rgba(0, 255, 255, 0.15)' : 'rgba(74, 123, 167, 0.1)';
  ctx.fillRect(GRID_MARGIN_LEFT, minorY, gridWidth, CELL_SIZE);

  // Draw top and bottom borders of belt
  ctx.strokeStyle = minorActive ? '#00ffff' : '#4a7ba7';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(GRID_MARGIN_LEFT, minorY);
  ctx.lineTo(GRID_MARGIN_LEFT + gridWidth, minorY);
  ctx.moveTo(GRID_MARGIN_LEFT, minorY + CELL_SIZE);
  ctx.lineTo(GRID_MARGIN_LEFT + gridWidth, minorY + CELL_SIZE);
  ctx.stroke();

  // Draw label
  ctx.font = 'bold 11px Arial';
  ctx.fillStyle = minorActive ? '#00ffff' : '#888';
  ctx.fillText('MINOR', 10, minorY + 22);
  ctx.fillText('PRIZE', 10, minorY + 34);

  // Major prize belt - at row 14 (0-indexed)
  const majorY = GRID_MARGIN_TOP + (state.gridHeight - 1 - state.majorPrizeRow) * CELL_SIZE;
  const majorActive = state.level >= state.majorPrizeRow;

  // Draw semi-transparent belt across the row
  ctx.fillStyle = majorActive ? 'rgba(255, 215, 0, 0.15)' : 'rgba(74, 123, 167, 0.1)';
  ctx.fillRect(GRID_MARGIN_LEFT, majorY, gridWidth, CELL_SIZE);

  // Draw top and bottom borders of belt
  ctx.strokeStyle = majorActive ? '#ffd700' : '#4a7ba7';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(GRID_MARGIN_LEFT, majorY);
  ctx.lineTo(GRID_MARGIN_LEFT + gridWidth, majorY);
  ctx.moveTo(GRID_MARGIN_LEFT, majorY + CELL_SIZE);
  ctx.lineTo(GRID_MARGIN_LEFT + gridWidth, majorY + CELL_SIZE);
  ctx.stroke();

  // Draw label
  ctx.font = 'bold 11px Arial';
  ctx.fillStyle = majorActive ? '#ffd700' : '#888';
  ctx.fillText('MAJOR', 10, majorY + 22);
  ctx.fillText('PRIZE', 10, majorY + 34);
}

function drawScore(ctx: CanvasRenderingContext2D, state: GameState): void {
  ctx.fillStyle = '#ffffff';
  ctx.font = '20px Arial';
  // Use displayScore for animated count-up effect
  ctx.fillText(`Score: ${Math.floor(state.displayScore)}`, 20, 30);
  ctx.fillText(`Level: ${state.level}/${state.majorPrizeRow}`, 20, 55);

  ctx.font = '14px Arial';
  ctx.fillStyle = '#aaa';
  ctx.fillText(`Best: ${state.highScore}`, 20, 75);
  ctx.fillText(`Perfect: ${state.perfectPlacements}`, 20, 92);
}

// Draw combo indicator (flow state feedback)
function drawComboIndicator(ctx: CanvasRenderingContext2D, state: GameState): void {
  const combo = state.comboStreak;

  // Only show if combo > 0
  if (combo === 0) return;

  // Position in top-right area
  const x = ctx.canvas.width - 120;
  const y = 50;

  ctx.save();

  // Determine combo level and styling
  let color = '#ffffff';
  let label = 'COMBO';
  let intensity = 1.0;
  let pulse = 1.0;

  if (combo >= 15) {
    color = '#ff00ff'; // Magenta - ON FIRE!
    label = '🔥 ON FIRE! 🔥';
    intensity = 1.5;
    // Pulsing effect for high combos
    pulse = 1.0 + Math.sin(Date.now() / 150) * 0.15;
  } else if (combo >= 10) {
    color = '#ff6600'; // Orange-red - AMAZING
    label = 'AMAZING';
    intensity = 1.3;
    pulse = 1.0 + Math.sin(Date.now() / 200) * 0.1;
  } else if (combo >= 5) {
    color = '#ffd700'; // Gold - GREAT
    label = 'GREAT';
    intensity = 1.2;
  } else if (combo >= 3) {
    color = '#00ff00'; // Green - NICE
    label = 'NICE';
    intensity = 1.1;
  }

  // Apply pulse scaling
  ctx.translate(x, y);
  ctx.scale(pulse, pulse);
  ctx.translate(-x, -y);

  // Draw label
  ctx.font = 'bold 16px Arial';
  ctx.fillStyle = color;
  ctx.textAlign = 'right';
  ctx.shadowBlur = 10 * intensity;
  ctx.shadowColor = color;
  ctx.fillText(label, x, y);

  // Draw combo number (BIG)
  ctx.font = `bold ${48 * intensity}px Arial`;
  ctx.fillStyle = color;
  ctx.shadowBlur = 20 * intensity;
  ctx.shadowColor = color;
  ctx.fillText(`${combo}x`, x, y + 40);

  ctx.restore();
}
