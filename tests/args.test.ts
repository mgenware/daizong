import { t } from './common.js';

const conf = 'argsConf';

it('No args (1)', async () => {
  await t(
    conf,
    'print',
    `>> #print
>> node ./tests/data/args.js
[]
`,
  );
});

it('No args (2)', async () => {
  await t(
    conf,
    'printWithArgs',
    `>> #printWithArgs
>> node ./tests/data/args.js a b
[ 'a', 'b' ]
`,
  );
});

it('With args (1)', async () => {
  await t(
    conf,
    'print --args "c -d --e"',
    `>> #print
>> node ./tests/data/args.js
[ 'c', '-d', '--e' ]
`,
  );
});

it('With args (2)', async () => {
  await t(
    conf,
    'printWithArgs --args "c -d --e"',
    `>> #printWithArgs
>> node ./tests/data/args.js a b
[ 'a', 'b', 'c', '-d', '--e' ]
`,
  );
});

it('With args (3)', async () => {
  await t(
    conf,
    'group group2 --args "c -d --e"',
    `>> #group group2
>> node ./tests/data/args.js a b
[ 'a', 'b', 'c', '-d', '--e' ]
`,
  );
});
