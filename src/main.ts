#!/usr/bin/env node
import chalk from 'chalk';
import { inspect } from 'util';
import pMap from 'p-map';
import { readFile } from 'fs/promises';
import nodepath from 'path';
import { fileURLToPath } from 'url';
import errMsg from './errMsg.js';
import spawnProcess from './spawn.js';
import { Task } from './task.js';
import { loadConfig, Config } from './config.js';
import getTask from './getTask.js';
import { runActions } from './actions.js';
import { parseArgs, Command } from './argsParser.js';

function handleProcessError(msg: string) {
  // eslint-disable-next-line no-console
  console.log(chalk.red(msg));
  process.exit(1);
}

process.on('uncaughtException', (err) => {
  handleProcessError(err.message);
});

const dirname = nodepath.dirname(fileURLToPath(import.meta.url));
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const pkg = JSON.parse(
  await readFile(nodepath.join(dirname, '../package.json'), 'utf8'),
);

const cmd = parseArgs(process.argv.slice(2));
if (cmd.command === Command.help) {
  // eslint-disable-next-line no-console
  console.log(`
  Usage
    $ ${pkg.name} <task>

  Options
    --config       Explicitly specify the config file, --config=./config.js
    --verbose      Print verbose information during execution
    --private      Allow private tasks to be called from CLI
    --version, -v  Print version information
    
`);
  process.exit(0);
}

if (cmd.command === Command.version) {
  // eslint-disable-next-line no-console
  console.log(pkg.version);
  process.exit(0);
}

function verboseLog(s: string) {
  if (cmd.verbose) {
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
      let matchedArgs: string[] = [];
      let unmatchedArgs: string[] = [];
      try {
        [innerTask, matchedArgs, unmatchedArgs] = getTask(
          config,
          cmdName.split(' '),
          true,
        );
        if (unmatchedArgs.length) {
          // eslint-disable-next-line no-param-reassign
          args += ` ${unmatchedArgs.join(' ')}`;
        }
      } catch (getTaskErr) {
        isTaskNotFoundErr = true;
        throw new Error(
          `Error running command "${command}": ${errMsg(
            getTaskErr,
          )} [task "${matchedArgs.join(' ')}"]`,
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
  const runValue = task.run;
  // Run the specified task.
  if (runValue === undefined) {
    throw new Error(`No \`run\` field found in task "${cmdDisplayName}"`);
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
  if (typeof runValue === 'string') {
    await runCommandString(config, runValue, args, env, !!ignoreError);
  } else if (Array.isArray(runValue)) {
    try {
      await pMap(
        runValue,
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
    // `runValue` is an object of actions.
    await runActions(runValue);
  }

  if (after) {
    await runActions(after);
  }
}

const inputArgs = cmd.args;
if (!inputArgs?.length) {
  throw new Error('No tasks specified');
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  try {
    const config = await loadConfig(cmd.configFile);
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
    const [taskObj, matchedArgs, unmatchedArgs] = getTask(
      config,
      inputArgs,
      cmd.private || false,
    );
    await runTask(
      config,
      `#${matchedArgs.join(' ')}`,
      taskObj,
      unmatchedArgs.join(' '),
      {},
    );
  } catch (err) {
    handleProcessError(errMsg(err));
  }
})();
