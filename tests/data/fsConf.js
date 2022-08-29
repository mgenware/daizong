export default {
  before: {
    run: 'echo hi',
    before: '#beforeT',
  },
  beforeT: {
    run: {
      mkdir: 'tests/data/tmp/before1-new',
      del: 'tests/data/tmp/before1/*.txt',
    },
  },
  after: {
    run: 'echo hi',
    after: '#afterT',
  },
  afterT: {
    run: {
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
  delMultiple: {
    run: {
      del: [
        'tests/data/tmp/del-multiple/a.txt',
        'tests/data/tmp/del-multiple/b.txt',
      ],
    },
  },
  runActionsMixed: {
    run: [
      'echo 1',
      {
        mkdir: 'tests/data/tmp/runActionsMixed-new',
        del: 'tests/data/tmp/runActionsMixed-del/*.txt',
      },
      'echo 2',
    ],
  },
};
