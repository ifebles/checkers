const readline = require("readline");


const emptyCellChar = '-';
const emptyArray = [, , , , , , , ,];
const columnReference = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const rowReference = ['1', '2', '3', '4', '5', '6', '7', '8'];
const playerChars = ['o', 'x'];


module.exports = {
  /**
   * Normal player characters
   */
  normalPlayerChars: {
    O: 'o',
    X: 'x',
  },
  /**
   * New board
   */
  getEmptyBoard: function () {
    return [...emptyArray]
      .map(_m => [...emptyArray].fill(emptyCellChar));
  },

  /**
   * Manage user input
   */
  promptUser: function (prompt = '> ') {
    return new Promise(resolve => {
      const rl = readline.createInterface(process.stdin, process.stdout);

      rl.question(prompt, resp => {
        resolve(resp);
        rl.close();
      });
    })
  },

  /**
   * Show current player order
   */
  getPlayerOrder: function () { return playerChars },

  /**
   * Change the player order and return it
   */
  changePlayerOrder: function () { return playerChars.reverse() },

  /**
   * Board depiction
   */
  printBoard: function (board) {
    console.log();
    console.log('  ', ...columnReference.map(m => ` ${m} `));

    board.forEach((f, i) => {
      console.log(rowReference[i], ...f.map(m => `| ${m}`), '|');
    });

    console.log();
  },

  /**
   * Set the starting position to the specified player
   */
  setPlayerStartingPosition: function (board, player, startsTop) {
    board
      .filter((_f, i) => startsTop ? i < 3 : i > 4)
      .forEach((f, i) => {
        for (let x = 0; x < f.length; x++) {
          f[x] = (x + (i % 2)) % 2 ^ startsTop ? emptyCellChar : player;
        }
      });
  },

  /**
   * Print welcome message
   */
  printWelcomeMessage: async function () {
    console.log();
    console.log('Welcome to a new game of * CHECKER *');
    console.log();
    console.log('- Player 1 (x) will always move first');
    console.log('- Each time a new game starts, the starting position shuflles');
    console.log();
    console.log();

    let response = '';

    while (!response) {
      response = await this.promptUser('Ready to start? (y/n) ');

      switch (response.toLowerCase()) {
        case 'y':
        case 'n':
          response = response.toLowerCase();
          break;

        default:
          response = '';
          break;
      }
    }

    return response === 'y';
  },

  /**
   * Start the game
   */
  startGame: function () {
    const board = this.getEmptyBoard();

    this.getPlayerOrder().forEach((f, i) => this.setPlayerStartingPosition(board, f, i === 0));

    this.printBoard(board);
  },
};