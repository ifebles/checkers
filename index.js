const util = require("./util");

const board = util.getEmptyBoard();

util.setPlayerStartingPosition(board, util.normalPlayerChars.O, true);
util.setPlayerStartingPosition(board, util.normalPlayerChars.X, false);

util.printBoard(board)