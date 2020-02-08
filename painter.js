

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
    console.log();
    console.log('  ', ...columnReference.map(m => ` ${m} `));

    board.forEach((f, i) => {
      console.log(rowReference[i], ...f.map(m => `| ${m}`), '|', rowReference[i]);
    });

    console.log('  ', ...columnReference.map(m => ` ${m} `));

    console.log();
  },

  /**
   * Print welcome message
   */
  printWelcomeMessage: function (action = async () => true) {
    console.log();
    console.log('Welcome to a new game of * CHECKER *');
    console.log();
    console.log('- Player 1 (x) will always move first');
    console.log('- Each time a new game starts, the starting position shuffles');
    console.log();
    console.log();

    if (typeof action === 'function')
      return action();
  },

  /**
   * Print help
   */
  printHelp: function () {
    console.log();
    console.log('* HELP *');
    console.log();
    console.log('- To move a piece, select the specified option number for the playable fields or input the field name');
    console.log('- To go back in the menu, type "0"');
    console.log('- The uppercase symbols (e.g. "X", "O") represent KING pieces');
    console.log('- To exit, press `Ctrl + C`');
    console.log('- To print the board again, type "board"');
    console.log('- To print this help again, type "help"');
    console.log();
  },
};