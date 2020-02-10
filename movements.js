const { playerList, emptyCellChar, emptyArray } = require("./constants");



module.exports = {
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
    const oponentPlayer = playerList.find(f => player !== f);
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
        if (orientation.h === 'both')
          for (const vDir in direction)
            for (const hDir in direction[vDir])
              direction[vDir][hDir] = this.getLocation(currentPosition, vDir, hDir);
        else
          for (const vDir in direction)
            direction[vDir][orientation.h] = this.getLocation(currentPosition, vDir, orientation.h);

        break;

      default:
        if (orientation.h === 'both')
          for (const hDir in direction[orientation.v])
            direction[orientation.v][hDir] = this.getLocation(currentPosition, orientation.v, hDir);
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
};