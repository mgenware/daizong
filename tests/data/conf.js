module.exports = {
  single_cmd: {
    cmd: ['echo', 'hi'],
  },
  single_cmd_str: {
    cmd: 'node ./tests/data/delay.js 1000 haha',
  },
  multiple_cmds: {
    cmd: [{ cmd: ['echo', '1'] }, { cmd: 'echo 2' }],
  },
  delay1: {
    cmd: ['node', './tests/data/delay.js', '1000', 'haha'],
  },
  s1: {
    cmd: [{ cmd: ['echo', 'start'] }, { cmd: '#s2' }, { cmd: 'echo end' }],
  },
  s2: {
    cmd: '#s3',
  },
  s3: {
    cmd: '#single_cmd',
  },
  p1: {
    cmd: [
      { cmd: ['node', './tests/data/delay.js', '1500', 'slowest'] },
      { cmd: '#delay1' },
      { cmd: '#s2' },
    ],
    parallel: true,
  },
  env1: {
    cmd: ['node', './tests/data/env.js', 'aaa'],
    env: {
      aaa: '123',
    },
  },
  env2: {
    cmd: ['node', './tests/data/env.js', 'a', 'b'],
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
