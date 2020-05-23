#!/usr/bin/env node
import { cosmiconfig } from 'cosmiconfig';
import * as parseArgs from 'meow';
import spawn from './spawn';
import * as chalk from 'chalk';
import Task from './task';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkgName = require('../package.json').name;
const explorer = cosmiconfig(pkgName);

const cli = parseArgs(
  `
	Usage
	  $ ${pkgName} <task>

	Options
    --config, -c  Explicitly specify the config file
    
`,
  {
    flags: {
      config: {
        type: 'string',
        alias: 'c',
      },
    },
  },
);

const taskInput = cli.input?.[0];
if (!taskInput) {
  throw new Error('No task given');
}

(async () => {
  const res = await (cli.flags.config
    ? explorer.load(cli.flags.config)
    : explorer.search());
  if (res?.isEmpty) {
    throw new Error(`No config file found at "${res.filepath}"`);
  }
  const config = res?.config || {};
  const taskNames = Object.keys(config);
  const task = config[taskInput] as Task;
  if (!task) {
    throw new Error(
      `Task "${taskInput}" not defined. Valid tasks are ${taskNames.join(
        ', ',
      )}`,
    );
  }

  // Run the specified task.
  const cmds = task.run;
  if (!cmds) {
    throw new Error(`No "run" field defined in task "${taskInput}"`);
  }
  // eslint-disable-next-line no-console
  console.log('>> ' + chalk.yellow(cmds.join(' ')));
  await spawn(
    cmds,
    (data) => {
      // eslint-disable-next-line no-console
      console.log(data.toString());
    },
    (data) => {
      // eslint-disable-next-line no-console
      console.log(chalk.red(data.toString()));
    },
  );
})();
