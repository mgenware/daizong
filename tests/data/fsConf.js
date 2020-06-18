module.exports = {
  before: {
    run: 'echo hi',
    before: {
      mkdir: 'tests/data/tmp/before1-new',
      del: 'tests/data/tmp/before1/*.txt',
    },
  },
  after: {
    run: 'echo hi',
    after: {
      del: ['tests/data/tmp/after1/*.*', '!tests/data/tmp/after1/a.txt'],
    },
  },
  runActions: {
    run: {
      mkdir: 'tests/data/tmp/run1-new',
      del: 'tests/data/tmp/run1/*.txt',
    },
  },
  order1: {
    run: {
      del: 'tests/data/tmp/order1',
      mkdir: 'tests/data/tmp/order1',
    },
  },
  order2: {
    run: {
      del: 'tests/data/tmp/order2',
      mkdir: 'tests/data/tmp/order2',
    },
  },
  mkdirDel1: {
    run: {
      mkdirDel: 'tests/data/tmp/mkdirDel1',
    },
  },
  mkdirDel2: {
    run: {
      mkdirDel: 'tests/data/tmp/mkdirDel2',
    },
  },
};
