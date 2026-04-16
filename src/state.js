import { tileSize } from "./config.js";

export const state = {
  game: {
    running: true,
    started: false,
    ghostChaseDelay: 4,
    ghostMode: "scatter",
    modeTimer: 7,
    ghostStartDelay: 3,
    ghostsReleased: false,
    score: 0,
    ozempicCount: 0
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
    x: 7 * tileSize,   // col * tileSize
    y: 15 * tileSize,   // row * tileSize
    direction: null,
    nextDirection: null,
    weight: 0,
    baseSpeed: 110,
    alive: true,
    mouthAngle: 0.25,
    mouthDir: 1,
    bobTimer: 0
  },

  ghosts: [
    {
      row: 12, col: 12,
      x: 12 * tileSize,
      y: 12 * tileSize,
      direction: "right", speed: 80, color: "#ff4d4d", lastTurnTile: null, decisionTimer: 0
    },
    {
      row: 12, col: 12,
      x: 12 * tileSize,
      y: 12 * tileSize,
      direction: "left", speed: 80, color: "#ff77ff", lastTurnTile: null, decisionTimer: 0
    },
    {
      row: 12, col: 12,
      x: 12 * tileSize,
      y: 12 * tileSize,
      direction: "up", speed: 80, color: "#33ffff", lastTurnTile: null, decisionTimer: 0
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
