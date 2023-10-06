import { t } from './common.js';

const conf = 'workingDirConf';

it('Working dir - Current dir', async () => {
  await t(
    conf,
    'log',
    `>> #log
>> node
daizong`,
    { checkPrefixes: true },
  );
});

it('Working dir - Child dir', async () => {
  await t(
    conf,
    'child',
    `>> #log
>> node
data`,
    { checkPrefixes: true },
  );
});
