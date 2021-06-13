export default {
  _: {
    defaultEnv: {
      a: 'AAA',
      b: 'BBB',
    },
    privateTasks: {
      childTask: {
        run: 'node ./tests/data/env.js b',
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
