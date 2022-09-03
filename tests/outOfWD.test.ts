import { t } from './common.js';

const conf = 'outOfWDConf';

it('Create and del a dir outside of WD', async () => {
  await t(
    conf,
    't',
    `>> #t
>> [before]
>> #beforeT
>> mkdir
>> [main]
>> echo hi
hi
>> [after]
>> #afterT
>> del`,
    { checkPrefixes: true },
  );
});
