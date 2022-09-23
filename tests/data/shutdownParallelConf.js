export default {
  foo: {
    parallel: true,
    run: ['node ./tests/data/err.js 1500', 'node ./tests/data/longRunning.js'],
  },
};
