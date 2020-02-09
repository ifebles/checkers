
module.exports = {
  /**
   * "Empty space" character representation
   */
  get emptyCellChar() {
    return '-';
  },

  /**
   * Name of the columns
   */
  get columnReference() {
    return ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  },

  /**
   * Name of the rows
   */
  get rowReference() {
    return ['1', '2', '3', '4', '5', '6', '7', '8'];
  },

  /**
   * Normal player characters
   */
  get normalPlayerChars() {
    return {
      O: 'o',
      X: 'x',
    };
  },
};