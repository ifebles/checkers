const { log } = require("./util");



module.exports = {
  /**
   * Board depiction
   * @param {{
   * board: string[][],
   * columnReference: string[],
   * rowReference: string[],
   * }} 
   */
  printBoard: function ({ board, columnReference, rowReference }) {
    log();
    log('  ', ...columnReference.map(m => ` ${m} `));

    board.forEach((f, i) => {
      log(rowReference[i], ...f.map(m => `| ${m}`), '|', rowReference[i]);
    });

    log('  ', ...columnReference.map(m => ` ${m} `));
    log();
  },

  /**
   * Print welcome message
   * @param {() => Promise<"0"|"1"|"2"|"3">} action
   */
  printWelcomeMessage: function (action) {
    log();
    log('Welcome to a new game of * CHECKERS *');
    log();
    log('- Player 1 (x) will always move first');
    log('- Each time a new game starts, the starting position shuffles');
    log();
    log();

    if (typeof action === 'function')
      return action();
  },

  /**
   * Print help
   */
  printHelp: function () {
    log();
    log('* HELP *');
    log();
    log('- To move a piece, select the specified option number for the playable fields or input the field name');
    log('- To go back in the menu, type "0"');
    log('- The uppercase symbols (e.g. "X", "O") represent KING pieces');
    log('- To exit, press `Ctrl + C`');
    log('- To print the board again, type "board"');
    log('- To print this help again, type "help"');
    log();
  },
};