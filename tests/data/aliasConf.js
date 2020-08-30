module.exports = {
  _: {
    defaultEnv: {
      a: 'AAA',
      b: 'BBB',
    },
  },
  childTask: {
    run: 'node ./tests/data/env.js b',
  },
  parentTask: {
    run: '#childTask',
    alias: 'p',
  },
};
