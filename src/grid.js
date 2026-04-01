export function initGrid(state) {
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
