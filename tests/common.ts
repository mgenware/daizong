/* eslint-disable no-param-reassign */
import { exec } from 'child_process';
import { promisify } from 'util';
import * as assert from 'assert';

const execAsync = promisify(exec);

// `cross-spawn` causes windows echo to spit text in quotes.
function stripQuotes(s: string) {
  if (s.startsWith('"') && s.endsWith('"')) {
    return s.substring(1, s.length - 1);
  }
  return s;
}

function splitString(str: string): string[] {
  return str.split(/\r?\n/).map((s) => stripQuotes(s));
}

function checkStrings(
  a: string[],
  b: string[],
  checkPrefixes: boolean | undefined,
) {
  if (checkPrefixes) {
    if (a.length !== b.length) {
      assert.fail("Length doesn't match");
    }
    for (let i = 0; i < a.length; i++) {
      const c1 = a[i] ?? '';
      const c2 = b[i] ?? '';
      assert.ok(c1.startsWith(c2), `${c1} doesn't start with ${c2}`);
    }
  } else {
    assert.deepStrictEqual(a, b);
  }
}

export interface TOptions {
  hasError?: boolean;
  args?: string;
  checkPrefixes?: boolean;
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
      cmd += ` --config "./tests/data/${configName}.js"`;
    }
    if (opt.args) {
      cmd += ` ${opt.args}`;
    }
    if (taskName.length) {
      cmd += ` ${taskName}`;
    }
    const output = await execAsync(cmd);
    const outputString = output.stdout;
    // Split output into lines to avoid newline difference among different platforms.
    checkStrings(
      splitString(outputString.trimEnd()),
      splitString(expected),
      opt.checkPrefixes,
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    if (opt?.hasError) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const output: string = typeof err.stdout === 'string' ? err.stdout : '';
      // Split output into lines to avoid newline difference among different platforms.
      checkStrings(
        splitString(output.trimEnd()),
        splitString(expected),
        opt.checkPrefixes,
      );
    } else {
      throw err;
    }
  }
}
