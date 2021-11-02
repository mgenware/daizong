import del from 'del';
import colors from 'picocolors';
import pMap from 'p-map';
import { mkdir as nodeMkdir } from 'fs/promises';

export interface Actions {
  mkdir?: string;
  del?: string | string[];
  mkdirDel?: string;
  parallel?: boolean;
}

function mkdir(path: string) {
  return nodeMkdir(path, { recursive: true });
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
        console.log(`>> ${colors.gray(`mkdir "${mkdirInput}"`)}`);
        await mkdir(mkdirInput);
      } else if (prop === 'del' && delInput !== undefined) {
        // eslint-disable-next-line no-console
        console.log(`>> ${colors.gray(`del ${JSON.stringify(delInput)}`)}`);
        await del(delInput, { force: true });
      } else if (prop === 'mkdirDel' && mkdirDel) {
        // eslint-disable-next-line no-console
        console.log(`>> ${colors.gray(`mkdirDel "${mkdirDel}"`)}`);
        await del(mkdirDel);
        await mkdir(mkdirDel);
      }
    },
    { concurrency },
  );
}
