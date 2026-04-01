import { tileSize } from "./config.js";

export function updatePlayer(state, dt) {
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

  // ghost chase delay countdown
  if (state.game.started && state.game.ghostChaseDelay > 0) {
    state.game.ghostChaseDelay -= dt;
  }

  // ozempic effect countdown
  if (state.systems.ozempic.active) {
    state.systems.ozempic.timer -= dt;
    if (state.systems.ozempic.timer <= 0) {
      state.systems.ozempic.timer = 0;
      state.systems.ozempic.active = false;
    }
  }

  // store previous tile before movement
  const prevRow = p.row;
  const prevCol = p.col;

  // turning — only allowed near tile center
  if (p.direction && p.nextDirection !== null && p.nextDirection !== p.direction) {
    const centerX = p.col * tileSize;
    const centerY = p.row * tileSize;
    const threshold = 5;

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
      speed = Math.max(60, speed); // never extremely slow
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
          state.systems.ozempic.active = true;
          state.systems.ozempic.timer = 5;
        }
      }
    }
  }

  // keep prevRow/prevCol in sync for external reads
  p.prevRow = prevRow;
  p.prevCol = prevCol;
}
