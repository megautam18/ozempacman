import { tileSize } from "./config.js";

export const state = {
  game: {
    running: true,
    started: false,
    time: 0,
    ghostChaseDelay: 4
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
    alive: true
  },

  ghosts: [
    {
      row: 3, col: 3,
      x: 3 * tileSize,
      y: 3 * tileSize,
      direction: "right", speed: 80, color: "#ff4d4d", lastTurnTile: null, decisionTimer: 0
    },
    {
      row: 3, col: 21,
      x: 21 * tileSize,
      y: 3 * tileSize,
      direction: "left", speed: 80, color: "#ff77ff", lastTurnTile: null, decisionTimer: 0
    },
    {
      row: 21, col: 15,
      x: 15 * tileSize,
      y: 21 * tileSize,
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
