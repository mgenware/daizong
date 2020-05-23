import { promisify } from 'util';
import { exec } from 'child_process';
import * as assert from 'assert';

const execAsync = promisify(exec);
const confBasic = 'basic';

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

it('Single cmd', async () => {
  await t(
    confBasic,
    'single_cmd',
    `>> echo hi
hi

`,
  );
});

it('Single cmd as a string', async () => {
  await t(
    confBasic,
    'single_cmd_str',
    `>> node ./tests/data/delay.js 1000 haha
haha

`,
  );
});

it('Multiple cmds', async () => {
  await t(
    confBasic,
    'multiple_cmds',
    `>> echo 1
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
    `>> node ./tests/data/delay.js 1000 haha
haha

`,
  );
});

it('Nested 1', async () => {
  await t(
    confBasic,
    's1',
    `>> echo start
start

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
    `>> echo hi
hi

`,
  );
});

it('Nested 3', async () => {
  await t(
    confBasic,
    's3',
    `>> echo hi
hi

`,
  );
});

it('Parallel', async () => {
  await t(
    confBasic,
    'p1',
    `>> node ./tests/data/delay.js 1500 slowest
>> node ./tests/data/delay.js 1000 haha
>> echo hi
hi

haha

slowest

`,
  );
});
