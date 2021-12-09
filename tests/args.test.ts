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
>> node ./tests/data/args.js a b
[ 'a', 'b' ]
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
    'printWithArgs c -d --e',
    `>> #printWithArgs
>> node ./tests/data/args.js a b c -d --e
[ 'a', 'b', 'c', '-d', '--e' ]
`,
  );
});

it('Passing args in a nested task', async () => {
  await t(
    conf,
    'group-group2 c -d --e',
    `>> #group-group2
>> node ./tests/data/args.js a b c -d --e
[ 'a', 'b', 'c', '-d', '--e' ]
`,
  );
});

it('Args are not passed to referenced tasks', async () => {
  await t(
    conf,
    'printAll a b',
    `>> #printAll
>> #print
>> node ./tests/data/args.js
[]
>> node ./tests/data/args.js __ a b
[ '__', 'a', 'b' ]
>> node ./tests/data/args.js a b
[ 'a', 'b' ]
>> #group-group2
>> node ./tests/data/args.js a b
[ 'a', 'b' ]
`,
  );
});
