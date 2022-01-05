import { t } from './common.js';

it('Default ENV', async () => {
  await t(
    'defEnvConf',
    'parentTask',
    `Loaded default environment variables: {
  a: 'AAA',
  b: 'BBB'
}
>> #parentTask
>> #childTask
>> node ./tests/data/env.js b
BBB`,
  );
});

it('ENV groups (1)', async () => {
  await t(
    'envConf',
    'childTask',
    `Loaded default environment variables: {
  defA: 'default:a',
  defB: 'default:b',
  defC: 'default:c',
  defD: 'default:d'
}
>> #childTask
>> node ./tests/data/env.js defA defB defC defD grpA prtA prtB a
default:a
b
group2:c
d
group:a
undefined
b
a`,
  );
});

it('ENV groups (2)', async () => {
  await t(
    'envConf',
    'parentTask',
    `Loaded default environment variables: {
  defA: 'default:a',
  defB: 'default:b',
  defC: 'default:c',
  defD: 'default:d'
}
>> #parentTask
>> #childTask
>> node ./tests/data/env.js defA defB defC defD grpA prtA prtB a
default:a
b
group2:c
d
group:a
parent:a
b
a`,
  );
});
