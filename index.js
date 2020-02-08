const util = require("./util");


util.welcomeMessage()
  .then(result => {
    if (!result) {
      console.log();
      console.log('See you next time!');
      return process.exit(0);
    }

    util.startGame();
  });
