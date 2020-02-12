const checker = require("./checkers");


checker.welcomeMessage()
  .then(result => {
    switch (result) {
      case '0':
        console.log();
        console.log('See you next time!');
        return process.exit(0);

      case '1':
      case '2':
        checker.startGame(result === '1' ? 'player' : 'cpu');
        break;

      case '3':
        console.log('Not implemented yet');
        break;

      default:
        console.error('Unhandled input');
        return process.exit(1);
    }
  });
