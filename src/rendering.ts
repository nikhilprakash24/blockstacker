import { GameState, Block, FallingBlock, SquashEffect, Particle, LevelUpEffect } from './gameState';

const CELL_SIZE = 40; // pixels
const GRID_MARGIN_LEFT = 120; // Space for prize labels on left
const GRID_MARGIN_TOP = 100; // Space for score display on top

// Main render function
export function render(state: GameState, ctx: CanvasRenderingContext2D): void {
  // Clear canvas
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Set background
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Apply screen shake offset if present
  if (state.screenShake) {
    ctx.save();
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

  // Draw moving blocks (with spawn animation)
  // Calculate spawn progress (0-1 over 300ms)
  const spawnDuration = 300; // ms
  const spawnElapsed = Math.min(Date.now() - state.blockSpawnTime, spawnDuration);
  const spawnProgress = spawnElapsed / spawnDuration; // 0 at start, 1 when complete

  state.movingBlocks.forEach((block) => {
    const x = state.position + block.column;
    drawBlockAt(ctx, x, block.row, state.gridHeight, '#00ffff', spawnProgress);
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

  // Restore context if screen shake was applied
  if (state.screenShake) {
    ctx.restore();
  }

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

function drawBlockAt(ctx: CanvasRenderingContext2D, position: number, row: number, gridHeight: number, color: string, spawnProgress: number = 1.0): void {
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

  // Add glow effect for moving blocks
  ctx.shadowBlur = 15;
  ctx.shadowColor = color;
  ctx.fillStyle = color;
  ctx.fillRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);
  ctx.shadowBlur = 0;

  // Add border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);

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
  ctx.fillText(`Score: ${state.score}`, 20, 30);
  ctx.fillText(`Level: ${state.level}/${state.majorPrizeRow}`, 20, 55);

  ctx.font = '14px Arial';
  ctx.fillStyle = '#aaa';
  ctx.fillText(`Best: ${state.highScore}`, 20, 75);
  ctx.fillText(`Perfect: ${state.perfectPlacements}`, 20, 92);
}
