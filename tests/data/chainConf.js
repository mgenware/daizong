module.exports = {
  _: {
    defaultEnv: {
      a: 'AAA',
      b: 'BBB',
    },
    privateTasks: {
      priA: {
        b: {
          start: {
            run: 'echo priA b started',
          },
        },
        stop: {
          run: 'echo priA stopped',
        },
      },
    },
  },
  a: {
    b: {
      start: {
        run: 'echo a b started',
      },
    },
    stop: {
      run: 'echo a stopped',
    },
    private: {
      start: {
        run: '#priA b start',
      },
      stop: {
        run: '#priA stop',
      },
    },
  },
};
