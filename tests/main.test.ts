import { promisify } from 'util';
import { exec } from 'child_process';
import * as assert from 'assert';

const execAsync = promisify(exec);
const confBasic = 'basic';

async function t(configName: string, taskName: string, expected: string) {
  const output = await execAsync(
    `node "./dist/main.js" -c "./tests/cfgs/${configName}.js" ${taskName}`,
  );
  assert.equal(output, expected);
}

it('Single cmd', async () => {
  await t(confBasic, 'single_cmd', 'hi');
});
