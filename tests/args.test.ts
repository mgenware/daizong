import { t } from './common.js';

const conf = 'argsConf';

it('Call `print`', async () => {
  await t(
    conf,
    'print',
    `>> #print
>> node ./tests/data/args.js
[]
`,
  );
});

it('Call `printWithArgs`', async () => {
  await t(
    conf,
    'printWithArgs',
    `>> #printWithArgs
>> node ./tests/data/args.js -a b --c
[ '-a', 'b', '--c' ]
`,
  );
});

it('Call `print` with args', async () => {
  await t(
    conf,
    'print c -d --e',
    `>> #print
>> node ./tests/data/args.js c -d --e
[ 'c', '-d', '--e' ]
`,
  );
});

it('Call `printWithArgs` with args', async () => {
  await t(
    conf,
    'printWithArgs -d e --f',
    `>> #printWithArgs
>> node ./tests/data/args.js -a b --c -d e --f
[ '-a', 'b', '--c', '-d', 'e', '--f' ]
`,
  );
});

it('Passing args in a nested task', async () => {
  await t(
    conf,
    'group-group2 c -d --e',
    `>> #group-group2
>> node ./tests/data/args.js -a b --c c -d --e
[ '-a', 'b', '--c', 'c', '-d', '--e' ]
`,
  );
});

it('Only first non-referenced sub-task receives input arguments', async () => {
  await t(
    conf,
    'printAll -d e --f',
    `>> #printAll
>> #print
>> node ./tests/data/args.js
[]
>> node ./tests/data/args.js -a b --c -d e --f
[ '-a', 'b', '--c', '-d', 'e', '--f' ]
>> node ./tests/data/args.js
[]
>> #group-group2
>> node ./tests/data/args.js -a b --c
[ '-a', 'b', '--c' ]
`,
  );
});
