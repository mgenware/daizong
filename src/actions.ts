import mkdir from 'make-dir';
import del from 'del';
import chalk from 'chalk';
import pMap from 'p-map';

export interface Actions {
  mkdir?: string;
  del?: string | string[];
  mkdirDel?: string;
  parallel?: boolean;
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
        await mkdir(mkdirInput);
      } else if (prop === 'del' && delInput !== undefined) {
        // eslint-disable-next-line no-console
        console.log(`>> ${chalk.gray(`del ${JSON.stringify(delInput)}`)}`);
        await del(delInput);
      } else if (prop === 'mkdirDel' && mkdirDel) {
        // eslint-disable-next-line no-console
        console.log(`>> ${chalk.gray(`mkdirDel "${mkdirDel}"`)}`);
        await del(mkdirDel);
        await mkdir(mkdirDel);
      }
    },
    { concurrency },
  );
}
