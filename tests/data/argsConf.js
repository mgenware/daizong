module.exports = {
  print: {
    run: 'node ./tests/data/args.js',
  },
  printWithArgs: {
    run: 'node ./tests/data/args.js a b',
  },
  group: {
    group2: {
      run: 'node ./tests/data/args.js a b',
    },
  },
};
