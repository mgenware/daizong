#!/usr/bin/env node
import * as parseArgs from 'meow';
import * as chalk from 'chalk';
import { inspect } from 'util';
import * as pMap from 'p-map';
import spawnProcess from './spawn';
import Task from './task';
import { loadConfig, Settings, ConfigSource } from './config';
import { settingsKey } from './consts';
import getTask from './getTask';
import { runActions } from './actions';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { name: pkgName, version: pkgVersion } = require('../package.json');

let settings: Settings = {};

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
    --verbose      Print verbose information during execution
    --version, -v  Print version information
    
`,
  {
    flags: {
      config: {
        type: 'string',
        alias: 'c',
      },
      verbose: {
        type: 'boolean',
      },
      version: {
        type: 'boolean',
        alias: 'v',
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
  config: ConfigSource,
  command: string,
  inheritedEnv: Record<string, string>,
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
        innerTask = getTask(config, settings, cmdName.split(' '));
      } catch (getTaskErr) {
        isTaskNotFoundErr = true;
        throw new Error(
          `Error running command "${command}": ${getTaskErr.message}`,
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      promise = runTask(config, command, innerTask, inheritedEnv);
    } else {
      // eslint-disable-next-line no-console
      console.log(`>> ${chalk.yellow(command)}`);
      promise = spawnProcess(command, inheritedEnv);
    }
    await promise;
  } catch (err) {
    if (!ignoreError || isTaskNotFoundErr) {
      throw err;
    }
  }
}

async function runTask(
  config: ConfigSource,
  cmdDisplayName: string,
  task: Task,
  inheritedEnv: Record<string, string>,
): Promise<void> {
  const cmdValue = task.run;
  // Run the specified task.
  if (!cmdValue) {
    throw new Error(`No "run" field defined in command "${cmdDisplayName}"`);
  }

  if (cmdDisplayName) {
    // eslint-disable-next-line no-console
    console.log(`>> ${cmdDisplayName}`);
  }

  const {
    parallel,
    env: definedEnv,
    ignoreError,
    before,
    after,
    continueOnChildError,
  } = task;
  const env = {
    ...settings.defaultEnv,
    ...inheritedEnv,
    ...definedEnv,
  };
  if (before) {
    await runActions(before);
  }
  if (typeof cmdValue === 'string') {
    await runCommandString(config, cmdValue, env, !!ignoreError);
  } else if (Array.isArray(cmdValue)) {
    try {
      await pMap(
        cmdValue,
        (subCmd) => runCommandString(config, subCmd, env, false),
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
if (!inputTasks || inputTasks.length === 0) {
  throw new Error('No tasks specified');
}

(async () => {
  try {
    const config = await loadConfig(pkgName, flags.config);

    verboseLog(
      `Loaded config file at "${config?.path}"
  ${JSON.stringify(config)}
  `,
    );
    const configSource = config.source;
    if (configSource[settingsKey]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      settings = (configSource[settingsKey] as any) as Settings;
      if (settings.defaultEnv) {
        // eslint-disable-next-line no-console
        console.log(
          `Loaded default environment variables: ${inspect(
            settings.defaultEnv,
          )}`,
        );
      }
    }
    const cmd = getTask(configSource, settings, inputTasks);
    await runTask(configSource, `#${inputTasks.join(' ')}`, cmd, {});
  } catch (err) {
    handleProcessError(err.message);
  }
})();
