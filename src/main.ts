#!/usr/bin/env node
import { cosmiconfig } from 'cosmiconfig';
import * as parseArgs from 'meow';
import * as chalk from 'chalk';
import spawnProcess from './spawn';
import Cmd, { isSingleCmd } from './cmd';
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

async function run(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: Record<string, Cmd>,
  cmdDisplayName: string,
  cmd: Cmd,
  inheritedEnv: Record<string, string>,
): Promise<void> {
  const cmdValue = cmd.cmd;
  // Run the specified task.
  if (!cmdValue) {
    throw new Error(`No "cmd" field defined in command "${cmdDisplayName}"`);
  }

  // eslint-disable-next-line no-console
  console.log(`>> ${cmdDisplayName}`);

  const { parallel, env: definedEnv } = cmd;
  const env = {
    ...inheritedEnv,
    ...definedEnv,
  };
  const singleCmd = isSingleCmd(cmdDisplayName, cmdValue);
  if (singleCmd) {
    // This is a single command, `cmd` value could either be a string or an array of strings.

    let promise: Promise<void>;
    // Check if this command is calling another command.
    if (typeof cmdValue === 'string' && cmdValue.startsWith('#')) {
      const childCmdName = cmdValue.substr(1);
      if (!childCmdName) {
        throw new Error(`"${cmdValue}" is not a valid task name`);
      }
      const childCmd = config[childCmdName];
      if (!childCmd) {
        throw new Error(`Command not found "${childCmdName}"`);
      }
      promise = run(config, cmdValue, childCmd, env);
    } else {
      const args =
        typeof cmdValue === 'string' ? [cmdValue] : (cmdValue as string[]);
      const cmdString = args.join(' ');

      // eslint-disable-next-line no-console
      console.log(`>> ${chalk.yellow(cmdString)}`);
      promise = spawnProcess(
        args,
        env,
        // Use `exec` if `cmd` is a string.
        typeof cmdValue === 'string',
        (s) => {
          // eslint-disable-next-line no-console
          console.log(s);
        },
        (s) => {
          // eslint-disable-next-line no-console
          console.log(chalk.red(s));
        },
      );
    }
    await promise;
  } else {
    const cmdList = cmd.cmd as Cmd[];
    const parallelPromises: Promise<void>[] = [];

    let childNumber = 0;
    for (const childCmd of cmdList) {
      childNumber++;
      const promise = run(
        config,
        `${cmdDisplayName}-${childNumber}`,
        childCmd,
        env,
      );
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
  const res = await (flags.config
    ? explorer.load(flags.config)
    : explorer.search());
  if (res?.isEmpty) {
    throw new Error(`No config file found at "${res.filepath}"`);
  }
  const config = res?.config || {};
  const cmd = config[startingCmd] as Cmd | undefined;
  if (!cmd) {
    throw new Error(
      `Task "${startingCmd}" not defined. Valid tasks are ${Object.keys(
        config,
      ).join(', ')}`,
    );
  }
  await run(config, `#${startingCmd}`, cmd, {});
})();
