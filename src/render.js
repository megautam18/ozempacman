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

  // draw player (Pac-Man mouth animation)
  const cx = state.player.x + tileSize / 2;
  const cy = state.player.y + tileSize / 2;
  const mouth = state.player.mouthAngle;

  let rotation = 0;
  switch (state.player.direction) {
    case "right": rotation = 0; break;
    case "left":  rotation = Math.PI; break;
    case "up":    rotation = -Math.PI / 2; break;
    case "down":  rotation = Math.PI / 2; break;
  }

  // add wobble effect
  rotation += Math.sin(state.player.bobTimer) * 0.08;

  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, tileSize * 0.45, rotation + mouth, rotation + (Math.PI * 2 - mouth));
  ctx.closePath();
  ctx.fillStyle = "#ffdd00";
  ctx.fill();

  // draw ghosts (classic Pac-Man shape)
  for (const ghost of state.ghosts) {
    const gx = ghost.x + tileSize / 2;
    const gy = ghost.y + tileSize / 2;
    const r = tileSize * 0.45;

    // --- body ---
    ctx.beginPath();
    // top semicircle
    ctx.arc(gx, gy - r * 0.2, r, Math.PI, 0);

    // right side down
    const bottom = gy - r * 0.2 + r;
    ctx.lineTo(gx + r, bottom);

    // wavy bottom (4 waves)
    const waveH = r * 0.2;
    ctx.lineTo(gx + r / 2, bottom - waveH);
    ctx.lineTo(gx, bottom);
    ctx.lineTo(gx - r / 2, bottom - waveH);
    ctx.lineTo(gx - r, bottom);

    // left side back up
    ctx.lineTo(gx - r, gy - r * 0.2);

    ctx.closePath();
    ctx.fillStyle = ghost.color;
    ctx.fill();

    // --- eyes ---
    const eyeOffsetX = r * 0.35;
    const eyeOffsetY = -r * 0.1;
    const eyeR = r * 0.25;

    // white sclera
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(gx - eyeOffsetX, gy + eyeOffsetY, eyeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(gx + eyeOffsetX, gy + eyeOffsetY, eyeR, 0, Math.PI * 2);
    ctx.fill();

    // --- pupils (direction-aware) ---
    let pupilDx = 0;
    let pupilDy = 0;
    switch (ghost.direction) {
      case "right": pupilDx = 3; break;
      case "left":  pupilDx = -3; break;
      case "up":    pupilDy = -3; break;
      case "down":  pupilDy = 3; break;
    }
    const pupilR = r * 0.12;

    ctx.fillStyle = "#22e";
    ctx.beginPath();
    ctx.arc(gx - eyeOffsetX + pupilDx, gy + eyeOffsetY + pupilDy, pupilR, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(gx + eyeOffsetX + pupilDx, gy + eyeOffsetY + pupilDy, pupilR, 0, Math.PI * 2);
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
