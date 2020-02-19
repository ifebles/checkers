const moves = require("./movements");
const { playerList, emptyArray } = require("./constants");
const { log, positionTranslator } = require("./util");


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


/**
 * Get the pieces that the oponent can play
 * @param {string[][]} board 
 * @param {string} player 
 * @param {boolean} playerStartsTop 
 */
const getOponentPlayablePieces = (board, player, playerStartsTop) => {
  const oponent = playerList.find(f => f !== player);

  return moves.locatePieces(board, oponent)
    .map((m, i) => ({ piece: m, index: i, options: moves.calculateMovement(board, oponent, m, !playerStartsTop) }))
    .filter(f => f.options.length);
};


/**
 * Simulate a play and get the oponent quantified sum (score) as the returned value and value indicating if can be killed
 * @param {string[][]} board 
 * @param {string} player 
 * @param {boolean} startsTop 
 * @param {{
    piece: number[],
    index: number,
    options: {
        coordinate: number[],
        killedPieces: number[][],
    }[],
  }} playablePiece 
 * @param {number} option 
 * @param {number} amountOfSimulations 
 */
const simulatePlay = (board, player, startsTop, playablePiece, option, amountOfSimulations = 1) => {
  const boardCopy = [...board].map(m => [...m]);
  const piece = playablePiece.index;
  const pieceIntendedCoordinate = playablePiece.options[option].coordinate;

  moves.managePlay(boardCopy, player, startsTop)
    .select(piece)
    .execute(option);

  const oponent = playerList.find(f => f !== player);
  const oponentPlayablePieces = getOponentPlayablePieces(boardCopy, player, startsTop);
  const oponentQuantifiedPlayResult = calculateBestPlays(boardCopy, oponent, !startsTop, oponentPlayablePieces, true);

  const killable = oponentPlayablePieces.some(s => s.options.some(o => o.killedPieces
    .some(k => k[0] === pieceIntendedCoordinate[0] && k[1] === pieceIntendedCoordinate[1])));

  let result = oponentQuantifiedPlayResult
    .reduce((o, e) => o += e.points, 0);

  if (amountOfSimulations > 1) {
    let caseCounter = 0;
    const summedResults = oponentPlayablePieces.reduce((o, e) => {
      e.options.forEach((_f, i) => {
        caseCounter++;
        o += simulatePlay(boardCopy, oponent, !startsTop, e, i, amountOfSimulations - 1).result;
      });

      return o;
    }, 0);

    if (caseCounter)
      result -= summedResults / caseCounter;
  }

  return { result, killable };
};


/**
 * Quantify each piece action to decide the best course
 * @param {string[][]} board 
 * @param {string} player 
 * @param {boolean} startsTop 
 * @param {ReturnType<getPlayablePieces>} piecesOptions
 * @param {boolean} simulating 
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

  const pieceIsKing = coordinates => board[coordinates[0]][coordinates[1]] === board[coordinates[0]][coordinates[1]].toUpperCase();

  // Check for the ones with secured kills
  piecesOptions
    .filter(f => f.options.some(s => s.killedPieces.length))
    .forEach(f => priority.push({
      index: f.index,
      options: f.options.reduce((o, e, i) => {
        if (e.killedPieces.length)
          o.push({
            index: i,
            points: (e.killedPieces.some(s => pieceIsKing(s)) ? 3 : 2) * e.killedPieces.length,
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
      points: (pieceIsKing(f.piece) ? 3 : 2) * oponentOptions
        .filter(oponent => oponent.options.some(option => option.killedPieces
          .some(k => k[0] === f.piece[0] && k[1] === f.piece[1])))
        .reduce((o, e) => {
          e.options
            .filter(op => op.killedPieces.some(s => s[0] === f.piece[0] && s[1] === f.piece[1]))
            .forEach(f => o += f.killedPieces.length);

          return o;
        }, 0),
    }));

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

  // Check if the piece can become a KING
  piecesOptions
    .filter(f =>
      !pieceIsKing(f.piece)
      && f.options.some(s => s.coordinate[0] === (startsTop ? emptyArray.length - 1 : 0)))
    .forEach(f => priority.push({
      index: f.index,
      options: f.options.reduce((o, e, i) => {
        if (e.coordinate[0] === (startsTop ? emptyArray.length - 1 : 0))
          o.push({
            index: i,
            points: 2,
          });

        return o;
      }, []),
    }));


  /**
   * @type {{piece: number, option: number, points: number}[]}
   */
  const result = priority
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

  // Evaluate play convenience regarding the "quantified play quality" of the oponent depending on the action taken
  if (!simulating) {
    const getPlayablePiece = index => piecesOptions.find(f => f.index === index);

    const simulatedResults = result.map(m => ({
      ...m,
      oponentPlayValue: simulatePlay(board, player, startsTop, getPlayablePiece(m.piece), m.option),
    }));

    let higherRawScore = result.map(m => m.points).sort((a, b) => b - a)[0];

    // If no direct distinction found for the (still raw) best scored play:
    if (result.filter(f => f.points === higherRawScore).length > 1)
      simulatedResults
        // Take those with safe plays if no "critical play" found
        .filter(f => higherRawScore === 1 ? !f.oponentPlayValue.killable : true)
        .forEach(f => {
          // Simulate the play
          const boardCopy = [...board].map(m => [...m]);
          moves.managePlay(boardCopy, player, startsTop)
            .select(f.piece)
            .execute(f.option);

          const futurePlays = getPlayablePieces(boardCopy, player, moves.locatePieces(boardCopy, player), startsTop);

          // Check the movements threatening enemy pieces
          const bestAmountOfKillsPerPiece = futurePlays
            .map(m => m.options.map(m => m.killedPieces.length
              // If there are KING pieces threatened, add 2 more points (making 3 altogether) for each
              + m.killedPieces.reduce((o, e) => o += pieceIsKing(e) ? 2 : 0, 0)))
            .map(m => m.sort((a, b) => b - a)[0])
            .filter(f => f > 0)
            .sort((a, b) => b - a);

          if (bestAmountOfKillsPerPiece.length)
            result.find(r => r.piece === f.piece && r.option === f.option)
              // Add points as: (2 * bestAmountOfPossibleKills) + (amountOfKillOptions - 1)
              .points += (2 * bestAmountOfKillsPerPiece[0]) + (bestAmountOfKillsPerPiece.length - 1);
        });

    const consequenceResult = simulatedResults.map(m => ({
      ...m,
      // Increase the "oponentPlayValue" if the piece can be killed
      alteredPlayValue: m.oponentPlayValue.result * (m.oponentPlayValue.killable ?
        // If the piece is KING, set the value multiplier to 3; multiply by 2 if not
        (pieceIsKing(getPlayablePiece(m.piece).piece) ? 3 : 2)
        // If the action actually kills more than one piece, divide by 2 to reduce the multiplier
        / (piecesOptions.find(f => f.index === m.piece).options[m.option].killedPieces.length ? 2 : 1) :
        1),
    }));

    log.bot(consequenceResult);
    log.bot();

    const playValues = consequenceResult
      .map(m => m.alteredPlayValue)
      .filter((e, i, o) => o.indexOf(e) === i)
      .sort((a, b) => a - b)
      .map((m, i) => ({ value: m, penalty: i - 2 }));

    log.bot(playValues)
    log.bot();

    const penaltyList = consequenceResult
      .map(m => ({
        piece: m.piece,
        option: m.option,
        penalty: playValues.find(f => f.value === m.alteredPlayValue).penalty,
      }));

    log.bot(penaltyList)
    log.bot();

    result.forEach(f => f.points -= penaltyList
      .find(p => p.piece === f.piece && p.option === f.option).penalty);
  }

  return result;
};


module.exports = {
  play: (board, player, startsTop) => {
    const pieces = moves.managePlay(board, player, startsTop);
    const playable = getPlayablePieces(board, player, pieces.rawLocations, startsTop);

    const result = calculateBestPlays(board, player, startsTop, playable);
    const highestValue = result
      .map(m => m.points)
      .filter((e, i, o) => o.indexOf(e) === i)
      .sort((a, b) => b - a)[0];

    log.bot(result.map(m => ({
      ...m,
      pieces: positionTranslator(playable.find(f => f.index === m.piece).piece),
      location: positionTranslator(playable.find(f => f.index === m.piece).options[m.option].coordinate),
      kills: JSON.stringify(playable.find(f => f.index === m.piece).options[m.option].killedPieces),
    })));

    const bestPlays = result.filter(f => f.points === highestValue);

    if (!bestPlays.length)
      return log.warn('Unhandled scenario... no play found');

    let selectedPlay;

    if (bestPlays.length > 1)
      selectedPlay = bestPlays[Math.floor((Math.random() * 100) % bestPlays.length)];
    else
      selectedPlay = bestPlays[0];

    pieces
      .select(selectedPlay.piece)
      .execute(selectedPlay.option);

    const pieceMoved = positionTranslator(playable.find(f => f.index === selectedPlay.piece).piece);
    const location = positionTranslator(playable.find(f => f.index === selectedPlay.piece).options[selectedPlay.option].coordinate);
    const killed = (positionTranslator(playable.find(f => f.index === selectedPlay.piece).options[selectedPlay.option].killedPieces) || [])
      .map(m => m[1] + m[0]).join(', ');

    log();
    log(
      'CPU played:',
      pieceMoved[1] + pieceMoved[0],
      'into',
      location[1] + location[0] + (killed ? ';' : ''),
      killed ? 'Pieces killed: ' + killed : ''
    );
    log();
  },
};