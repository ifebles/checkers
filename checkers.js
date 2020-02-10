const inputHandler = require("./input");
const painter = require("./painter");
const { emptyCellChar, columnReference, rowReference, normalPlayerChars, playerList, emptyArray } = require("./constants");
const moves = require("./movements");
const { transformVisualBoard, log, getIndexFromUserInput } = require("./util");

const playerChars = playerList;


module.exports = {
  /**
   * New board
   * @returns {string[][]}
   */
  getEmptyBoard: function () {
    return [...emptyArray]
      .map(_m => [...emptyArray].fill(emptyCellChar));
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
   * Get the game status
   * @param {string[][]} board 
   * @param {{symbol: string, startsTop: boolean}} currentPlayer 
   */
  getGameStatus: function (board, currentPlayer) {
    const oponentSymbol = playerChars.find(f => f !== currentPlayer.symbol);
    const status = {
      result: 'playing',
      winner: null,
    };

    const playerPieces = {
      [normalPlayerChars.O]: moves.locatePieces(board, normalPlayerChars.O),
      [normalPlayerChars.X]: moves.locatePieces(board, normalPlayerChars.X),
    };

    if (!playerPieces.o.length) {
      status.result = 'finished';
      status.winner = normalPlayerChars.X;
      return status;
    }

    if (!playerPieces.x.length) {
      status.result = 'finished';
      status.winner = normalPlayerChars.O;
      return status;
    }

    let validMovements = false;
    for (const a of playerPieces[currentPlayer.symbol]) {
      const movements = moves.calculateMovement(board, currentPlayer.symbol, a, currentPlayer.startsTop);
      if (validMovements = !!movements.length)
        break;
    }

    // Since the player cannot move:
    if (!validMovements) {
      let oponentCanMove = false;
      for (const a of playerPieces[oponentSymbol]) {
        const movements = moves.calculateMovement(board, oponentSymbol, a, !currentPlayer.startsTop);
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
    const parsedBoard = transformVisualBoard(boardStr);
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

      if (gameStatus.result !== 'playing') {
        switch (gameStatus.result) {
          case 'finished':
            log();
            log(`* The WINNER is "${gameStatus.winner}" !! *`)
            log();
            break;

          case "tied":
            log();
            log('* The game is TIED !! *')
            log();
            break;
        }

        break;
      }

      turnCounter++;
      log(`- Player "${currentTurn}" | turn ${Math.ceil(turnCounter / 2)} -`);

      const pieces = moves.managePlay(board, currentTurn, startsTop);

      while (true) {
        log();
        log('Select a piece to play:');
        pieces.translatedLocations.forEach((f, i) => log(`${i + 1}) ${f[1]}${f[0]}`));

        const pieceIndex = await getIndexFromUserInput(customPrompt, pieces.translatedLocations);
        const options = pieces.select(pieceIndex);

        log('Select a place to play into:');
        log('0) go back');
        options.translated.forEach((f, i) => log(
          `${i + 1}) ${f.coordinate[1]}${f.coordinate[0]}${
          f.killedPieces.length ?
            ` // Pieces killed: ${f.killedPieces.map(m => m[1] + m[0]).join(', ')}` :
            ''}`));

        const optionIndex = await getIndexFromUserInput(customPrompt, options.translated.map(m => m.coordinate), true);

        if (optionIndex === -1)
          continue;

        options.execute(optionIndex);
        break;
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
      log();
      log('See you next time!');
      return process.exit(0);
    }
  },
};