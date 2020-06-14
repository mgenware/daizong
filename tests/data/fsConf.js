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
};
