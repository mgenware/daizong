export default {
  _: {
    privateTasks: {
      pri1: {
        run: 'echo private',
      },
    },
  },
  single_cmd: {
    run: 'echo hi',
  },
  single_cmd_str: {
    run: 'node ./tests/data/delay.js 1000 haha',
  },
  single_cmd_no_run: 'echo hi',
  multiple_cmds: {
    run: ['echo 1', 'echo 2'],
  },
  multiple_cmds_no_run: ['echo 1', 'echo 2'],
  delay1: {
    run: 'node ./tests/data/delay.js 1000 haha',
  },
  s1: {
    run: ['echo start', '#s2', 'echo end'],
  },
  s2: {
    run: '#s3',
  },
  s3: {
    run: '#single_cmd',
  },
  p1: {
    run: ['node ./tests/data/delay.js 1500 slowest', '#delay1', '#s2'],
    parallel: true,
  },
  env1: {
    run: 'node ./tests/data/env.js aaa',
    env: {
      aaa: '123',
    },
  },
  env2: {
    run: 'node ./tests/data/env.js a b',
    env: { b: '3' },
  },
  env_cascading: {
    run: '#env2',
    env: {
      a: '1',
      b: '2',
    },
  },
  stopsOnErr: {
    run: ['echo 1', 'node ./tests/data/err.js', 'echo 2'],
  },
  stopsOnErrParallel: {
    run: [
      'echo 1',
      'node ./tests/data/err.js 300',
      'node ./tests/data/delay.js 1000 slowest',
    ],
  },
  ignoreErr: {
    run: ['echo 1', '#errIgnored', 'echo 2'],
  },
  ignoreErrParallel: {
    run: [
      'node ./tests/data/delay.js 500 500',
      '#errIgnored',
      'node ./tests/data/delay.js 1000 slowest',
    ],
    parallel: true,
  },
  errIgnored: {
    run: 'node ./tests/data/err.js 100',
    ignoreError: true,
  },
  runPrivate: {
    run: '#pri1',
  },
};
