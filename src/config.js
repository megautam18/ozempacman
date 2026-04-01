export const LOGICAL_W = 800;
export const LOGICAL_H = 600;

export const GRID_ROWS = 25;
export const GRID_COLS = 25;

export const tileSize = Math.min(
  LOGICAL_W / GRID_COLS,
  LOGICAL_H / GRID_ROWS
);
