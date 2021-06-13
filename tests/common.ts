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
  configName: string | null,
  taskName: string,
  expected: string,
  opt?: TOptions,
): Promise<void> {
  try {
    opt = opt || {};
    let cmd = 'node "./dist/main.js"';
    if (configName) {
      cmd += ` -c "./tests/data/${configName}.js"`;
    }
    if (opt.args) {
      cmd += ` ${opt.args}`;
    }
    cmd += ` ${taskName}`;
    const output = await execAsync(cmd);
    const outputString = output.stdout ?? '';
    // Split output into lines to avoid newline difference among different platforms.
    assert.deepStrictEqual(splitString(outputString), splitString(expected));
  } catch (err) {
    if (opt?.hasError) {
      // Split output into lines to avoid newline difference among different platforms.
      assert.deepStrictEqual(
        splitString(err.stdout ?? ''),
        splitString(expected),
      );
    } else {
      throw err;
    }
  }
}
