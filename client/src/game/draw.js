import { GRID_COLS, GRID_ROWS, COLORS } from './constants.js';

function drawRoundedInput(ctx, x, y, w, h, radius = 8) {
  const r = Math.min(radius, h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function draw(ctx, state, width, height) {
  const cellWidth = width / GRID_COLS;
  const cellHeight = height / GRID_ROWS;

  ctx.fillStyle = COLORS.BACKGROUND || '#0f172a';
  ctx.fillRect(0, 0, width, height);

  const { snake, fields = [] } = state;

  // Draw fields first (behind snake) — Stage 3; skip captured (Stage 4)
  for (const field of fields) {
    if (field.captured) continue;
    ctx.save();

    const rect = field.getRect ? field.getRect() : field;
    const x = rect.col * cellWidth + 1;
    const y = rect.row * cellHeight + 1;
    const w = (rect.width ?? 2) * cellWidth - 2;
    const h = (rect.height ?? 1) * cellHeight - 2;

    const bgColor = '#ffffff';
    const borderColor = '#d1d5db'; // Tailwind gray-300-ish
    const labelColor = '#6b7280';  // Tailwind gray-500-ish

    drawRoundedInput(ctx, x, y, w, h, 10);

    ctx.fillStyle = bgColor;
    ctx.fill();

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = borderColor;
    ctx.stroke();

    const paddingX = w * 0.08;
    const fontSize = Math.min(14, h * 0.5);

    ctx.fillStyle = labelColor;
    ctx.font = `500 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      field.label ?? '',
      x + paddingX,
      y + h / 2
    );

    ctx.restore();
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
