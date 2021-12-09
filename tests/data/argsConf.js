export default {
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
  printAll: {
    run: ['#print', 'node ./tests/data/args.js __', '#group-group2'],
  },
};
