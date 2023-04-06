import { t } from './common.js';

const conf = 'outOfWDConf';

it('Create and del a dir outside of WD', async () => {
  await t(
    conf,
    't',
    `>> #t
>> #t [before]
>> #beforeT
>> mkdir
>> #t [run]
>> echo hi
hi
>> #t [after]
>> #afterT
>> del`,
    { checkPrefixes: true },
  );
});
