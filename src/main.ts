#!/usr/bin/env node
import chalk from 'chalk';
import { inspect } from 'util';
import pMap from 'p-map';
import { readFile } from 'fs/promises';
import np from 'path';
import { fileURLToPath } from 'url';
import errMsg from './errMsg.js';
import exec from './exec.js';
import { Task } from './task.js';
import { loadConfig, Config } from './config.js';
import getTask from './getTask.js';
import { runActions } from './actions.js';
import { parseArgs, Command } from './argsParser.js';

function log(s: unknown) {
  // eslint-disable-next-line no-console
  console.log(s);
}

const dirname = np.dirname(fileURLToPath(import.meta.url));
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const pkg = JSON.parse(
  await readFile(np.join(dirname, '../package.json'), 'utf8'),
);

const cmd = parseArgs(process.argv.slice(2));
if (cmd.command === Command.help) {
  log(`
  Usage
    $ ${pkg.name} [options] <task-path> [task arguments]

  Options
    --config       Explicitly specify the config file, \`--config config.js\`
    --verbose      Print verbose information during execution
    --private      Allow private tasks to be called from CLI
    --version, -v  Print version information
    
  Examples
    $ ${pkg.name} --verbose test-browser --script-arg1 --script-arg2
`);
  process.exit(0);
}

if (cmd.command === Command.version) {
  log(pkg.version);
  process.exit(0);
}

function verboseLog(s: unknown) {
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (cmd.verbose && s) {
    log(`[DEBUG] ${s}`);
  }
}

function handleProcessError(msg: string, error: Error) {
  log(chalk.red(msg));
  verboseLog(error.stack);
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
      promise = exec(command, args, inheritedEnv);
    }
    await promise;
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!ignoreError || isTaskNotFoundErr) {
      throw err;
    }
  }
}

async function runTask(
  config: Config,
  cmdDisplayName: string,
  task: Task,
  // If this task has multiple sub-tasks, arguments only apply to first sub-task that
  // is not a referenced task.
  args: string[],
  // Env from parent tasks when called by another tasks.
  parentEnv: Record<string, string | undefined>,
): Promise<void> {
  const runValue = task.run;
  // Run the specified task.
  if (runValue === undefined) {
    throw new Error(`No \`run\` field found in task "${cmdDisplayName}"`);
  }

  if (cmdDisplayName) {
    log(`>> ${cmdDisplayName}`);
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
      const subTasksContext = runValue.map((t) => ({
        run: t,
        args: [] as string[],
      }));
      // Determine if a sub-task should have args.
      if (args.length) {
        for (const ctx of subTasksContext) {
          if (!ctx.run.startsWith('#')) {
            ctx.args = args;
            break;
          }
        }
      }

      await pMap(
        subTasksContext,
        (st) => runCommandString(config, st.run, st.args, env, false),
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

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  try {
    const config = await loadConfig(cmd.configFile);
    const { settings } = config;

    verboseLog(
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
    const taskObj = getTask(config, cmd.taskPath, cmd.private || false);
    await runTask(
      config,
      `#${cmd.taskPath.join('-')}`,
      taskObj,
      cmd.taskArgs,
      {},
    );
  } catch (err) {
    handleProcessError(errMsg(err), err as Error);
  }
})();
