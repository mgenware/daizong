/* eslint-disable no-param-reassign */
import { exec } from 'child_process';
import { promisify } from 'util';
import * as assert from 'assert';

const execAsync = promisify(exec);

function splitString(str: string): string[] {
  return str.split(/\r?\n/);
}

export interface TOptions {
  hasError?: boolean;
  args?: string;
}

export async function t(
  configName: string,
  taskName: string,
  expected: string,
  opt?: TOptions,
): Promise<void> {
  try {
    opt = opt || {};
    const output = await execAsync(
      `node "./dist/main.js" -c "./tests/data/${configName}.js"${
        opt.args ? ` ${opt.args}` : ''
      } ${taskName}`,
    );
    const outputString = output.stdout ?? '';
    // Split output into lines to avoid newline difference among different platforms.
    assert.deepEqual(splitString(outputString), splitString(expected));
  } catch (err) {
    if (opt?.hasError) {
      // Split output into lines to avoid newline difference among different platforms.
      assert.deepEqual(splitString(err.stdout ?? ''), splitString(expected));
    } else {
      throw err;
    }
  }
}
