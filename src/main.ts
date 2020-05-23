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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function run(config: any, taskName: string) {
  const task = config[taskName] as Task | undefined;
  if (!task) {
    throw new Error(
      `Task "${taskInput}" not defined. Valid tasks are ${Object.keys(
        config,
      ).join(', ')}`,
    );
  }

  // Run the specified task.
  if (!task.run) {
    throw new Error(`No "run" field defined in task "${taskInput}"`);
  }

  const cmds = typeof task.run === 'string' ? [task.run] : task.run;

  if (cmds.length === 0) {
    throw new Error(`The value of "run" field is empty`);
  }

  let cmdsToRun: string[][];
  if (typeof cmds[0] === 'string') {
    cmdsToRun = [cmds] as string[][];
  } else {
    cmdsToRun = cmds as string[][];
  }

  for (const cmds of cmdsToRun) {
    const cmdName = cmds[0];
    if (!cmdName) {
      throw new Error(
        `Unexpected empty command name at "${JSON.stringify(cmds)}"`,
      );
    }

    // Check if this command is a task.
    if (cmdName.startsWith('#')) {
      const targetTaskName = cmdName.substr(1);
      await run(config, targetTaskName);
      continue;
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
  }
}

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
  await run(config, taskInput);
})();
