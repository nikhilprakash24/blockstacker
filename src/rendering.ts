import { GameState, Block } from './gameState';

const CELL_SIZE = 40; // pixels
const GRID_MARGIN = 60;

// Main render function
export function render(state: GameState, ctx: CanvasRenderingContext2D): void {
  // Clear canvas
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Set background
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Draw grid
  drawGrid(ctx, state);

  // Draw placed blocks
  state.blocks.forEach(block => {
    drawBlock(ctx, block, state.gridHeight, '#00d9ff');
  });

  // Draw moving blocks
  state.movingBlocks.forEach((block, index) => {
    const x = state.position + index;
    drawBlockAt(ctx, x, state.level, state.gridHeight, '#00ffff');
  });

  // Draw prize indicators
  drawPrizeIndicator(ctx, state);

  // Draw UI
  drawScore(ctx, state);
}

function drawGrid(ctx: CanvasRenderingContext2D, state: GameState): void {
  ctx.strokeStyle = '#4a7ba7';
  ctx.lineWidth = 1;

  for (let row = 0; row < state.gridHeight; row++) {
    for (let col = 0; col < state.gridWidth; col++) {
      const x = GRID_MARGIN + col * CELL_SIZE;
      const y = GRID_MARGIN + (state.gridHeight - row - 1) * CELL_SIZE; // Invert Y for bottom-up

      ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
    }
  }
}

function drawBlock(ctx: CanvasRenderingContext2D, block: Block, gridHeight: number, color: string): void {
  const x = GRID_MARGIN + block.column * CELL_SIZE;
  const y = GRID_MARGIN + (gridHeight - 1 - block.row) * CELL_SIZE; // gridHeight - 1 - row for bottom-up

  ctx.fillStyle = color;
  ctx.fillRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);

  // Add border highlight
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);
}

function drawBlockAt(ctx: CanvasRenderingContext2D, position: number, row: number, gridHeight: number, color: string): void {
  const x = GRID_MARGIN + position * CELL_SIZE;
  const y = GRID_MARGIN + (gridHeight - row) * CELL_SIZE;

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
}

function drawPrizeIndicator(ctx: CanvasRenderingContext2D, state: GameState): void {
  ctx.font = '14px Arial';

  // Minor prize
  const minorY = GRID_MARGIN + (state.gridHeight - state.minorPrizeRow) * CELL_SIZE;
  ctx.fillStyle = state.minorPrizeReached ? '#00ffff' : '#666';
  ctx.fillText('MINOR', 10, minorY + CELL_SIZE / 2);

  // Draw line
  ctx.strokeStyle = state.minorPrizeReached ? '#00ffff' : '#666';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(GRID_MARGIN - 10, minorY);
  ctx.lineTo(GRID_MARGIN + state.gridWidth * CELL_SIZE + 10, minorY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Major prize
  const majorY = GRID_MARGIN + (state.gridHeight - state.majorPrizeRow) * CELL_SIZE;
  ctx.fillStyle = state.level >= state.majorPrizeRow ? '#ffd700' : '#666';
  ctx.fillText('MAJOR', 10, majorY + CELL_SIZE / 2);

  // Draw line
  ctx.strokeStyle = state.level >= state.majorPrizeRow ? '#ffd700' : '#666';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(GRID_MARGIN - 10, majorY);
  ctx.lineTo(GRID_MARGIN + state.gridWidth * CELL_SIZE + 10, majorY);
  ctx.stroke();
  ctx.setLineDash([]);
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
