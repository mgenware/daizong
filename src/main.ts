#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-use-before-define */
import chalk from 'chalk';
import { inspect } from 'util';
import pMap from 'p-map';
import { readFile } from 'fs/promises';
import * as np from 'path';
import { fileURLToPath } from 'url';
import spawn from './spawn.js';
import { Task } from './task.js';
import { loadConfig, Config } from './config.js';
import getTask from './getTask.js';
import { BTCommands, runBTCommands } from './btCmd.js';
import { parseArgs, Command } from './argsParser.js';
import { envPreset } from './envPreset.js';
import * as lib from './lib.js';

interface Context {
  config: Config;
  // Env from parent tasks when called by another tasks.
  inheritedEnv: Record<string, string>;
}

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

async function runString(
  ctx: Context,
  value: string,
  args: string[] | undefined,
  workingDir: string | undefined,
): Promise<void> {
  if (value.startsWith('#')) {
    return runTaskByName(ctx, value, workingDir);
  }

  const argsText = args ? ` ${chalk.cyan(lib.getArgsDisplayString(args))}` : '';
  const workingDirText = workingDir ? ` [wd: ${workingDir}]` : '';
  log(`>> ${chalk.yellow(value)}${argsText}${workingDirText}`);
  return spawn(value, args ?? [], ctx.inheritedEnv, verboseLog, workingDir);
}

async function runTask(
  ctx: Context,
  task: Task,
  args: string[] | undefined, // Only applicable to [run] field!
  taskName: string | undefined,
  // The working dir set by the parent task.
  // Can be overridden by the current task's working dir.
  workingDir: string | undefined,
) {
  const runValue = task.run;
  if (task.workingDir) {
    // eslint-disable-next-line prefer-destructuring, no-param-reassign
    workingDir = task.workingDir;
  }
  if (runValue === undefined) {
    throw new Error(`No \`run\` field found in task "${JSON.stringify(task)}"`);
  }

  const { settings } = ctx.config;
  const { env: taskEnv, envGroups, before, after } = task;
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
    ...ctx.inheritedEnv,
    ...groupEnv,
    ...taskEnv,
  } as Record<string, string>;
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  const hasBeforeOrAfter = !!(before || after);
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (before) {
    log(`>> #${taskName} [before]`);
    await runUnknown(ctx, before, null, undefined, workingDir);
  }

  if (hasBeforeOrAfter) {
    log(`>> #${taskName} [run]`);
  }
  try {
    await runUnknown(
      { ...ctx, inheritedEnv: env },
      runValue,
      task,
      args,
      workingDir,
    );
  } catch (err) {
    if (!task.ignoreError) {
      throw err;
    }
  }

  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (after) {
    log(`>> #${taskName} [after]`);
    await runUnknown(ctx, after, null, undefined, workingDir);
  }
}

async function runTaskByName(
  ctx: Context,
  nameWithPrefix: string,
  workingDir: string | undefined,
) {
  const name = nameWithPrefix.substring(1);
  if (!name) {
    throw new Error('"#" is not a valid task name');
  }
  const task = getTask(ctx.config, name, true);
  log(`>> ${nameWithPrefix}`);
  return runTask(ctx, task, undefined, name, workingDir);
}

// Runs the given value of a `run` field. It could be the following cases:
// - A string of task name, `#another_task`
// - A command string, `echo hi`
// - A object indicating a built-in command, `{ del: ['a', 'b'] }`
// - An array representing a series of child commands. It could be executed
//     sequentially or in parallel depending on the `parallel` field.
// `task`: if available, it is being called by another task. Otherwise, it's called
// within another run value (nested in a task run value).
async function runUnknown(
  ctx: Context,
  value: unknown,
  task: Task | null,
  args: string[] | undefined, // Only applicable to string commands!
  workingDir: string | undefined,
) {
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (!value) {
    throw new Error(`Empty run field ${JSON.stringify(value)}`);
  }
  if (typeof value === 'string') {
    return runString(ctx, value, args, workingDir);
  }
  if (Array.isArray(value)) {
    await pMap(
      value,
      (childVal) => runUnknown(ctx, childVal, null, undefined, workingDir),
      {
        concurrency: task?.parallel ? undefined : 1,
        stopOnError:
          task?.continueOnChildError !== undefined
            ? !task.continueOnChildError
            : true,
      },
    );
    return Promise.resolve();
  }
  if (typeof value === 'object') {
    return runBTCommands(value as BTCommands, workingDir);
  }
  throw new Error(`Invalid run field ${JSON.stringify(value)}`);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  try {
    verboseLog?.(`CWD: ${process.cwd()}`);
    verboseLog?.(`Loading config "${cmd.configFile}"`);

    const config = await loadConfig(cmd.configFile);
    const { settings } = config;

    verboseLog?.(
      `Loaded config file at "${np.resolve(config.path)}"
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

    const task = getTask(config, cmd.taskName, cmd.private ?? false);
    log(`>> #${cmd.taskName}`);
    const ctx: Context = {
      config,
      inheritedEnv: {},
    };
    await runTask(
      ctx,
      task,
      cmd.taskArgs.length ? cmd.taskArgs : undefined,
      cmd.taskName,
      undefined,
    );
  } catch (err) {
    processError(err);
  }
})();
