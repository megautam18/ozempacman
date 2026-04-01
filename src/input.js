import { LOGICAL_W, LOGICAL_H } from "./config.js";

const keys = {};

window.addEventListener("keydown", (e) => { keys[e.key] = true; });
window.addEventListener("keyup", (e) => { keys[e.key] = false; });

export function setupInput(state, resetGameFunc) {
  const canvas = document.getElementById("game");

  canvas.addEventListener("click", (e) => {
    if (!state.player.alive) {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      // adjust for DPI
      const scaleX = LOGICAL_W / canvas.clientWidth;
      const scaleY = LOGICAL_H / canvas.clientHeight;

      const x = mx * scaleX;
      const y = my * scaleY;

      // same button bounds as render
      const btnW = 200;
      const btnH = 50;
      const btnX = LOGICAL_W / 2 - btnW / 2;
      const btnY = LOGICAL_H / 2 + 10;

      if (
        x >= btnX && x <= btnX + btnW &&
        y >= btnY && y <= btnY + btnH
      ) {
        resetGameFunc();
      }
    }
  });
}

export function handleInput(state) {
  if (!state.player.alive) return;

  if (keys["w"]) state.player.nextDirection = "up";
  if (keys["s"]) state.player.nextDirection = "down";
  if (keys["a"]) state.player.nextDirection = "left";
  if (keys["d"]) state.player.nextDirection = "right";
}
