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
      resetGame();
    }
  }
});

// ─── Central State ──────────────────────────────────────────
const state = {
  game: {
    running: true,
    started: false,
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
    prevRow: 15,
    prevCol: 7,
    x: 7 * Math.min(800 / 25, 600 / 25),   // col * tileSize
    y: 15 * Math.min(800 / 25, 600 / 25),   // row * tileSize
    direction: null,
    nextDirection: null,
    weight: 0,
    baseSpeed: 100,
    alive: true
  },

  ghosts: [
    {
      row: 3, col: 3,
      x: 3 * Math.min(800 / 25, 600 / 25),
      y: 3 * Math.min(800 / 25, 600 / 25),
      direction: "right", speed: 85, color: "#ff4d4d", lastTurnTile: null
    },
    {
      row: 3, col: 21,
      x: 21 * Math.min(800 / 25, 600 / 25),
      y: 3 * Math.min(800 / 25, 600 / 25),
      direction: "left", speed: 85, color: "#ff77ff", lastTurnTile: null
    },
    {
      row: 21, col: 15,
      x: 15 * Math.min(800 / 25, 600 / 25),
      y: 21 * Math.min(800 / 25, 600 / 25),
      direction: "up", speed: 85, color: "#33ffff", lastTurnTile: null
    }
  ],

  systems: {
    fullness: {
      value: 0,
      limit: 10
    },
    timer: {
      value: 30
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
        // randomized: 5% pill, 65% food, 30% empty
      } else {
        const roll = Math.random();
        if (roll < 0.05) {
          row.push(3);  // ozempic pill
        } else if (roll < 0.7) {
          row.push(2);  // food
        } else {
          row.push(0);  // empty
        }
      }
    }
    tiles.push(row);
  }

  state.grid.tiles = tiles;
}

initGrid(state);

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

  // reset systems
  state.systems.fullness.value = 0;
  state.systems.timer.value = 30;

  // reset time
  state.game.time = 0;
  state.game.started = false;

  // regenerate grid
  initGrid(state);

  // reset ghosts
  const ghostDefaults = [
    { row: 3, col: 3, direction: "right", speed: 85, color: "#ff4d4d", lastTurnTile: null },
    { row: 3, col: 21, direction: "left", speed: 85, color: "#ff77ff", lastTurnTile: null },
    { row: 21, col: 15, direction: "up", speed: 85, color: "#33ffff", lastTurnTile: null }
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
  }
}

// ─── Input ──────────────────────────────────────────────────
function handleInput(state) {
  if (!state.player.alive) return;

  if (keys["w"]) state.player.nextDirection = "up";
  if (keys["s"]) state.player.nextDirection = "down";
  if (keys["a"]) state.player.nextDirection = "left";
  if (keys["d"]) state.player.nextDirection = "right";
}

// ─── Update ─────────────────────────────────────────────────
function update(state, dt) {
  if (!state.player.alive) return;

  state.game.time += dt;

  const p = state.player;
  const tiles = state.grid.tiles;

  // activate movement on first input
  if (p.direction === null && p.nextDirection !== null) {
    p.direction = p.nextDirection;
  }

  // mark game as started once player moves
  if (p.direction && !state.game.started) {
    state.game.started = true;
  }

  // survival timer countdown (only after first input)
  if (state.game.started) {
    state.systems.timer.value -= dt;
    if (state.systems.timer.value < 0) {
      state.systems.timer.value = 0;
      state.player.alive = false;
    }
  }

  // store previous tile before movement
  const prevRow = p.row;
  const prevCol = p.col;

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
        case "up": targetRow--; break;
        case "down": targetRow++; break;
        case "left": targetCol--; break;
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
    // fullness-based speed
    const fullness = state.systems.fullness.value;
    const limit = state.systems.fullness.limit;
    const ratio = fullness / limit;

    // stuck — too full to move
    if (fullness >= limit) {
      // skip movement entirely
    } else {
      let speed = p.baseSpeed * (1 - ratio);
      speed = Math.max(20, speed); // never fully zero
      const move = speed * dt;

      let nextX = p.x;
      let nextY = p.y;

      switch (p.direction) {
        case "right": nextX += move; break;
        case "left": nextX -= move; break;
        case "up": nextY -= move; break;
        case "down": nextY += move; break;
      }

      // check leading edge based on direction
      const leadX = (p.direction === "right") ? nextX + tileSize - 1 : nextX;
      const leadY = (p.direction === "down") ? nextY + tileSize - 1 : nextY;

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

      // food eating — only check when entering a new tile
      if (p.row !== prevRow || p.col !== prevCol) {
        const tile = tiles[p.row][p.col];
        if (tile === 2) {
          tiles[p.row][p.col] = 0;
          p.weight += 1;
          state.systems.fullness.value += 1;
        } else if (tile === 3) {
          tiles[p.row][p.col] = 0;
          state.systems.fullness.value = 0;
        }
      }
    }
  }

  // keep prevRow/prevCol in sync for external reads
  p.prevRow = prevRow;
  p.prevCol = prevCol;

  // ─── Ghost Update ───────────────────────────────────────
  const opposite = { left: "right", right: "left", up: "down", down: "up" };

  for (const ghost of state.ghosts) {
    // --- intersection direction choosing ---
    const centerX = ghost.col * tileSize;
    const centerY = ghost.row * tileSize;

    const nearCenter =
      Math.abs(ghost.x - centerX) < 3 &&
      Math.abs(ghost.y - centerY) < 3;

    const tileKey = ghost.row + "," + ghost.col;

    if (nearCenter && ghost.lastTurnTile !== tileKey) {
      // find valid directions (non-wall neighbors)
      const dirOffsets = [
        { dir: "up",    dr: -1, dc: 0 },
        { dir: "down",  dr: 1,  dc: 0 },
        { dir: "left",  dr: 0,  dc: -1 },
        { dir: "right", dr: 0,  dc: 1 }
      ];

      let validDirs = [];
      for (const { dir, dr, dc } of dirOffsets) {
        const nr = ghost.row + dr;
        const nc = ghost.col + dc;
        if (
          nr >= 0 && nr < state.grid.rows &&
          nc >= 0 && nc < state.grid.cols &&
          tiles[nr][nc] !== 1
        ) {
          validDirs.push(dir);
        }
      }

      // remove reverse unless it's the only option (dead end)
      if (validDirs.length > 1) {
        const rev = opposite[ghost.direction];
        validDirs = validDirs.filter(d => d !== rev);
      }

      // pick random direction
      if (validDirs.length > 0) {
        ghost.direction = validDirs[Math.floor(Math.random() * validDirs.length)];
        // snap to center for clean turns
        ghost.x = centerX;
        ghost.y = centerY;
        ghost.lastTurnTile = tileKey;
      }
    }

    // --- movement ---
    const move = ghost.speed * dt;

    let nextX = ghost.x;
    let nextY = ghost.y;

    switch (ghost.direction) {
      case "right": nextX += move; break;
      case "left":  nextX -= move; break;
      case "up":    nextY -= move; break;
      case "down":  nextY += move; break;
    }

    // leading edge collision
    const leadX = (ghost.direction === "right") ? nextX + tileSize - 1 : nextX;
    const leadY = (ghost.direction === "down")  ? nextY + tileSize - 1 : nextY;
    const gCol = Math.floor(leadX / tileSize);
    const gRow = Math.floor(leadY / tileSize);

    const gInBounds =
      gRow >= 0 && gRow < state.grid.rows &&
      gCol >= 0 && gCol < state.grid.cols;

    if (gInBounds && tiles[gRow][gCol] !== 1) {
      ghost.x = nextX;
      ghost.y = nextY;
    } else {
      // fallback: reverse and snap (shouldn't happen often now)
      ghost.direction = opposite[ghost.direction];
      ghost.x = Math.round(ghost.x / tileSize) * tileSize;
      ghost.y = Math.round(ghost.y / tileSize) * tileSize;
    }

    ghost.col = Math.floor(ghost.x / tileSize);
    ghost.row = Math.floor(ghost.y / tileSize);

    // player collision
    const dx = p.x - ghost.x;
    const dy = p.y - ghost.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < tileSize * 0.6) {
      state.player.alive = false;
    }
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
  renderPanel(state);

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
