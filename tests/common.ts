import { exec } from 'child_process';
import { promisify } from 'util';
import * as assert from 'assert';

const execAsync = promisify(exec);

function splitString(str: string): string[] {
  return str.split(/\r?\n/);
}

export async function t(
  configName: string,
  taskName: string,
  expected: string,
  hasError?: boolean,
): Promise<void> {
  try {
    const output = await execAsync(
      `node "./dist/main.js" -c "./tests/data/${configName}.js" ${taskName}`,
    );
    const outputString = output.stdout || '';
    // Split output into lines to avoid newline difference among different platforms.
    assert.deepEqual(splitString(outputString), splitString(expected));
  } catch (err) {
    if (hasError) {
      // Split output into lines to avoid newline difference among different platforms.
      assert.deepEqual(splitString(err.stdout || ''), splitString(expected));
    } else {
      throw err;
    }
  }
}
