module.exports = {
  single_cmd: {
    run: 'echo hi',
  },
  single_cmd_str: {
    run: 'node ./tests/data/delay.js 1000 haha',
  },
  multiple_cmds: {
    run: ['echo 1', 'echo 2'],
  },
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
};
