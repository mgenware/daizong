import { t } from './common.js';

const conf = 'outOfWDConf';

it('Create and del a dir outside of WD', async () => {
  await t(
    conf,
    't',
    `>> #t
>> mkdir
>> echo hi
hi
>> del`,
    { checkPrefixes: true },
  );
});
