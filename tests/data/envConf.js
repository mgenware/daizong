module.exports = {
  _: {
    defaultEnv: {
      defA: 'default:a',
      defB: 'default:b',
      defC: 'default:c',
      defD: 'default:d',
    },
    envGroups: {
      group1: {
        grpA: 'group:a',
        defC: 'group:c',
      },
      group2: {
        defC: 'group2:c',
      },
    },
  },
  childTask: {
    run: 'node ./tests/data/env.js defA defB defC defD grpA prtA prtB a',
    env: {
      defB: 'b',
      defD: 'd',
      prtB: 'b',
      a: 'a',
    },
    envGroups: ['group1', 'group2'],
  },
  parentTask: {
    run: '#childTask',
    env: {
      defB: 'parent:b',
      defC: 'parent:c',
      defD: 'parent:d',
      prtA: 'parent:a',
      prtB: 'parent:b',
    },
  },
};
