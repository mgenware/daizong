module.exports = {
  a: {
    run: 'node ./tests/data/env.js b',
  },
  b: {
    alias: 'alias-of-b',
    run: '#childTask',
  },
};
