import { deleteAsync } from 'del';
import chalk from 'chalk';
import pMap from 'p-map';
import { mkdir as nodeMkdir } from 'fs/promises';

export interface Actions {
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

export async function runActions(actions: Actions): Promise<void> {
  const { mkdir: mkdirInput, del: delInput, parallel, mkdirDel } = actions;
  const concurrency = parallel ? undefined : 1;

  // Actions are executed in insertion order if `parallel` is false.
  await pMap(
    Object.keys(actions),
    async (prop: string) => {
      if (prop === 'mkdir' && mkdirInput) {
        // eslint-disable-next-line no-console
        console.log(`>> ${chalk.gray(`mkdir "${mkdirInput}"`)}`);
        await Promise.all(stringToList(mkdirInput).map((s) => mkdir(s)));
      } else if (prop === 'del' && delInput) {
        // eslint-disable-next-line no-console
        console.log(`>> ${chalk.gray(`del ${JSON.stringify(delInput)}`)}`);
        await deleteAsync(delInput, { force: true });
      } else if (prop === 'mkdirDel' && mkdirDel) {
        // eslint-disable-next-line no-console
        console.log(`>> ${chalk.gray(`mkdirDel "${mkdirDel}"`)}`);
        await Promise.all(
          stringToList(mkdirDel).map(async (s) => {
            await deleteAsync(s);
            await mkdir(s);
          }),
        );
      }
    },
    { concurrency },
  );
}
