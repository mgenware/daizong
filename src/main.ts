#!/usr/bin/env node
import * as parseArgs from 'meow';
import * as chalk from 'chalk';
import { inspect } from 'util';
import spawnProcess from './spawn';
import Cmd from './cmd';
import { loadConfig, Settings, ConfigSource } from './config';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { name: pkgName, version: pkgVersion } = require('../package.json');

const settingsKey = '_';
let settings: Settings = {};

function handleProcessError(msg: string) {
  console.error(chalk.red(msg));
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

function getCmdFromConfig(
  configSource: ConfigSource,
  key: string,
  allowPrivate: boolean,
): Cmd | undefined {
  if (key === settingsKey) {
    throw new Error(
      `You cannot use "${settingsKey}" as a command name, "${settingsKey}" is a preserved name for daizong configuration`,
    );
  }
  const result = configSource[key];
  if (!result && allowPrivate && settings.privateTasks) {
    return settings.privateTasks[key];
  }
  return result;
}

async function runCommandString(
  config: ConfigSource,
  command: string,
  inheritedEnv: Record<string, string>,
  ignoreError: boolean,
): Promise<void> {
  try {
    // Check if this command is calling another command.
    let promise: Promise<void>;
    if (command.startsWith('#')) {
      const cmdName = command.substr(1);
      if (!cmdName) {
        throw new Error(`"${command}" is not a valid task name`);
      }
      const childCmd = getCmdFromConfig(config, cmdName, true);
      if (!childCmd) {
        throw new Error(`Command not found "${cmdName}"`);
      }
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      promise = runCommand(config, command, childCmd, inheritedEnv);
    } else {
      // eslint-disable-next-line no-console
      console.log(`>> ${chalk.yellow(command)}`);
      promise = spawnProcess(command, inheritedEnv);
    }
    await promise;
  } catch (err) {
    if (!ignoreError) {
      throw err;
    }
  }
}

async function runCommand(
  config: ConfigSource,
  cmdDisplayName: string,
  command: Cmd,
  inheritedEnv: Record<string, string>,
): Promise<void> {
  const cmdValue = command.run;
  // Run the specified task.
  if (!cmdValue) {
    throw new Error(`No "run" field defined in command "${cmdDisplayName}"`);
  }

  if (cmdDisplayName) {
    // eslint-disable-next-line no-console
    console.log(`>> ${cmdDisplayName}`);
  }

  const { parallel, env: definedEnv, ignoreError } = command;
  const env = {
    ...settings.defaultEnv,
    ...inheritedEnv,
    ...definedEnv,
  };
  if (typeof cmdValue === 'string') {
    await runCommandString(config, cmdValue, env, !!ignoreError);
  } else {
    try {
      const parallelPromises: Promise<void>[] = [];

      for (const subCmd of cmdValue) {
        const promise = runCommandString(config, subCmd, env, false);
        if (parallel) {
          parallelPromises.push(promise);
        } else {
          // eslint-disable-next-line no-await-in-loop
          await promise;
        }
      }
      if (parallel) {
        await Promise.all(parallelPromises);
      }
    } catch (err) {
      if (!ignoreError) {
        throw err;
      }
    }
  }
}

const startingCmd = cli.input?.[0];
if (!startingCmd) {
  throw new Error('No task given');
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
    const cmd = getCmdFromConfig(configSource, startingCmd, false);
    if (!cmd) {
      const taskNames = Object.keys(config);
      throw new Error(
        `Task "${startingCmd}" not defined. Valid tasks are ${
          taskNames.length ? taskNames.join(', ') : '<empty>'
        }`,
      );
    }
    await runCommand(configSource, `#${startingCmd}`, cmd, {});
  } catch (err) {
    handleProcessError(err.message);
  }
})();
