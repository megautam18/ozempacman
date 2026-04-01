import { tileSize, LOGICAL_W, LOGICAL_H } from "./config.js";
import { renderPanel } from "./ui.js";

export function render(state, ctx) {
  const { rows, cols, tiles } = state.grid;

  // clear
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

  // draw grid
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * tileSize;
      const y = r * tileSize;
      const tile = tiles[r][c];

      if (tile === 1) {
        // wall
        ctx.fillStyle = "#2244cc";
        ctx.fillRect(x, y, tileSize, tileSize);
      } else if (tile === 2) {
        // food dot
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(x + tileSize / 2, y + tileSize / 2, tileSize * 0.15, 0, Math.PI * 2);
        ctx.fill();
      } else if (tile === 3) {
        // ozempic pill
        ctx.fillStyle = "#00ff88";
        ctx.beginPath();
        ctx.arc(x + tileSize / 2, y + tileSize / 2, tileSize * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // draw player (pixel-smooth position)
  const px = state.player.x + tileSize / 2;
  const py = state.player.y + tileSize / 2;
  ctx.fillStyle = "#ffdd00";
  ctx.beginPath();
  ctx.arc(px, py, tileSize * 0.4, 0, Math.PI * 2);
  ctx.fill();

  // draw ghosts
  for (const ghost of state.ghosts) {
    const gx = ghost.x + tileSize / 2;
    const gy = ghost.y + tileSize / 2;
    ctx.fillStyle = ghost.color;
    ctx.beginPath();
    ctx.arc(gx, gy, tileSize * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // draw UI panel
  renderPanel(state, ctx);

  // game over overlay
  if (!state.player.alive) {
    // pixelated dark overlay
    const block = 8;

    for (let bx = 0; bx < LOGICAL_W; bx += block) {
      for (let by = 0; by < LOGICAL_H; by += block) {
        const shade = 0.65 + Math.random() * 0.25;
        ctx.fillStyle = `rgba(0,0,0,${shade})`;
        ctx.fillRect(bx, by, block, block);
      }
    }

    const centerX = LOGICAL_W / 2;
    const centerY = LOGICAL_H / 2;

    ctx.fillStyle = "#ff4444";
    ctx.font = "bold 40px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("GAME OVER", centerX, centerY - 40);

    // draw restart button
    const btnW = 200;
    const btnH = 50;
    const btnX = centerX - btnW / 2;
    const btnY = centerY + 10;

    // dark grey button background
    ctx.fillStyle = "#222";
    ctx.fillRect(btnX, btnY, btnW, btnH);

    // 3D beveled blue border (Pac-Man arcade style)
    const bw = 4; // border width

    // top edge (light blue)
    ctx.fillStyle = "#4466ee";
    ctx.fillRect(btnX, btnY, btnW, bw);

    // left edge (light blue)
    ctx.fillRect(btnX, btnY, bw, btnH);

    // bottom edge (dark blue)
    ctx.fillStyle = "#4466ee";
    ctx.fillRect(btnX, btnY + btnH - bw, btnW, bw);

    // right edge (dark blue)
    ctx.fillRect(btnX + btnW - bw, btnY, bw, btnH);

    // white retro text
    ctx.fillStyle = "#fff";
    ctx.font = "18px monospace";
    ctx.fillText("RESTART", centerX, btnY + btnH / 2);
  }
}
