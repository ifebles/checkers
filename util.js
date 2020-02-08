const inputHandler = require("./input");
const painter = require("./painter");


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
   * @returns {string[][]}
   */
  getEmptyBoard: function () {
    return [...emptyArray]
      .map(_m => [...emptyArray].fill(emptyCellChar));
  },

  /**
   * Convert a graphical board to an object
   * @param {string} board 
   */
  transformVisualBoard: function (board) {
    if (!board)
      return;

    const parsedBoard = board.split('\n')
      .map(m => m.trim().split('|').slice(1, 9).map(m => m.trim()))
      .filter(f => f.length === 8);

    const failedParsing = parsedBoard.length !== 8
      || parsedBoard.some(s => s.some(cell => ![emptyCellChar, this.normalPlayerChars.X, this.normalPlayerChars.O].includes(cell.toLowerCase())))
      || parsedBoard.every(e => e.every(cell => cell === emptyCellChar));

    if (failedParsing) {
      console.log();
      console.warn('Failed to load custom board...');
      console.log();
      return;
    }

    return parsedBoard;
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
   * Set the starting position to the specified player
   * @param {string[][]} board 
   * @param {string} player 
   * @param {boolean} startsTop 
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
   * Set the specified starting position to the specified player
   * @param {string[][]} board 
   * @param {string} player 
   * @param {number[][]|boolean} custom 
   */
  setSpecialStartingPosition: function (board, player, custom) {
    if (!Array.isArray(custom))
      return this.setPlayerStartingPosition(board, player, custom);

    custom.forEach(f => {
      board[f[0]][f[1]] = player;
    });
  },

  /**
   * Setup the starting point for the game
   * @param {() => Promise<boolean>} action 
   */
  welcomeMessage: function (action) {
    const postWelcomeAction = action || (async () => {
      let response = '';

      while (!response) {
        response = await inputHandler.promptUser('Ready to start? (y/n) ');

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
    });

    return painter.printWelcomeMessage(postWelcomeAction);
  },

  /**
   * Find all the pieces for the specified player
   * @param {string[][]} board 
   * @param {string} player 
   * @returns {number[][]}
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
   * Translate positions from index to a visual representation
   * @param {number[]|number[][]} positions 
   * @returns {null|string[][]|string[]}
   */
  positionTranslator: function (positions) {
    if (Array.isArray(positions[0]))
      return positions.map(m => [rowReference[m[0]], columnReference[m[1]]]);

    return positions.length ? [rowReference[positions[0]], columnReference[positions[1]]] : null;
  },

  /**
   * Get the adyacent tiles of the specified board
   * @param {string[][]} board 
   * @param {string} oponentPlayer 
   * @param {number[]} piece 
   * @param {"up"|"down"|"both"} direction 
   * @returns {{up?: number[][], down?: number[][]}}
   */
  getAdyacentPositions: function (board, oponentPlayer, piece, direction = 'both') {
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

    if (direction === 'both') {
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
   * Get all the possible movements from the specified piece
   * @param {string[][]} board 
   * @param {string} player 
   * @param {number[]} piece 
   * @param {boolean} startsTop 
   * @returns {{coordinate: number[], killedPieces: number[][]}[]}
   */
  calculateMovement: function (board, player, piece, startsTop) {
    const result = [];
    const oponentPlayer = playerChars.find(f => player !== f);
    const pieceStatus = board[piece[0]][piece[1]] === player.toUpperCase() ? 'king' : 'normal';

    const possibleLocations = this.getAdyacentPositions(board, oponentPlayer, piece, pieceStatus === 'king' ? 'both' : startsTop ? 'down' : 'up');

    Object.entries(possibleLocations).forEach(f => {
      const direction = f[0];
      const entries = f[1];

      if (!entries)
        return;

      entries.forEach(entry => {
        if (`${board[entry[0]][entry[1]]}`.toLowerCase() === oponentPlayer)
          this.calculateJumps(board, oponentPlayer, entry, pieceStatus === 'king', { v: direction, h: entry[1] > piece[1] ? 'right' : 'left' })
            .forEach(r => result.push(r));
        else
          result.push({ coordinate: entry, killedPieces: [] });
      });
    });

    return result;
  },

  /**
   * Get the possible jumps from the given starting point
   * @param {string[][]} board 
   * @param {string} oponentPlayer 
   * @param {number[]} position 
   * @param {boolean} playerPieceIsKing 
   * @param {{v: "up"|"down"|"both", h: "right"|"left"|"both"}} orientation 
   * @param {number[][]} killedPieces 
   * @returns {{coordinate: number[], killedPieces: number[][]}[]}
   */
  calculateJumps: function (board, oponentPlayer, currentPosition, playerPieceIsKing, orientation = { v: 'both', h: 'both' }, killedPieces = []) {
    const result = [];
    const killed = [...killedPieces];
    const currentLocation = board[currentPosition[0]][currentPosition[1]];

    if (!currentLocation || currentLocation.toLowerCase() !== oponentPlayer)
      return [];

    const direction = {
      up: {
        left: null,
        right: null,
      },
      down: {
        left: null,
        right: null,
      },
    };

    switch (orientation.v) {
      case 'both':
        if (orientation.h === 'both') {
          direction.up.left = this.getLocation(currentPosition, 'up', 'left');
          direction.up.right = this.getLocation(currentPosition, 'up', 'right');

          direction.down.left = this.getLocation(currentPosition, 'down', 'left');
          direction.down.right = this.getLocation(currentPosition, 'down', 'right');
        }
        else {
          direction.up[orientation.h] = this.getLocation(currentPosition, 'up', orientation.h);
          direction.down[orientation.h] = this.getLocation(currentPosition, 'down', orientation.h);
        }

        break;

      default:
        if (orientation.h === 'both') {
          direction[orientation.v].left = this.getLocation(currentPosition, orientation.v, 'left');
          direction[orientation.v].right = this.getLocation(currentPosition, orientation.v, 'right');
        }
        else
          direction[orientation.v][orientation.h] = this.getLocation(currentPosition, orientation.v, orientation.h);
        break;
    }

    for (const vDir in direction)
      for (const hDir in direction[vDir]) {
        const location = direction[vDir][hDir];

        if (!location || board[location[0]][location[1]] !== emptyCellChar)
          continue;

        killed.push(currentPosition);
        result.push({ coordinate: location, killedPieces: killed });

        const adyacent = this.getAdyacentPositions(board, oponentPlayer, location, playerPieceIsKing ? 'both' : vDir);

        Object.entries(adyacent).forEach(entry => {
          const relatedVerticalDir = entry[0];
          const adyacentList = entry[1] || [];

          adyacentList
            .filter(f => !killed.find(e => e[0] === f[0] && e[1] === f[1]))
            .forEach(position => {
              this.calculateJumps(board, oponentPlayer, position, playerPieceIsKing, { v: relatedVerticalDir, h: position[1] > location[1] ? 'right' : 'left' }, killed)
                .forEach(movement => {
                  result.push(movement);
                });
            });
        });
      }

    return result;
  },

  /**
   * Get the location from the specified point in the specified direction
   * @param {number[]} piece 
   * @param {"up"|"down"} verticicalPosition 
   * @param {"right"|"left"} horizontalPosition 
   */
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
   * Get the game status
   * @param {string[][]} board 
   * @param {{symbol: string, startsTop: boolean}} currentPlayer 
   */
  getGameStatus: function (board, currentPlayer) {
    const oponentSymbol = playerChars.find(f => f !== currentPlayer.symbol);
    const status = {
      result: 'waiting',
      winner: null,
    };

    const playerPieces = {
      [this.normalPlayerChars.O]: this.locatePieces(board, this.normalPlayerChars.O),
      [this.normalPlayerChars.X]: this.locatePieces(board, this.normalPlayerChars.X),
    };

    if (!playerPieces.o.length) {
      status.result = 'finished';
      status.winner = this.normalPlayerChars.X;
      return status;
    }

    if (!playerPieces.x.length) {
      status.result = 'finished';
      status.winner = this.normalPlayerChars.O;
      return status;
    }

    let validMovements = false;
    for (const a of playerPieces[currentPlayer.symbol]) {
      const movements = this.calculateMovement(board, currentPlayer.symbol, a, currentPlayer.startsTop);
      if (validMovements = !!movements.length)
        break;
    }

    // Since the player cannot move:
    if (!validMovements) {
      let oponentCanMove = false;
      for (const a of playerPieces[oponentSymbol]) {
        const movements = this.calculateMovement(board, oponentSymbol, a, !currentPlayer.startsTop);
        if (oponentCanMove = !!movements.length)
          break;
      }

      // Since the oponent have available moves:
      if (oponentCanMove) {
        status.result = 'finished';
        status.winner = oponentSymbol;
        return status;
      }

      // Since no one can move:
      status.result = 'tied';
      return status;
    }

    return status;
  },

  /**
   * Start the game
   * @param {string?} boardStr 
   * @param {number?} playCount 
   */
  startGame: async function (boardStr = null, playCount = 0) {
    const parsedBoard = this.transformVisualBoard(boardStr);
    const board = parsedBoard || this.getEmptyBoard();
    const customPrompt = inputHandler.manageSpecialPrompts(painter, { board, columnReference, rowReference });
    let turnCounter = playCount || 0;
    let currentTurn = playCount ? playerChars[(turnCounter - 1) % 2] : 'x';

    if (!parsedBoard)
      playerChars.forEach((f, i) => this.setPlayerStartingPosition(board, f, i === 0));

    painter.printBoard({ board, columnReference, rowReference });
    painter.printHelp();

    while (true) {
      const startsTop = playerChars[0] === currentTurn;

      const gameStatus = this.getGameStatus(board, { symbol: currentTurn, startsTop });

      if (gameStatus.result !== 'waiting') {
        switch (gameStatus.result) {
          case 'finished':
            console.log();
            console.log(`* The WINNER is "${gameStatus.winner}" !! *`)
            console.log();
            break;

          case "tied":
            console.log();
            console.log('* The game is TIED !! *')
            console.log();
            break;
        }

        break;
      }

      turnCounter++;
      console.log(`- Player "${currentTurn}" | turn ${Math.ceil(turnCounter / 2)} -`);

      const pieces = this.locatePieces(board, currentTurn);
      const piecesLocation = this.positionTranslator(pieces);

      let inputMovement = '0';

      while (inputMovement === '0') {
        let inputPiece = '';
        console.log();
        console.log('Select a piece to play:');
        piecesLocation.forEach((f, i) => console.log(`${i + 1}) ${f[1]}${f[0]}`));

        while (!inputPiece) {
          inputPiece = await customPrompt();

          if (inputPiece.length === 2 && inputPiece.match(/^[a-h][1-8]$/i)) {
            const letter = inputPiece[0].toUpperCase();
            const number = inputPiece.substr(1);
            const inxResult = piecesLocation.findIndex(f => f[0] === number && f[1] === letter);

            if (inxResult > -1)
              inputPiece = `${inxResult + 1}`;
          }

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

        console.log('Select a place to play into:');
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

          if (inputMovement.length === 2 && inputMovement.match(/^[a-h][1-8]$/i)) {
            const letter = inputMovement[0].toUpperCase();
            const number = inputMovement.substr(1);
            const inxResult = optionsLocation.findIndex(f => f.coordinate[0] === number && f.coordinate[1] === letter);

            if (inxResult > -1)
              inputMovement = `${inxResult + 1}`;
          }

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

        // Check for a new KING
        if ((!startsTop && selectedDestination.coordinate[0] === 0)
          || (startsTop && selectedDestination.coordinate[0] === 7))
          board[selectedDestination.coordinate[0]][selectedDestination.coordinate[1]] = movingPiece.toUpperCase();
      }

      painter.printBoard({ board, columnReference, rowReference });
      currentTurn = playerChars[(turnCounter - 1) % 2];
    }

    let restartPrompt = '';
    while (!restartPrompt) {
      restartPrompt = await customPrompt('Do you want to play again? (y/n) ');

      switch (restartPrompt.toLowerCase()) {
        case 'y':
        case 'n':
          break;

        default:
          restartPrompt = '';
          break;
      }
    }

    if (restartPrompt.toLowerCase() === 'y') {
      this.changePlayerOrder();
      this.startGame();
    }
    else {
      console.log();
      console.log('See you next time!');
      return process.exit(0);
    }
  },
};