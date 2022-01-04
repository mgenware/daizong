export default {
  _: {
    defaultEnv: {
      a: 'AAA',
      b: 'BBB',
    },
    privateTasks: {
      priA: {
        b: {
          start: {
            run: 'echo priA-b-started',
          },
        },
        stop: {
          run: 'echo priA-stopped',
        },
        run: 'echo priA',
      },
      priB: {
        run: 'echo priB',
      },
    },
  },
  zzz: {
    start: {
      run: 'echo a-b-started',
    },
  },
  a: {
    b: {
      start: {
        run: 'echo a-b-started',
      },
    },
    stop: {
      run: 'echo a-stopped',
    },
    trigger_err: {
      run: '#priA-b-xyz',
    },
    private: {
      start: {
        run: '#priA-b-start',
      },
      stop: {
        run: '#priA-stop',
      },
    },
  },
};
