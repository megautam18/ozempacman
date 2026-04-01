import { tileSize, LOGICAL_W, LOGICAL_H } from "./config.js";

export function renderPanel(state, ctx) {
  const panelX = state.grid.cols * tileSize; // where the grid ends
  const panelW = LOGICAL_W - panelX;
  const panelH = LOGICAL_H;

  // background
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(panelX, 0, panelW, panelH);

  // divider line
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(panelX, 0);
  ctx.lineTo(panelX, panelH);
  ctx.stroke();

  // text styling
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const pad = 14;
  const x = panelX + pad;
  let y = pad;
  const lineH = 28;

  // title
  ctx.fillStyle = "#ffdd00";
  ctx.font = "bold 16px monospace";
  ctx.fillText("─ STATS ─", x, y);
  y += lineH + 8;

  ctx.font = "14px monospace";

  // weight
  ctx.fillStyle = "#aaa";
  ctx.fillText("Weight", x, y);
  y += lineH * 0.7;
  ctx.fillStyle = "#fff";
  ctx.fillText(String(state.player.weight), x, y);
  y += lineH + 4;

  // fullness
  ctx.fillStyle = "#aaa";
  ctx.fillText("Fullness", x, y);
  y += lineH * 0.7;
  const fullPct = state.systems.fullness.value / state.systems.fullness.limit;
  const barW = panelW - pad * 2;
  const barH = 10;
  // bar background
  ctx.fillStyle = "#333";
  ctx.fillRect(x, y, barW, barH);
  // bar fill
  ctx.fillStyle = fullPct >= 1 ? "#ff4444" : "#44cc44";
  ctx.fillRect(x, y, barW * Math.min(fullPct, 1), barH);
  y += barH + 4;
  ctx.fillStyle = "#888";
  ctx.font = "11px monospace";
  ctx.fillText(
    state.systems.fullness.value + " / " + state.systems.fullness.limit,
    x, y
  );
  y += lineH + 4;

  ctx.font = "14px monospace";

  // survival timer
  ctx.fillStyle = "#aaa";
  ctx.fillText("Timer", x, y);
  y += lineH * 0.7;
  const tRemain = state.systems.timer.value;
  ctx.fillStyle = tRemain < 10 ? "#ff4444" : "#fff";
  ctx.fillText(tRemain.toFixed(1) + "s", x, y);
  y += lineH + 4;

  ctx.font = "14px monospace";

  // ozempic
  ctx.fillStyle = "#aaa";
  ctx.fillText("Ozempic", x, y);
  y += lineH * 0.7;
  if (state.systems.ozempic.active) {
    ctx.fillStyle = "#00ffaa";
    ctx.fillText("ACTIVE " + state.systems.ozempic.timer.toFixed(1) + "s", x, y);
  } else {
    ctx.fillStyle = "#555";
    ctx.fillText("inactive", x, y);
  }
  y += lineH + 4;

  // game time
  ctx.fillStyle = "#aaa";
  ctx.fillText("Time", x, y);
  y += lineH * 0.7;
  ctx.fillStyle = "#fff";
  const mins = Math.floor(state.game.time / 60);
  const secs = Math.floor(state.game.time % 60);
  ctx.fillText(
    String(mins).padStart(2, "0") + ":" + String(secs).padStart(2, "0"),
    x, y
  );
}
