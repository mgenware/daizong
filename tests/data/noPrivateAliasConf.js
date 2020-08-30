module.exports = {
  _: {
    defaultEnv: {
      a: 'AAA',
      b: 'BBB',
    },
    privateTasks: {
      priTask: {
        run: 'node ./tests/data/env.js b',
        alias: 'childTask',
      },
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
