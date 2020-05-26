#!/usr/bin/env node
import { cosmiconfig } from 'cosmiconfig';
import * as parseArgs from 'meow';
import * as chalk from 'chalk';
import * as nodepath from 'path';
import spawnProcess from './spawn';
import Cmd from './cmd';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { name: pkgName, version: pkgVersion } = require('../package.json');

const explorer = cosmiconfig(pkgName);

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

async function run(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: Record<string, Cmd>,
  cmdDisplayName: string,
  command: Cmd | string,
  inheritedEnv: Record<string, string>,
): Promise<void> {
  if (typeof command === 'string') {
    // Check if this command is calling another command.

    let promise: Promise<void>;
    if (command.startsWith('#')) {
      const cmdName = command.substr(1);
      if (!cmdName) {
        throw new Error(`"${command}" is not a valid task name`);
      }
      const childCmd = config[cmdName];
      if (!childCmd) {
        throw new Error(`Command not found "${cmdName}"`);
      }
      promise = run(config, command, childCmd, inheritedEnv);
    } else {
      // eslint-disable-next-line no-console
      console.log(`>> ${chalk.yellow(command)}`);
      promise = spawnProcess(command, inheritedEnv);
    }
    await promise;
    return;
  }

  const cmdValue = command.cmd;
  // Run the specified task.
  if (!cmdValue) {
    throw new Error(`No "cmd" field defined in command "${cmdDisplayName}"`);
  }

  if (cmdDisplayName) {
    // eslint-disable-next-line no-console
    console.log(`>> ${cmdDisplayName}`);
  }

  const { parallel, env: definedEnv } = command;
  const env = {
    ...inheritedEnv,
    ...definedEnv,
  };
  if (typeof cmdValue === 'string') {
    await run(config, '', cmdValue, env);
  } else {
    const parallelPromises: Promise<void>[] = [];

    for (const subCmd of cmdValue) {
      const promise = run(config, '', subCmd, env);
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
  }
}

const startingCmd = cli.input?.[0];
if (!startingCmd) {
  throw new Error('No task given');
}

(async () => {
  const explorerRes = await (flags.config
    ? explorer.load(flags.config)
    : explorer.search());

  if (!explorerRes || explorerRes.isEmpty) {
    throw new Error(`No config file found at "${nodepath.resolve('.')}"`);
  }

  const config = explorerRes?.config || {};
  verboseLog(
    `Loaded config file at "${explorerRes?.filepath}"
${JSON.stringify(config)}
`,
  );

  const cmd = config[startingCmd] as Cmd | undefined;
  if (!cmd) {
    const taskNames = Object.keys(config);
    throw new Error(
      `Task "${startingCmd}" not defined. Valid tasks are ${
        taskNames.length ? taskNames.join(', ') : '<empty>'
      }`,
    );
  }
  await run(config, `#${startingCmd}`, cmd, {});
})();
