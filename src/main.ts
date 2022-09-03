#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-use-before-define */
import chalk from 'chalk';
import { inspect } from 'util';
import pMap from 'p-map';
import { readFile } from 'fs/promises';
import np from 'path';
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
  args?: string[],
): Promise<void> {
  if (value.startsWith('#')) {
    return runTaskByName(ctx, value);
  }

  const argsText = args ? ` ${chalk.cyan(lib.getArgsDisplayString(args))}` : '';
  log(`>> ${chalk.yellow(value)}${argsText}`);
  await spawn(value, args ?? [], ctx.inheritedEnv, verboseLog);
}

async function runTask(ctx: Context, task: Task, args?: string[]) {
  const runValue = task.run;
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
  const hasBeforeOrAfter = before || after;
  if (before) {
    log('>> [before]');
    await runUnknown(ctx, before, null);
  }

  if (hasBeforeOrAfter) {
    log('>> [main]');
  }
  try {
    await runUnknown({ ...ctx, inheritedEnv: env }, runValue, task, args);
  } catch (err) {
    if (!task.ignoreError) {
      throw err;
    }
  }

  if (after) {
    log('>> [after]');
    await runUnknown(ctx, after, null);
  }
}

async function runTaskByName(ctx: Context, nameWithPrefix: string) {
  const name = nameWithPrefix.substring(1);
  if (!name) {
    throw new Error('"#" is not a valid task name');
  }
  const task = getTask(ctx.config, name, false);
  log(`>> ${nameWithPrefix}`);
  return runTask(ctx, task);
}

// Runs the given value of a `run` field. It could be the following cases:
// - A string of task name, `#another_task`
// - A command string, `echo hi`
// - A object indicating a built-in command, `{ del: ['a', 'b'] }`
// - An array representing a series of child commands. It could be executed
//     sequentially or in parallel depending on the `parallel` field.
// `task`: if available, this is called by a task. Otherwise, it's called
// within another run value (nested in a task run value).
async function runUnknown(
  ctx: Context,
  value: unknown,
  task: Task | null,
  args?: string[],
) {
  if (!value) {
    throw new Error(`Empty run field ${JSON.stringify(value)}`);
  }
  if (typeof value === 'string') {
    return runString(ctx, value, args);
  }
  if (Array.isArray(value)) {
    await pMap(value, (childVal) => runUnknown(ctx, childVal, null), {
      concurrency: task?.parallel ? undefined : 1,
      stopOnError:
        task?.continueOnChildError !== undefined
          ? !task.continueOnChildError
          : true,
    });
    return Promise.resolve();
  }
  if (typeof value === 'object') {
    return runBTCommands(value as BTCommands);
  }
  throw new Error(`Invalid run field ${JSON.stringify(value)}`);
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

    const task = getTask(config, cmd.taskName, cmd.private ?? false);
    log(`>> #${cmd.taskName}`);
    const ctx: Context = {
      config,
      inheritedEnv: {},
    };
    await runTask(ctx, task, cmd.taskArgs.length ? cmd.taskArgs : undefined);
  } catch (err) {
    processError(err);
  }
})();
