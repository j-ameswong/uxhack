import { GRID_COLS, GRID_ROWS } from './constants.js';

export function draw(ctx, state, width, height) {
  const cellWidth = width / GRID_COLS;
  const cellHeight = height / GRID_ROWS;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);

  const { snake } = state;

  snake.forEach((seg, i) => {
    const isHead = i === snake.length - 1;
    ctx.fillStyle = isHead ? '#22c55e' : '#4ade80';
    ctx.fillRect(
      seg.col * cellWidth + 1,
      seg.row * cellHeight + 1,
      cellWidth - 2,
      cellHeight - 2
    );
  });
}
