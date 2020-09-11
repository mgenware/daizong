import { t } from './common';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version: pkgVersion } = require('../package.json');

const confBasic = 'conf';

it('-v', async () => {
  await t(
    confBasic,
    '-v',
    `${pkgVersion}
`,
  );
});

it('Single cmd', async () => {
  await t(
    confBasic,
    'single_cmd',
    `>> #single_cmd
>> echo hi
hi
`,
  );
});

it('Single cmd as a string', async () => {
  await t(
    confBasic,
    'single_cmd_str',
    `>> #single_cmd_str
>> node ./tests/data/delay.js 1000 haha
haha
`,
  );
});

it('Multiple cmds', async () => {
  await t(
    confBasic,
    'multiple_cmds',
    `>> #multiple_cmds
>> echo 1
1
>> echo 2
2
`,
  );
});

it('Delay', async () => {
  await t(
    confBasic,
    'delay1',
    `>> #delay1
>> node ./tests/data/delay.js 1000 haha
haha
`,
  );
});

it('Nested 1', async () => {
  await t(
    confBasic,
    's1',
    `>> #s1
>> echo start
start
>> #s2
>> #s3
>> #single_cmd
>> echo hi
hi
>> echo end
end
`,
  );
});

it('Nested 2', async () => {
  await t(
    confBasic,
    's2',
    `>> #s2
>> #s3
>> #single_cmd
>> echo hi
hi
`,
  );
});

it('Nested 3', async () => {
  await t(
    confBasic,
    's3',
    `>> #s3
>> #single_cmd
>> echo hi
hi
`,
  );
});

it('Parallel', async () => {
  await t(
    confBasic,
    'p1',
    `>> #p1
>> node ./tests/data/delay.js 1500 slowest
>> #delay1
>> node ./tests/data/delay.js 1000 haha
>> #s2
>> #s3
>> #single_cmd
>> echo hi
hi
haha
slowest
`,
  );
});

it('ENV set in config', async () => {
  await t(
    confBasic,
    'env1',
    `>> #env1
>> node ./tests/data/env.js aaa
123
`,
  );
});

it('ENV cascading', async () => {
  await t(
    confBasic,
    'env_cascading',
    `>> #env_cascading
>> #env2
>> node ./tests/data/env.js a b
1
3
`,
  );
});

it('Stops on error', async () => {
  await t(
    confBasic,
    'stopsOnErr',
    `>> #stopsOnErr
>> echo 1
1
>> node ./tests/data/err.js
error
Process exited with code 1
`,
    { hasError: true },
  );
});

it('Stops on error on parallel tasks', async () => {
  await t(
    confBasic,
    'stopsOnErrParallel',
    `>> #stopsOnErrParallel
>> echo 1
1
>> node ./tests/data/err.js 600
error
Process exited with code 1
`,
    { hasError: true },
  );
});

it('Ignore error', async () => {
  await t(
    confBasic,
    'ignoreErr',
    `>> #ignoreErr
>> echo 1
1
>> #errIgnored
>> node ./tests/data/err.js 100
error
>> echo 2
2
`,
  );
});

it('Ignore error on parallel tasks', async () => {
  await t(
    confBasic,
    'ignoreErrParallel',
    `>> #ignoreErrParallel
>> node ./tests/data/delay.js 500 500
>> #errIgnored
>> node ./tests/data/err.js 100
>> node ./tests/data/delay.js 1000 slowest
error
500
slowest
`,
  );
});

it('Private task', async () => {
  await t(
    confBasic,
    'runPrivate',
    `>> #runPrivate
>> #pri1
>> echo private
private
`,
  );
});

it('Alias', async () => {
  await t(
    'aliasConf',
    'p',
    `Loaded default environment variables: {
  a: 'AAA',
  b: 'BBB'
}
>> #p
>> #childTask
>> node ./tests/data/env.js b
BBB
`,
  );
});
