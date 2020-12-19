#!/usr/bin/env node
import parseArgs from 'meow';
import chalk from 'chalk';
import { inspect } from 'util';
import pMap from 'p-map';
import spawnProcess from './spawn';
import { Task } from './task';
import { loadConfig, Config } from './config';
import getTask from './getTask';
import { runActions } from './actions';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { name: pkgName, version: pkgVersion } = require('../package.json');

function handleProcessError(msg: string) {
  // eslint-disable-next-line no-console
  console.log(chalk.red(msg));
  process.exit(1);
}

process.on('uncaughtException', (err) => {
  handleProcessError(err.message);
});

const cli = parseArgs(
  `
  Usage
    $ ${pkgName} <task>

  Options
    --config, -c   Explicitly specify the config file
    --args         Arguments passed to the command of the target task
    --verbose      Print verbose information during execution
    --private      Allow private tasks to be called from CLI
    --version, -v  Print version information
    
`,
  {
    flags: {
      config: {
        type: 'string',
        alias: 'c',
      },
      args: {
        type: 'string',
      },
      verbose: {
        type: 'boolean',
      },
      version: {
        type: 'boolean',
        alias: 'v',
      },
      private: {
        type: 'boolean',
      },
    },
  },
);

const { flags } = cli;
if (flags.version) {
  // eslint-disable-next-line no-console
  console.log(pkgVersion);
  process.exit();
}

function verboseLog(s: string) {
  if (flags.verbose) {
    // eslint-disable-next-line no-console
    console.log(`🚙 ${s}`);
  }
}

async function runCommandString(
  config: Config,
  command: string,
  args: string,
  inheritedEnv: Record<string, string | undefined>,
  ignoreError: boolean,
): Promise<void> {
  let isTaskNotFoundErr = false;
  try {
    // Check if this command is calling another command.
    let promise: Promise<void>;
    if (command.startsWith('#')) {
      const cmdName = command.substr(1);
      if (!cmdName) {
        throw new Error(`"${command}" is not a valid task name`);
      }
      let innerTask: Task;
      try {
        innerTask = getTask(config, cmdName.split(' '), true);
      } catch (getTaskErr) {
        isTaskNotFoundErr = true;
        throw new Error(
          `Error running command "${command}": ${getTaskErr.message}`,
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      promise = runTask(config, command, innerTask, args, inheritedEnv);
    } else {
      // eslint-disable-next-line no-console
      console.log(`>> ${chalk.yellow(command)}`);
      promise = spawnProcess(command, args, inheritedEnv);
    }
    await promise;
  } catch (err) {
    if (!ignoreError || isTaskNotFoundErr) {
      throw err;
    }
  }
}

async function runTask(
  config: Config,
  cmdDisplayName: string,
  task: Task,
  args: string,
  // Env from parent tasks when called by another tasks.
  parentEnv: Record<string, string | undefined>,
): Promise<void> {
  const cmdValue = task.run;
  // Run the specified task.
  if (cmdValue === undefined) {
    throw new Error(`No "run" field defined in command "${cmdDisplayName}"`);
  }

  if (cmdDisplayName) {
    // eslint-disable-next-line no-console
    console.log(`>> ${cmdDisplayName}`);
  }

  const { settings } = config;
  const {
    parallel,
    env: taskEnv,
    ignoreError,
    before,
    after,
    continueOnChildError,
    envGroups,
  } = task;
  let envGroupNames: string[] = [];
  if (envGroups !== undefined) {
    envGroupNames = typeof envGroups === 'string' ? [envGroups] : envGroups;
  }
  const groupEnv: Record<string, string> = {};
  for (const groupName of envGroupNames) {
    const vars = settings.envGroups[groupName];
    if (vars === undefined) {
      throw new Error(`Env group "${groupName}" is not defined`);
    }
    Object.assign(groupEnv, vars);
  }
  const env = {
    ...settings.defaultEnv,
    ...parentEnv,
    ...groupEnv,
    ...taskEnv,
  };
  if (before) {
    await runActions(before);
  }
  if (typeof cmdValue === 'string') {
    await runCommandString(config, cmdValue, args, env, !!ignoreError);
  } else if (Array.isArray(cmdValue)) {
    try {
      await pMap(
        cmdValue,
        (subCmd) => runCommandString(config, subCmd, args, env, false),
        {
          concurrency: parallel ? undefined : 1,
          stopOnError: !continueOnChildError,
        },
      );
    } catch (err) {
      if (!ignoreError) {
        throw err;
      }
    }
  } else {
    // `cmdValue` is an object of actions.
    await runActions(cmdValue);
  }

  if (after) {
    await runActions(after);
  }
}

const inputTasks = cli.input;
if (inputTasks.length === 0) {
  throw new Error('No tasks specified');
}

(async () => {
  try {
    const config = await loadConfig(pkgName, flags.config);
    const { settings } = config;

    verboseLog(
      `Loaded config file at "${config?.path}"
  ${JSON.stringify(config)}
  `,
    );
    if (settings.defaultEnv) {
      // eslint-disable-next-line no-console
      console.log(
        `Loaded default environment variables: ${inspect(settings.defaultEnv, {
          compact: false,
          sorted: true,
        })}`,
      );
    }
    const taskObj = getTask(config, inputTasks, flags.private || false);
    await runTask(
      config,
      `#${inputTasks.join(' ')}`,
      taskObj,
      flags.args || '',
      {},
    );
  } catch (err) {
    handleProcessError(err.message);
  }
})();
