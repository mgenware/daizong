module.exports = {
  single_cmd: {
    cmd: 'echo hi',
  },
  single_cmd_str: {
    cmd: 'node ./tests/data/delay.js 1000 haha',
  },
  multiple_cmds: {
    cmd: ['echo 1', 'echo 2'],
  },
  delay1: {
    cmd: 'node ./tests/data/delay.js 1000 haha',
  },
  s1: {
    cmd: ['echo start', '#s2', 'echo end'],
  },
  s2: {
    cmd: '#s3',
  },
  s3: {
    cmd: '#single_cmd',
  },
  p1: {
    cmd: ['node ./tests/data/delay.js 1500 slowest', '#delay1', '#s2'],
    parallel: true,
  },
  env1: {
    cmd: 'node ./tests/data/env.js aaa',
    env: {
      aaa: '123',
    },
  },
  env2: {
    cmd: 'node ./tests/data/env.js a b',
    env: { b: '3' },
  },
  env_cascading: {
    cmd: '#env2',
    env: {
      a: '1',
      b: '2',
    },
  },
};
