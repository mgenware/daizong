import * as mkdir from 'make-dir';
import * as del from 'del';
import * as chalk from 'chalk';

export interface Actions {
  mkdir?: string;
  del?: string | string[];
}

export async function runActions(actions: Actions): Promise<void> {
  if (!actions) {
    return;
  }
  const { mkdir: mkdirInput, del: delInput } = actions;
  if (mkdirInput) {
    // eslint-disable-next-line no-console
    console.log(`>> ${chalk.gray(`mkdir "${mkdirInput}"`)}`);
    await mkdir(mkdirInput);
  }
  if (delInput) {
    // eslint-disable-next-line no-console
    console.log(`>> ${chalk.gray(`del ${JSON.stringify(delInput)}`)}`);
    await del(delInput);
  }
}
