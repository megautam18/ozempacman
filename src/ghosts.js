import { tileSize } from "./config.js";

export function updateGhosts(state, dt) {
  if (!state.player.alive) return;

  const p = state.player;
  const tiles = state.grid.tiles;
  const opposite = { left: "right", right: "left", up: "down", down: "up" };

  for (const ghost of state.ghosts) {
    // tick decision cooldown
    ghost.decisionTimer -= dt;
    if (ghost.decisionTimer < 0) ghost.decisionTimer = 0;

    // --- intersection direction choosing ---
    const centerX = ghost.col * tileSize;
    const centerY = ghost.row * tileSize;

    const nearCenter =
      Math.abs(ghost.x - centerX) < 3 &&
      Math.abs(ghost.y - centerY) < 3;

    const tileKey = ghost.row + "," + ghost.col;

    if (nearCenter && ghost.lastTurnTile !== tileKey && ghost.decisionTimer <= 0) {
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

      // pick direction: chase for first ghost (after delay), random for others
      if (validDirs.length > 0) {
        const isChaser = (ghost === state.ghosts[0]) && state.game.ghostChaseDelay <= 0;

        if (isChaser && Math.random() < 0.7) {
          // choose direction that minimizes Manhattan distance to player
          let bestDir = validDirs[0];
          let bestDist = Infinity;

          for (const dir of validDirs) {
            let tr = ghost.row;
            let tc = ghost.col;
            switch (dir) {
              case "up":    tr--; break;
              case "down":  tr++; break;
              case "left":  tc--; break;
              case "right": tc++; break;
            }
            const dist = Math.abs(tr - p.row) + Math.abs(tc - p.col);
            if (dist < bestDist) {
              bestDist = dist;
              bestDir = dir;
            }
          }
          ghost.direction = bestDir;
        } else {
          ghost.direction = validDirs[Math.floor(Math.random() * validDirs.length)];
        }

        // snap to center for clean turns
        ghost.x = centerX;
        ghost.y = centerY;
        ghost.lastTurnTile = tileKey;
        ghost.decisionTimer = 0.25;
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
