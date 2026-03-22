// ─── Canvas Setup ───────────────────────────────────────────
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const LOGICAL_W = 800;
const LOGICAL_H = 600;
const dpr = window.devicePixelRatio || 1;

canvas.width = LOGICAL_W * dpr;
canvas.height = LOGICAL_H * dpr;
canvas.style.width = LOGICAL_W + "px";
canvas.style.height = LOGICAL_H + "px";
ctx.scale(dpr, dpr);

const tileSize = Math.min(LOGICAL_W / 25, LOGICAL_H / 25);

// ─── Input Tracking ─────────────────────────────────────────
const keys = {};
window.addEventListener("keydown", (e) => { keys[e.key] = true; });
window.addEventListener("keyup", (e) => { keys[e.key] = false; });

// ─── Central State ──────────────────────────────────────────
const state = {
  game: {
    running: true,
    time: 0
  },

  grid: {
    rows: 25,
    cols: 25,
    tiles: []
  },

  player: {
    row: 15,
    col: 7,
    x: 7 * Math.min(800 / 25, 600 / 25),   // col * tileSize
    y: 15 * Math.min(800 / 25, 600 / 25),   // row * tileSize
    direction: null,
    nextDirection: null,
    weight: 0,
    baseSpeed: 100,
    alive: true
  },

  ghosts: [
    { row: 0, col: 0, direction: "left" },
    { row: 12, col: 5, direction: "right" }
  ],

  systems: {
    hunger: {
      timer: 0,
      limit: 5
    },
    ozempic: {
      active: false,
      timer: 0
    }
  }
};

// ─── Grid Initialization ────────────────────────────────────
function initGrid(state) {
  const { rows, cols } = state.grid;
  const tiles = [];

  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      // border walls
      if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) {
        row.push(1);
      // some inner walls (simple corridors)
      } else if (
        (r === 5 && c >= 3 && c <= 10) ||
        (r === 5 && c >= 14 && c <= 21) ||
        (r === 10 && c >= 5 && c <= 8) ||
        (r === 10 && c >= 16 && c <= 19) ||
        (r === 15 && c >= 3 && c <= 10) ||
        (r === 15 && c >= 14 && c <= 21) ||
        (r === 20 && c >= 5 && c <= 8) ||
        (r === 20 && c >= 16 && c <= 19) ||
        (c === 12 && r >= 3 && r <= 7) ||
        (c === 12 && r >= 17 && r <= 22)
      ) {
        row.push(1);
      // player starting tile is empty
      } else if (r === state.player.row && c === state.player.col) {
        row.push(0);
      // everything else is food
      } else {
        row.push(2);
      }
    }
    tiles.push(row);
  }

  state.grid.tiles = tiles;
}

initGrid(state);

// ─── Input ──────────────────────────────────────────────────
function handleInput(state) {
  if (keys["w"]) state.player.nextDirection = "up";
  if (keys["s"]) state.player.nextDirection = "down";
  if (keys["a"]) state.player.nextDirection = "left";
  if (keys["d"]) state.player.nextDirection = "right";
}

// ─── Update ─────────────────────────────────────────────────
function update(state, dt) {
  state.game.time += dt;

  const p = state.player;
  const tiles = state.grid.tiles;

  // activate movement on first input
  if (p.direction === null && p.nextDirection !== null) {
    p.direction = p.nextDirection;
  }

  // turning — only allowed near tile center
  if (p.direction && p.nextDirection !== null && p.nextDirection !== p.direction) {
    const centerX = p.col * tileSize;
    const centerY = p.row * tileSize;
    const threshold = 3;

    const nearCenter =
      Math.abs(p.x - centerX) < threshold &&
      Math.abs(p.y - centerY) < threshold;

    if (nearCenter) {
      // find target tile in nextDirection
      let targetRow = p.row;
      let targetCol = p.col;
      switch (p.nextDirection) {
        case "up":    targetRow--; break;
        case "down":  targetRow++; break;
        case "left":  targetCol--; break;
        case "right": targetCol++; break;
      }

      // allow turn if target is not a wall
      if (tiles[targetRow] && tiles[targetRow][targetCol] !== 1) {
        p.direction = p.nextDirection;
        p.x = centerX;  // snap to tile center
        p.y = centerY;
      }
    }
  }

  // continuous movement with collision
  if (p.direction) {
    const speed = p.baseSpeed * dt;

    let nextX = p.x;
    let nextY = p.y;

    switch (p.direction) {
      case "right": nextX += speed; break;
      case "left":  nextX -= speed; break;
      case "up":    nextY -= speed; break;
      case "down":  nextY += speed; break;
    }

    // check leading edge based on direction
    const leadX = (p.direction === "right") ? nextX + tileSize - 1 : nextX;
    const leadY = (p.direction === "down")  ? nextY + tileSize - 1 : nextY;

    const checkCol = Math.floor(leadX / tileSize);
    const checkRow = Math.floor(leadY / tileSize);

    const inBounds =
      checkRow >= 0 && checkRow < state.grid.rows &&
      checkCol >= 0 && checkCol < state.grid.cols;

    if (inBounds && tiles[checkRow][checkCol] !== 1) {
      p.x = nextX;
      p.y = nextY;
    } else {
      // snap to tile-aligned position so turning still works
      p.x = p.col * tileSize;
      p.y = p.row * tileSize;
    }

    // sync grid position from pixel position
    p.col = Math.floor(p.x / tileSize);
    p.row = Math.floor(p.y / tileSize);
  }
}

// ─── Render ─────────────────────────────────────────────────
function render(state) {
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

  // draw UI panel
  renderPanel(state);
}

// ─── UI Panel ───────────────────────────────────────────────
function renderPanel(state) {
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

  // hunger
  ctx.fillStyle = "#aaa";
  ctx.fillText("Hunger", x, y);
  y += lineH * 0.7;
  const hungerPct = state.systems.hunger.timer / state.systems.hunger.limit;
  const barW = panelW - pad * 2;
  const barH = 10;
  // bar background
  ctx.fillStyle = "#333";
  ctx.fillRect(x, y, barW, barH);
  // bar fill
  ctx.fillStyle = hungerPct > 0.7 ? "#ff4444" : "#44cc44";
  ctx.fillRect(x, y, barW * Math.min(hungerPct, 1), barH);
  y += barH + 4;
  ctx.fillStyle = "#888";
  ctx.font = "11px monospace";
  ctx.fillText(
    state.systems.hunger.timer.toFixed(1) + " / " + state.systems.hunger.limit,
    x, y
  );
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

// ─── Game Loop ──────────────────────────────────────────────
(function () {
  let lastTime = 0;

  function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    handleInput(state);
    update(state, dt);
    render(state);

    requestAnimationFrame(gameLoop);
  }

  // kick off (first frame gets dt ≈ 0)
  requestAnimationFrame((timestamp) => {
    lastTime = timestamp;
    gameLoop(timestamp);
  });
})();
