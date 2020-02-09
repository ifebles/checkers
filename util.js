const { emptyCellChar, columnReference, rowReference, normalPlayerChars } = require("./constants");


// Customize the way the logger is called and avoid modifying the original methods
const log = (...args) => console.log(...args);
log.error = console.error;
log.warn = console.warn;

module.exports = {
  /**
   * Convert a graphical board to an object
   * @param {string} board 
   */
  transformVisualBoard: board => {
    if (!board)
      return;

    const parsedBoard = board.split('\n')
      .map(m => m.trim().split('|').slice(1, 9).map(m => m.trim()))
      .filter(f => f.length === 8);

    const failedParsing = parsedBoard.length !== 8
      || parsedBoard.some(s => s.some(cell => ![emptyCellChar, normalPlayerChars.X, normalPlayerChars.O].includes(cell.toLowerCase())))
      || parsedBoard.every(e => e.every(cell => cell === emptyCellChar));

    if (failedParsing) {
      log();
      log.warn('Failed to load custom board...');
      log();
      return;
    }

    return parsedBoard;
  },

  /**
   * Translate positions from index to a visual representation
   * @param {number[]|number[][]} positions 
   * @returns {null|string[][]|string[]}
   */
  positionTranslator: positions => {
    if (Array.isArray(positions[0]))
      return positions.map(m => [rowReference[m[0]], columnReference[m[1]]]);

    return positions.length ? [rowReference[positions[0]], columnReference[positions[1]]] : null;
  },

  /**
   * Log the desired info
   */
  log,
};