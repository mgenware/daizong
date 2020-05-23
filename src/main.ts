#!/usr/bin/env node
import { cosmiconfig } from 'cosmiconfig';
import * as parseArgs from 'meow';
import * as chalk from 'chalk';
import spawn from './spawn';
import Task, { CmdItemType } from './task';

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
async function run(config: any, taskName: string): Promise<void> {
  const task = config[taskName] as Task | undefined;
  if (!task) {
    throw new Error(
      `Task "${taskName}" not defined. Valid tasks are ${Object.keys(
        config,
      ).join(', ')}`,
    );
  }

  // Run the specified task.
  if (!task.cmd) {
    throw new Error(`No "cmd" field defined in task "${taskName}"`);
  }

  const cmdFieldValue = typeof task.cmd === 'string' ? [task.cmd] : task.cmd;
  const isParallel = task.parallel;
  const parallelPromises: Promise<void>[] = [];
  if (cmdFieldValue.length === 0) {
    throw new Error('The value of "cmd" field is empty');
  }

  let cmdsToRun: CmdItemType[];
  if (typeof cmdFieldValue[0] === 'string') {
    // Single command to run, e.g. ['echo', 'a'].
    cmdsToRun = [cmdFieldValue as string[]];
  } else {
    // Multiple commands to run, e.g. [ ['echo', 'a'], ['echo', 'b'] ].
    cmdsToRun = cmdFieldValue;
  }

  for (const rawCmdValue of cmdsToRun) {
    const cmdList =
      typeof rawCmdValue === 'string' ? [rawCmdValue] : rawCmdValue;
    const cmdString = cmdList.join(' ');
    const cmdName = cmdList[0];
    if (!cmdName) {
      throw new Error(`Unexpected empty command name at "${cmdString}"`);
    }

    // Check if this command is a task.
    let promise: Promise<void>;
    if (cmdName.startsWith('#')) {
      const targetTaskName = cmdName.substr(1);
      if (!targetTaskName) {
        throw new Error(`"${cmdName}" is not a valid task name`);
      }
      promise = run(config, targetTaskName);
    } else {
      // eslint-disable-next-line no-console
      console.log(`>> ${chalk.yellow(cmdString)}`);
      promise = spawn(
        cmdList,
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
    if (isParallel) {
      parallelPromises.push(promise);
    } else {
      // eslint-disable-next-line no-await-in-loop
      await promise;
    }
  }
  if (isParallel) {
    await Promise.all(parallelPromises);
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
