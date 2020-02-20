const debug = require("debug");
const { emptyCellChar, columnReference, rowReference, normalPlayerChars } = require("./constants");


// Customize the way the logger is called and avoid modifying the original methods
const log = (...args) => console.log(...args);
log.error = console.error;
log.warn = console.warn;

log.debug = ({ ns = 'app:log', msg = '', logger = console.log, printNoNS_ifBlank = false } = {}, ...args) => {
  if (printNoNS_ifBlank && !msg && debug.enabled(ns))
    return logger();

  const debugOut = debug(ns);
  debugOut.log = logger.bind(console);

  const processedArgs = msg ? [msg, ...args] : args.length ? args : [msg];
  debugOut(...processedArgs);
};

log.bot = (msg, ...args) => log.debug({ ns: 'app:bot', msg, printNoNS_ifBlank: true }, ...args);

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

  /**
   * Parse user input as an option index. Resturns -1 if the user inputs '0' and `allowsBack = true`.
   * @param {(prompt: string) => Promise<string>} promptManager
   * @param {string[][]} translatedList
   */
  getIndexFromUserInput: async (promptManager, translatedList, allowsBack = false) => {
    let userInput = '';

    while (!userInput) {
      userInput = await promptManager();

      if (allowsBack && userInput === '0')
        break;

      if (userInput.length === 2 && userInput.match(/^[a-h][1-8]$/i)) {
        const letter = userInput[0].toUpperCase();
        const number = userInput.substr(1);
        const inxResult = translatedList.findIndex(f => f[0] === number && f[1] === letter);

        if (inxResult > -1)
          userInput = `${inxResult + 1}`;
      }

      if (isNaN(userInput)
        || +userInput - 1 < 0 ||
        +userInput > translatedList.length) {
        userInput = '';
        continue;
      }
    }

    return +userInput - 1;
  },

  /**
   * @param {string[][]} board
   * @param {number[]} coordinate
   */
  pieceIsKing: (board, coordinate) => board[coordinate[0]][coordinate[1]] === board[coordinate[0]][coordinate[1]].toUpperCase(),
};