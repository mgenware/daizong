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

it('ENV cascading', async () => {
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

it('ENV cascading (called from another task)', async () => {
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

it('ENV groups should ignore empty names', async () => {
  await t(
    'envConf',
    'childTaskWithEmptyEnvGroups',
    `Loaded default environment variables: {
  defA: 'default:a',
  defB: 'default:b',
  defC: 'default:c',
  defD: 'default:d'
}
>> #childTaskWithEmptyEnvGroups
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

it('Invalid group names', async () => {
  await t(
    'envConf',
    'childTaskWithInvalidEnvGroups',
    `Loaded default environment variables: {
  defA: 'default:a',
  defB: 'default:b',
  defC: 'default:c',
  defD: 'default:d'
}
>> #childTaskWithInvalidEnvGroups
Env group names must be strings, got 123.`,
    { hasError: true },
  );
});

it('Preset: node:dev', async () => {
  await t(
    'envConf',
    'presetDev',
    `Loaded default environment variables: {
  defA: 'default:a',
  defB: 'default:b',
  defC: 'default:c',
  defD: 'default:d'
}
>> #presetDev
>> node ./tests/data/env.js NODE_ENV
development`,
  );
});

it('Preset: node:prod', async () => {
  await t(
    'envConf',
    'presetProd',
    `Loaded default environment variables: {
  defA: 'default:a',
  defB: 'default:b',
  defC: 'default:c',
  defD: 'default:d'
}
>> #presetProd
>> node ./tests/data/env.js NODE_ENV
production`,
  );
});
