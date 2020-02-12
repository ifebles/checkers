const moves = require("./movements");
const { playerList } = require("./constants");
const { positionTranslator } = require("./util");


/**
 * Filter the playable pieces
 * @param {string[][]} board 
 * @param {string} player 
 * @param {number[][]} playerPieces 
 * @param {boolean} startsTop 
 */
const getPlayablePieces = (board, player, playerPieces, startsTop) => playerPieces
  .map((m, i) => ({ piece: m, index: i, options: moves.calculateMovement(board, player, m, startsTop) }))
  .filter(f => f.options.length);


const getOponentPlayablePieces = (board, player, playerStartsTop) => {
  const oponent = playerList.find(f => f !== player);

  return moves.locatePieces(board, oponent)
    .map(m => ({ piece: m, options: moves.calculateMovement(board, oponent, m, !playerStartsTop) }));
};


const simulatePlay = (board, player, startsTop, piece, option) => {
  const boardCopy = [...board].map(m => [...m]);
  moves.managePlay(boardCopy, player, startsTop)
    .select(piece)
    .execute(option);


};


/**
 * 
 * @param {ReturnType<getPlayablePieces>} piecesOptions 
 */
const calculateBestPlays = (board, player, startsTop, piecesOptions, simulating = false) => {
  /**
   * @type {{index: number, options: {index: number, points: number}[]}[]}
   */
  const priority = [];

  /**
   * @type {{index: number, points: number}[]}
   */
  const threatened = [];

  // Check for the ones with secured kills
  piecesOptions
    .filter(f => f.options.some(s => s.killedPieces.length))
    .forEach(f => priority.push({
      index: f.index,
      options: f.options.reduce((o, e, i) => {
        if (e.killedPieces.length)
          o.push({
            index: i,
            points: 2 * e.killedPieces.length,
          });

        return o;
      }, []),
    }));

  // Check for the ones threatened to be killed
  const oponentOptions = getOponentPlayablePieces(board, player, startsTop);
  piecesOptions
    .filter(f => oponentOptions.some(s => s.options.some(o => o.killedPieces
      .some(k => k[0] === f.piece[0] && k[1] === f.piece[1]))))
    .forEach(f => threatened.push({
      index: f.index,
      points: 2 * oponentOptions
        .filter(oponent => oponent.options.some(option => option.killedPieces
          .some(k => k[0] === f.piece[0] && k[1] === f.piece[1])))
        .reduce((o, e) => {
          e.options
            .filter(op => op.killedPieces.some(s => s[0] === f.piece[0] && s[1] === f.piece[1]))
            .forEach(f => o += f.killedPieces.length);

          return o;
        }, 0),
    }));

  // Remember to check the plays on red alert of being eaten next turn


  // Remember to check plays that can avoid a kill without moving the threatened piece

  // Check the ones that can move without killing
  piecesOptions
    .forEach(f => priority.push({
      index: f.index,
      options: f.options.reduce((o, e, i) => {
        if (!e.killedPieces.length)
          o.push({
            index: i,
            points: 1,
          });

        return o;
      }, []),
    }));

  // if (!simulating)
  //   ;


  // When evaluating a random movement, give priority points to actions making the oponent free a "kings" field
  
    // console.log(JSON.stringify(piecesOptions, null, ' '));
    // console.log('|||||||||||||||');
    // console.log();
    // console.log(JSON.stringify(priority.map(m => ({
    //   ...m, piece: positionTranslator(
    //     piecesOptions.find(f => f.index === m.index).piece
    //   )
    // })), null, ' '));
    // console.log('|||||||||||||||');
    // console.log();
    // console.log(JSON.stringify(threatened.map(m => ({
    //   ...m, piece: positionTranslator(
    //     piecesOptions.find(f => f.index === m.index).piece
    //   )
    // })), null, ' '));

  return priority
    .reduce((o, e) => {
      e.options.forEach(f => {
        const entry = o.find(s => s.piece === e.index && s.option === f.index);
        if (!entry)
          o.push({
            piece: e.index,
            option: f.index,
            points: f.points,
          });
        else
          entry.points += f.points;
      });

      return o;
    }, [])
    .map(m => ({
      ...m,
      points: m.points + threatened
        .filter(f => f.index === m.piece)
        .reduce((o, e) => o += e.points, 0),
    }));
};


module.exports = {
  play: (board, player, startsTop) => {
    const pieces = moves.managePlay(board, player, startsTop);
    const playable = getPlayablePieces(board, player, pieces.rawLocations, startsTop);

    const result = calculateBestPlays(board, player, startsTop, playable);
    console.log(
      result.map(m => ({
        ...m,
        trans: positionTranslator(playable.find(f => f.index === m.piece).piece),
        action: JSON.stringify(playable.find(f => f.index === m.piece).options[m.option])
      }))
    );

  },
};