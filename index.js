const checker = require("./checkers");


checker.welcomeMessage()
  .then(result => {
    if (!result) {
      console.log();
      console.log('See you next time!');
      return process.exit(0);
    }

    checker.startGame();
  });
