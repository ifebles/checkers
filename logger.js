const { locatePieces } = require("./movements");
const { playerList } = require("./constants");



module.exports = class {
  /**
   * Initialize log object
   * @param {string} firstPlayer 
   * @param {string} topPlayer 
   * @param {string[][]} board 
   */
  constructor(firstPlayer, topPlayer, board) {
    const initialPieces = {};

    playerList.forEach(f =>
      initialPieces[f] = locatePieces(board, f)
        .map(m => ({ location: m, isKing: board[m[0]][m[1]] === f.toUpperCase() })));

    this.logObject = {
      firstPlayer,
      topPlayer,
      winner: null,
      status: null,
      initialPieces,
      plays: [],
    };
  }

  /**
   * Set the game status
   * @param {"playing"|"finished"|"tied"} status 
   */
  setStatus(status) {
    this.logObject.status = status;
  }

  /**
   * Set the game winner
   * @param {string} player 
   */
  setWinner(player) {
    this.logObject.winner = player;
  }

  /**
   * Add new action to the log
   * @param {string[][]} board 
   * @param {number[]} piece 
   * @param {{coordinate: number[], killedPieces: number[][]}} action
   */
  addAction(board, piece, action) {
    this.logObject.plays.push({
      piece: {
        location: piece,
        isKing: board[action.coordinate[0]][action.coordinate[1]].toUpperCase() === board[action.coordinate[0]][action.coordinate[1]]
      },
      destination: action.coordinate,
      killed: action.killedPieces,
    });
  }

  getLog() {
    return { ...this.logObject };
  }
};