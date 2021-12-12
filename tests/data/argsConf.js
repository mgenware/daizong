export default {
  print: {
    run: 'node ./tests/data/args.js',
  },
  printWithArgs: {
    run: 'node ./tests/data/args.js -a b --c',
  },
  group: {
    group2: {
      run: 'node ./tests/data/args.js -a b --c',
    },
  },
  printAll: {
    run: [
      '#print',
      'node ./tests/data/args.js -a b --c',
      'node ./tests/data/args.js',
      '#group-group2',
    ],
  },
};
