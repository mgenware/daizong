module.exports = {
  single_cmd: {
    run: ['echo', 'hi'],
  },
  single_cmd_str: {
    run: 'node ./tests/data/delay.js 1000 haha',
  },
  multiple_cmds: {
    run: [
      ['echo', '1'],
      ['echo', '2'],
    ],
  },
  delay1: {
    run: ['node', './tests/data/delay.js', '1000', 'haha'],
  },
  combo1: {
    run: [['echo', 'start'], '#combo2', 'echo end'],
  },
  combo2: {
    run: '#combo3',
  },
  combo3: {
    run: '#single_cmd',
  },
};
