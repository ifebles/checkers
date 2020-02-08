const readline = require("readline");


const specialCommands = {
  help: context => context.printHelp(),
  board: (context, board) => context.printBoard(board),
};

module.exports = {
  /**
   * Manage user input
   * @param {string} prompt 
   * @returns {Promise<string>}
   */
  promptUser: function (prompt = '> ') {
    return new Promise(resolve => {
      const rl = readline.createInterface(process.stdin, process.stdout);

      rl.question(prompt, resp => {
        resolve(resp);
        rl.close();
      });
    })
  },

  /**
   * Handle special commands while prompting
   * @param {string[][]} board 
   * @returns {(prompt: string) => Promise<string>}
   */
  manageSpecialPrompts: function (context, board) {
    return async prompt => {
      let response = '';

      while (!response) {
        response = await this.promptUser(prompt);

        if (specialCommands[response]) {
          specialCommands[response](context, board);
          response = '';
        }
      }

      return response;
    };
  },
};