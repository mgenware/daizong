import { t } from './common.js';

const conf = 'outOfWDConf';

it('Create and del a dir outside of WD', async () => {
  await t(
    conf,
    't',
    `>> #t
>> #t (before)
>> mkdir
>> echo hi
hi
>> #t (after)
>> del`,
    { checkPrefixes: true },
  );
});
