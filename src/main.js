import { LOGICAL_W, LOGICAL_H, tileSize } from "./config.js";
import { state } from "./state.js";
import { initGrid } from "./grid.js";
import { setupInput, handleInput } from "./input.js";
import { updatePlayer } from "./player.js";
import { updateGhosts } from "./ghosts.js";
import { render } from "./render.js";

// ─── Canvas Setup ───────────────────────────────────────────
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const dpr = window.devicePixelRatio || 1;

canvas.width = LOGICAL_W * dpr;
canvas.height = LOGICAL_H * dpr;
canvas.style.width = LOGICAL_W + "px";
canvas.style.height = LOGICAL_H + "px";
ctx.scale(dpr, dpr);

// ─── Reset / Restart ────────────────────────────────────────
function resetGame() {
  // reset player
  state.player.row = 15;
  state.player.col = 7;
  state.player.x = state.player.col * tileSize;
  state.player.y = state.player.row * tileSize;
  state.player.direction = null;
  state.player.nextDirection = null;
  state.player.weight = 0;
  state.player.alive = true;
  state.player.bobTimer = 0;

  // reset systems
  state.systems.fullness.value = 0;
  state.systems.timer.value = 30;
  state.systems.ozempic.active = false;
  state.systems.ozempic.timer = 0;

  // reset time
  state.game.time = 0;
  state.game.started = false;
  state.game.ghostChaseDelay = 4;
  state.game.ghostMode = "scatter";
  state.game.modeTimer = 7;
  state.game.ghostStartDelay = 3;
  state.game.ghostsReleased = false;

  // regenerate grid
  initGrid(state);

  // reset ghosts
  const ghostDefaults = [
    { row: 12, col: 12, direction: "right", speed: 80, color: "#ff4d4d", lastTurnTile: null, decisionTimer: 0 },
    { row: 12, col: 12, direction: "left", speed: 80, color: "#ff77ff", lastTurnTile: null, decisionTimer: 0 },
    { row: 12, col: 12, direction: "up", speed: 80, color: "#33ffff", lastTurnTile: null, decisionTimer: 0 }
  ];
  for (let i = 0; i < state.ghosts.length; i++) {
    const def = ghostDefaults[i];
    const g = state.ghosts[i];
    g.row = def.row;
    g.col = def.col;
    g.x = def.col * tileSize;
    g.y = def.row * tileSize;
    g.direction = def.direction;
    g.speed = def.speed;
    g.color = def.color;
    g.lastTurnTile = def.lastTurnTile;
    g.decisionTimer = def.decisionTimer;
  }
}

// Initialize input and first grid
setupInput(state, resetGame);
initGrid(state);

// ─── Game Loop ──────────────────────────────────────────────
let lastTime = 0;

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
  lastTime = timestamp;

  handleInput(state);
  updatePlayer(state, dt);
  updateGhosts(state, dt);
  render(state, ctx);

  requestAnimationFrame(gameLoop);
}

// kick off (first frame gets dt ≈ 0)
requestAnimationFrame((timestamp) => {
  lastTime = timestamp;
  gameLoop(timestamp);
});
