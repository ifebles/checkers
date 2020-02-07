const util = require("./util");


util.printWelcomeMessage()
  .then(result => {
    if (!result) {
      console.log();
      console.log('See you next time!');
      return process.exit(0);
    }

    util.startGame();
  });

// util.startGame(
// `   A   B   C   D   E   F   G   H 
// 1 | - | o | - | o | - | o | - | o | 1
// 2 | - | - | x | - | o | - | o | - | 2
// 3 | - | o | - | o | - | o | - | o | 3
// 4 | - | - | - | - | - | - | - | - | 4
// 5 | - | - | - | x | - | - | - | - | 5
// 6 | x | - | x | - | - | - | x | - | 6
// 7 | - | - | - | x | - | x | - | x | 7
// 8 | x | - | O | - | x | - | x | - | 8
//     A   B   C   D   E   F   G   H     `, 13);