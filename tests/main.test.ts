import { promisify } from 'util';
import { exec } from 'child_process';
import * as assert from 'assert';

const execAsync = promisify(exec);
const confBasic = 'basic';

async function t(
  configName: string,
  taskName: string,
  cmd: string,
  expected: string,
) {
  const output = await execAsync(
    `node "./dist/main.js" -c "./tests/cfgs/${configName}.js" ${taskName}`,
  );
  assert.equal(output, `>> ${cmd}\n${expected}\n\n`);
}

it('Single cmd', async () => {
  await t(confBasic, 'single_cmd', 'echo hi', 'hi');
});
