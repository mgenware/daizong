#!/usr/bin/env node
import chalk from 'chalk';
import { inspect } from 'util';
import pMap from 'p-map';
import { readFile } from 'fs/promises';
import np from 'path';
import { fileURLToPath } from 'url';
import errMsg from './errMsg.js';
import spawn from './spawn.js';
import { Task } from './task.js';
import { loadConfig, Config } from './config.js';
import getTask from './getTask.js';
import { runBTCommands } from './btCmd.js';
import { parseArgs, Command } from './argsParser.js';
import { envPreset } from './envPreset.js';

function log(s: unknown) {
  // eslint-disable-next-line no-console
  console.log(s);
}

function logError(s: unknown) {
  return log(chalk.red(s));
}

const cliArgs = process.argv.slice(2);
if (!cliArgs.length) {
  logError('Missing task path.\nTry `daizong --help` for help.');
  process.exit(1);
}
const cmd = parseArgs(cliArgs);
if (cmd.error) {
  logError(cmd.error);
  process.exit(1);
}
if (cmd.command === Command.help) {
  log(`
  Usage
    $ daizong [options] <task-path> [task arguments]

  Options
    --config       Explicitly specify the config file, \`--config config.js\`
    --verbose      Print verbose information during execution
    --private      Allow private tasks to be called from CLI
    --version, -v  Print version information
    
  Examples
    $ daizong --verbose test-browser --script-arg1 --script-arg2
`);
  process.exit(0);
}

if (cmd.command === Command.version) {
  const dirname = np.dirname(fileURLToPath(import.meta.url));
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const pkg = JSON.parse(
    await readFile(np.join(dirname, '../package.json'), 'utf8'),
  );
  log(pkg.version);
  process.exit(0);
}

const verboseLog: ((s: unknown) => void) | null = cmd.verbose
  ? (s) => log(`[DEBUG] ${s}`)
  : null;

function processError(err: unknown) {
  if (err instanceof Error) {
    logError(err.message);
    verboseLog?.(err.stack);
  } else {
    logError(`${err}`);
  }
  process.exit(1);
}

function getArgsDisplayString(args: string[]) {
  return args
    .map((s) => {
      // If current argument has spaces, surround it with quotes.
      if (s.includes(' ')) {
        return `"${s}"`;
      }
      return s;
    })
    .join(' ');
}

async function runCommandString(
  config: Config,
  command: string,
  args: string[],
  inheritedEnv: Record<string, string | undefined>,
  ignoreError: boolean,
): Promise<void> {
  let isTaskNotFoundErr = false;
  try {
    // Check if this command is calling another command.
    let promise: Promise<void>;
    if (command.startsWith('#')) {
      const cmdName = command.substring(1);
      if (!cmdName) {
        throw new Error(`"${command}" is not a valid task name`);
      }
      let innerTask: Task;
      try {
        innerTask = getTask(config, cmdName.split('-'), true);
      } catch (getTaskErr) {
        isTaskNotFoundErr = true;
        throw new Error(
          `Error running command "${command}": ${errMsg(getTaskErr)}`,
        );
      }
      // NOTE: user specified arguments are not passed to the referenced task.
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      promise = runTask(config, command, innerTask, [], inheritedEnv);
    } else {
      const argsText = args.length
        ? ` ${chalk.cyan(getArgsDisplayString(args))}`
        : '';
      log(`>> ${chalk.yellow(command)}${argsText}`);
      promise = spawn(command, args, inheritedEnv, verboseLog);
    }
    await promise;
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!ignoreError || isTaskNotFoundErr) {
      throw err;
    }
  }
}

// Makes sure `before` or `after` only accepts `#<task_name>`.
function checkBeforeOrAfterValue(value: string) {
  if (!value.startsWith('#')) {
    throw new Error(
      `\`before\` or \`after\` only accepts other task names. Got "${value}"`,
    );
  }
}

async function runTask(
  config: Config,
  displayName: string,
  task: Task,
  // If this task has multiple sub-tasks, arguments only apply to first sub-task that
  // is not a referenced task.
  args: string[],
  // Env from parent tasks when called by another tasks.
  parentEnv: Record<string, string | undefined>,
) {
  const runValue = task.run;
  // Run the specified task.
  if (runValue === undefined) {
    throw new Error(`No \`run\` field found in task "${displayName}"`);
  }

  if (displayName) {
    log(`>> ${displayName}`);
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
  let envGroupNames: unknown[] = [];
  if (envGroups !== undefined) {
    envGroupNames = typeof envGroups === 'string' ? [envGroups] : envGroups;
  }
  const groupEnv: Record<string, string> = {};
  for (const groupName of envGroupNames) {
    if (typeof groupName !== 'string') {
      throw new Error(
        `Env group names must be strings, got ${JSON.stringify(groupName)}.`,
      );
    }
    if (groupName) {
      let vars = settings.envGroups[groupName];
      if (!vars) {
        const preset = envPreset(groupName);
        if (preset) {
          vars = preset;
        }
        if (!vars) {
          throw new Error(`Env group "${groupName}" is not defined`);
        }
      }
      Object.assign(groupEnv, vars);
    }
  }
  const env = {
    ...settings.defaultEnv,
    ...parentEnv,
    ...groupEnv,
    ...taskEnv,
  };
  if (before) {
    checkBeforeOrAfterValue(before);
    await runTask(
      config,
      `${displayName} (before)`,
      getTask(config, [before.substring(1)], true),
      args,
      parentEnv,
    );
  }
  if (typeof runValue === 'string') {
    await runCommandString(config, runValue, args, env, !!ignoreError);
  } else if (Array.isArray(runValue)) {
    try {
      const subTasksContext = runValue.map((t) => ({
        run: t,
        args: [] as string[],
      }));
      // Determine if a sub-task should have args.
      if (args.length) {
        for (const ctx of subTasksContext) {
          if (typeof ctx.run !== 'string' || !ctx.run.startsWith('#')) {
            ctx.args = args;
            break;
          }
        }
      }

      await pMap(
        subTasksContext,
        (st) => {
          if (typeof st.run === 'string') {
            return runCommandString(config, st.run, st.args, env, false);
          }
          return runBTCommands(st.run);
        },
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
    // `runValue` is an object of BT commands.
    await runBTCommands(runValue);
  }

  if (after) {
    checkBeforeOrAfterValue(after);
    await runTask(
      config,
      `${displayName} (after)`,
      getTask(config, [after.substring(1)], true),
      args,
      parentEnv,
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  try {
    const config = await loadConfig(cmd.configFile);
    const { settings } = config;

    verboseLog?.(
      `Loaded config file at "${config.path}"
  ${JSON.stringify(config)}
  `,
    );
    if (settings.defaultEnv) {
      log(
        `Loaded default environment variables: ${inspect(settings.defaultEnv, {
          compact: false,
          sorted: true,
        })}`,
      );
    }
    const startingTask = getTask(config, cmd.taskPath, cmd.private || false);
    await runTask(
      config,
      `#${cmd.taskPath.join('-')}`,
      startingTask,
      cmd.taskArgs,
      {},
    );
  } catch (err) {
    processError(err);
  }
})();
