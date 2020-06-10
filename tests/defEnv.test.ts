import { t } from './common';

const confDefEnv = 'defEnvConf';

it('Default ENV', async () => {
  await t(
    confDefEnv,
    'parentTask',
    `Loaded default environment variables: { a: 'AAA', b: 'BBB' }
>> #parentTask
>> #childTask
>> node ./tests/data/env.js b
BBB
`,
  );
});
