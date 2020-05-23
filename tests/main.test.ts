import { promisify } from 'util';
import { exec } from 'child_process';
import * as assert from 'assert';

const execAsync = promisify(exec);
const confBasic = 'basic';

function splitString(str: string): string[] {
  return str.split(/\r?\n/);
}

async function t(
  configName: string,
  taskName: string,
  cmd: string[],
  expected: string[],
) {
  const output = await execAsync(
    `node "./dist/main.js" -c "./tests/cfgs/${configName}.js" ${taskName}`,
  );
  const outputString = output.stdout || '';
  const expectedList: string[] = [];
  for (let i = 0; i < cmd.length; i++) {
    expectedList.push(`>> ${cmd[i]}`);
    expectedList.push(expected[i]);
    expectedList.push('');
  }
  // An extra newline at the end of process output.
  expectedList.push('');
  // Split output into lines to avoid newline difference among different platforms.
  assert.deepEqual(splitString(outputString), expectedList);
}

it('Single cmd', async () => {
  await t(confBasic, 'single_cmd', ['echo hi'], ['hi']);
});

it('Multiple cmds', async () => {
  await t(confBasic, 'multiple_cmds', ['echo 1', 'echo 2'], ['1', '2']);
});
