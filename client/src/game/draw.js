import { GRID_COLS, GRID_ROWS, COLORS } from './constants.js';

export function draw(ctx, state, width, height) {
  const cellWidth = width / GRID_COLS;
  const cellHeight = height / GRID_ROWS;

  ctx.fillStyle = COLORS.BACKGROUND || '#0f172a';
  ctx.fillRect(0, 0, width, height);

  const { snake, fields = [] } = state;

  // Draw fields first (behind snake) — Stage 3; skip captured (Stage 4)
  for (const field of fields) {
    if (field.captured) continue
    const rect = field.getRect ? field.getRect() : field;
    const x = rect.col * cellWidth + 1;
    const y = rect.row * cellHeight + 1;
    const w = (rect.width ?? 2) * cellWidth - 2;
    const h = (rect.height ?? 1) * cellHeight - 2;

    ctx.fillStyle = COLORS.FIELD_BG || '#1a1a2e';
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = COLORS.FIELD_BORDER || '#4a4af0';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = COLORS.FIELD_LABEL || '#ffffff';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      field.label ?? '',
      x + w / 2,
      y + h / 2
    );
  }

  // Draw snake
  snake.forEach((seg, i) => {
    const isHead = i === snake.length - 1;
    ctx.fillStyle = isHead ? (COLORS.SNAKE_HEAD || '#22c55e') : (COLORS.SNAKE_BODY || '#4ade80');
    ctx.fillRect(
      seg.col * cellWidth + 1,
      seg.row * cellHeight + 1,
      cellWidth - 2,
      cellHeight - 2
    );
  });
}
