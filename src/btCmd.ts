import { deleteAsync } from 'del';
import chalk from 'chalk';
import pMap from 'p-map';
import * as np from 'path';
import { mkdir as nodeMkdir } from 'fs/promises';

export interface BTCommands {
  mkdir?: string | string[];
  del?: string | string[];
  mkdirDel?: string | string[];
  parallel?: boolean;
}

function mkdir(path: string) {
  return nodeMkdir(path, { recursive: true });
}

function stringToList(input: string | string[]): string[] {
  if (typeof input === 'string') {
    return [input];
  }
  return input;
}

function resolvePath(path: string, workingDir: string | undefined) {
  if (workingDir) {
    return np.join(workingDir, path);
  }
  return path;
}

export async function runBTCommands(
  cmds: BTCommands,
  workingDir: string | undefined,
) {
  const { mkdir: mkdirInput, del: delInput, parallel, mkdirDel } = cmds;
  const concurrency = parallel ? undefined : 1;

  // Actions are executed in insertion order if `parallel` is false.
  await pMap(
    Object.keys(cmds),
    async (prop: string) => {
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      if (prop === 'mkdir' && mkdirInput) {
        // eslint-disable-next-line no-console
        console.log(`>> ${chalk.gray(`mkdir "${mkdirInput}"`)}`);
        await Promise.all(
          stringToList(mkdirInput).map((s) =>
            mkdir(resolvePath(s, workingDir)),
          ),
        );
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      } else if (prop === 'del' && delInput) {
        // eslint-disable-next-line no-console
        console.log(`>> ${chalk.gray(`del ${JSON.stringify(delInput)}`)}`);
        const pList = typeof delInput === 'string' ? [delInput] : delInput;
        await deleteAsync(
          pList.map((s) => resolvePath(s, workingDir)),
          { force: true },
        );
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      } else if (prop === 'mkdirDel' && mkdirDel) {
        // eslint-disable-next-line no-console
        console.log(`>> ${chalk.gray(`mkdirDel "${mkdirDel}"`)}`);
        await Promise.all(
          stringToList(mkdirDel).map(async (s) => {
            const p = resolvePath(s, workingDir);
            await deleteAsync(p);
            await mkdir(p);
          }),
        );
      }
    },
    { concurrency },
  );
}
