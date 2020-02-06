const readline = require("readline");


const emptyCellChar = '-';
const emptyArray = [, , , , , , , ,];
const columnReference = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const rowReference = ['1', '2', '3', '4', '5', '6', '7', '8'];
const playerChars = ['o', 'x'];
const specialCommands = {
  help: context => context.printHelp(),
  board: (context, board) => context.printBoard(board),
};


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

  manageSpecialPrompts: function (board) {
    return async prompt => {
      let response = '';

      while (!response) {
        response = await this.promptUser(prompt);

        if (specialCommands[response]) {
          specialCommands[response](this, board);
          response = '';
        }
      }

      return response;
    };
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
      console.log(rowReference[i], ...f.map(m => `| ${m}`), '|', rowReference[i]);
    });

    console.log('  ', ...columnReference.map(m => ` ${m} `));

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

  setSpecialStartingPosition: function (board, player, custom) {
    if (!Array.isArray(custom))
      return this.setPlayerStartingPosition(board, player, custom);

    custom.forEach(f => {
      board[f[0]][f[1]] = player;
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
   * 
  */
  locatePieces: function (board, player) {
    const pieceLocations = [];
    board.forEach((rowItem, rowIndex) => {
      rowItem.forEach((columnItem, columnIndex) => {
        if (columnItem.toLowerCase() === player)
          pieceLocations.push([rowIndex, columnIndex]);
      });
    });

    return pieceLocations;
  },

  /**
   * 
   */
  positionTranslator: function (positions) {
    // if (!positions)
    //   return null;

    if (Array.isArray(positions[0]))
      return positions.map(m => [rowReference[m[0]], columnReference[m[1]]]);

    return positions.length ? [rowReference[positions[0]], columnReference[positions[1]]] : null;
  },

  getAdyacentPositions: function (board, oponentPlayer, piece, direction = null) {
    const upMovements = [
      // Left place
      [emptyCellChar, oponentPlayer].includes(
        `${(board[piece[0] - 1] || [])[piece[1] - 1]}`.toLowerCase()) ?
        [piece[0] - 1, piece[1] - 1] :
        null,

      // Right place
      [emptyCellChar, oponentPlayer].includes(
        `${(board[piece[0] - 1] || [])[piece[1] + 1]}`.toLowerCase()) ?
        [piece[0] - 1, piece[1] + 1] :
        null,

    ].filter(f => f);

    const downMovements = [
      // Left place
      [emptyCellChar, oponentPlayer].includes(
        `${(board[piece[0] + 1] || [])[piece[1] - 1]}`.toLowerCase()) ?
        [piece[0] + 1, piece[1] - 1] :
        null,

      // Right place
      [emptyCellChar, oponentPlayer].includes(
        `${(board[piece[0] + 1] || [])[piece[1] + 1]}`.toLowerCase()) ?
        [piece[0] + 1, piece[1] + 1] :
        null,
    ].filter(f => f);

    const possibleLocations = {
      up: null,
      down: null,
    };

    if (!direction) {
      possibleLocations.down = downMovements;
      possibleLocations.up = upMovements;
    }
    else {
      if (direction === 'down')
        possibleLocations.down = downMovements;
      else
        possibleLocations.up = upMovements;
    }

    return possibleLocations;
  },

  /**
   * 
   * @param {number[][]} board 
   * @param {string} player 
   * @param {number[]} piece 
   * @param {boolean} startsTop 
   * @returns {{coordinate: number[], killedPieces: number[][]}[]}
   */
  calculateMovement: function (board, player, piece, startsTop) {
    const result = [];
    const oponentPlayer = this.getPlayerOrder().find(f => player !== f);
    const pieceStatus = board[piece[0]][piece[1]] === player.toUpperCase() ? 'king' : 'normal';

    const possibleLocations = this.getAdyacentPositions(board, oponentPlayer, piece, pieceStatus === 'king' ? null : startsTop ? 'down' : 'up');

    Object.entries(possibleLocations).forEach(f => {
      const direction = f[0];
      const entries = f[1];

      if (!entries)
        return;

      entries.forEach(entry => {
        if (board[entry[0]][entry[1]] === oponentPlayer)
          this.calculateJumps(board, oponentPlayer, entry, direction, entry[1] > piece[1] ? 'right' : 'left')
            .forEach(r => result.push(r));
        else
          result.push({ coordinate: entry, killedPieces: [] });
      });
    });

    return result;
    // console.log((upMovements));
    // console.log(this.positionTranslator(upMovements));
    // console.log(this.positionTranslator(downMovements));
    // console.log((downMovements));
  },

  /**
   * 
   * @param {number[][]} board 
   * @param {string} oponentPlayer 
   * @param {number[]} position 
   * @param {"up"|"down"} verticalDirection 
   * @param {"right"|"left"|"both"} hDirection 
   * @param {number[][]} killedPieces 
   * @returns {{coordinate: number[], killedPieces: number[][]}[]}
   */
  calculateJumps: function (board, oponentPlayer, currentPosition, vDirection, hDirection = 'both', killedPieces = []) {
    const result = [];
    const killed = [...killedPieces];
    const currentLocation = board[currentPosition[0]][currentPosition[1]];

    if (!currentLocation || currentLocation.toLowerCase() !== oponentPlayer)
      return [];

    const direction = {
      left: null,
      right: null,
    };

    if (hDirection === 'both') {
      direction.left = this.getLocation(currentPosition, vDirection, 'left');
      direction.right = this.getLocation(currentPosition, vDirection, 'right');
    }
    else
      direction[hDirection] = this.getLocation(currentPosition, vDirection, hDirection);

    // console.log(direction)

    Object.values(direction).forEach(f => {
      if (!f || board[f[0]][f[1]] !== emptyCellChar)
        return;

      killed.push(currentPosition);
      result.push({ coordinate: f, killedPieces: killed });

      const adyacent = this.getAdyacentPositions(board, oponentPlayer, f, vDirection);
      (adyacent[vDirection] || []).forEach(option => {
        this.calculateJumps(board, oponentPlayer, option, vDirection, undefined, killed)
          .forEach(entry => {
            result.push(entry);
          });
      });
    });

    return result;
    // .reduce((o, e) => {
    //   if (!o.find(f => f[0] === e[0] && f[1] === e[1]))
    //     o.push(e);

    //   return o;
    // }, []);
  },

  getLocation: function (piece, verticicalPosition, horizontalPosition) {
    const tempResult = [];

    if (verticicalPosition === 'up') {
      if (piece[0] > 0) {
        tempResult.push(piece[1] < emptyArray.length - 1 ? [piece[0] - 1, piece[1] + 1] : null);
        tempResult.push(piece[1] > 0 ? [piece[0] - 1, piece[1] - 1] : null);
      }
    }
    else {
      if (piece[0] < emptyArray.length - 1) {
        tempResult.push(piece[1] < emptyArray.length - 1 ? [piece[0] + 1, piece[1] + 1] : null);
        tempResult.push(piece[1] > 0 ? [piece[0] + 1, piece[1] - 1] : null);
      }
    }

    if (horizontalPosition === 'right')
      return tempResult[0];

    return tempResult[1];
  },

  /**
   * Print help
   */
  printHelp: function () {
    console.log();
    console.log('* HELP *');
    console.log();
    console.log('- To move a piece, select the specified option number for the playable fields');
    console.log('- To go back in the menu, type "0"');
    console.log('- The uppercase symbols (e.g. "X", "O") represent KING pieces');
    console.log('- To exit, press Ctrl + C');
    console.log('- To print the board again, type "board"');
    console.log('- To print this help again, type "help"');
    console.log();
  },

  /**
   * Start the game
   */
  startGame: async function () {
    const board = this.getEmptyBoard();
    const customPrompt = this.manageSpecialPrompts(board);
    let turnCounter = 0;
    let currentTurn = 'x';

    this.setSpecialStartingPosition(board, 'o', [[0, 1], [0, 3], [0, 5], [0, 7], [1, 2], [1, 4], [1, 6], [2, 3], [2, 7], [4, 1], [5, 0], [6, 5]]);
    // this.setSpecialStartingPosition(board, 'o', [[0, 1], [0, 3], [0, 5], [0, 7], [1, 2], [1, 4], [1, 6], [2, 3], [2, 5], [2, 7], [3, 0], [5, 0]]);
    this.setSpecialStartingPosition(board, 'x', [[3, 4], [5, 4], [5, 6], [6, 1], [6, 3], [6, 7], [7, 0], [7, 2], [7, 4]]);
    // this.setSpecialStartingPosition(board, 'x', [[3, 4], [4, 7], [5, 4], [5, 6], [6, 1], [6, 3], [6, 7], [7, 0], [7, 2], [7, 4], [7, 6]]);
    // playerChars.forEach((f, i) => this.setPlayerStartingPosition(board, f, i === 0));

    this.printBoard(board);
    this.printHelp();

    while (true) {
      const startsTop = playerChars[0] === currentTurn;
      turnCounter++;
      console.log(`- Player "${currentTurn}" | turn ${Math.ceil(turnCounter / 2)} -`);

      const pieces = this.locatePieces(board, currentTurn);
      const piecesLocation = this.positionTranslator(pieces);

      let inputMovement = '0';

      while (inputMovement === '0') {
        let inputPiece = '';
        console.log();
        piecesLocation.forEach((f, i) => console.log(`${i + 1}) ${f[1]}${f[0]}`));

        while (!inputPiece) {
          inputPiece = await customPrompt();

          if (isNaN(inputPiece)
            || +inputPiece - 1 < 0 ||
            +inputPiece > pieces.length) {
            inputPiece = '';
            continue;
          }
        }

        const selectedPiece = pieces[+inputPiece - 1];
        const options = this.calculateMovement(board, currentTurn, selectedPiece, startsTop);
        const optionsLocation = options.map(m => ({
          coordinate: this.positionTranslator(m.coordinate),
          killedPieces: this.positionTranslator(m.killedPieces) || [],
        }));

        console.log('0) go back');
        optionsLocation.forEach((f, i) => console.log(
          `${i + 1}) ${f.coordinate[1]}${f.coordinate[0]}${
          f.killedPieces.length ?
            ` // Pieces killed: ${f.killedPieces.map(m => m[1] + m[0]).join(', ')}` :
            ''}`));

        inputMovement = '';
        while (!inputMovement) {
          inputMovement = await customPrompt();

          if (inputMovement === '0')
            continue;

          if (isNaN(inputMovement)
            || +inputMovement - 1 < 0 ||
            +inputMovement > options.length) {
            inputMovement = '';
            continue;
          }
        }

        if (inputMovement === '0') {
          inputPiece = '';
          continue;
        }

        const selectedDestination = options[+inputMovement - 1];
        const movingPiece = board[selectedPiece[0]][selectedPiece[1]];
        selectedDestination.killedPieces.concat([selectedPiece]).forEach(f => {
          board[f[0]][f[1]] = emptyCellChar;
        });

        board[selectedDestination.coordinate[0]][selectedDestination.coordinate[1]] = movingPiece;
      }

      this.printBoard(board);
      currentTurn = playerChars[(turnCounter - 1) % 2];
    }
  },
};