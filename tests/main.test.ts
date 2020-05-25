import { promisify } from 'util';
import { exec } from 'child_process';
import * as assert from 'assert';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version: pkgVersion } = require('../package.json');

const execAsync = promisify(exec);
const confBasic = 'conf';

function splitString(str: string): string[] {
  return str.split(/\r?\n/);
}

async function t(configName: string, taskName: string, expected: string) {
  const output = await execAsync(
    `node "./dist/main.js" -c "./tests/data/${configName}.js" ${taskName}`,
  );
  const outputString = output.stdout || '';
  // Split output into lines to avoid newline difference among different platforms.
  assert.deepEqual(splitString(outputString), splitString(expected));
}

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
>> #multiple_cmds-1
>> echo 1
1

>> #multiple_cmds-2
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
>> #s1-1
>> echo start
start

>> #s1-2
>> #s2
>> #s3
>> #single_cmd
>> echo hi
hi

>> #s1-3
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
>> #p1-1
>> node ./tests/data/delay.js 1500 slowest
>> #p1-2
>> #delay1
>> node ./tests/data/delay.js 1000 haha
>> #p1-3
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
