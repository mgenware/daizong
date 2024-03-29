export enum Command {
  version,
  help,
  run,
}

export interface ArgsResult {
  command: Command;
  configFile?: string;
  verbose?: boolean;
  private?: boolean;
  taskName: string;
  taskArgs: string[];
  error?: string;
}

enum BuilderNextValue {
  taskPath,
  configFile,
  taskArgs,
}

class ArgsBuilder {
  private result: ArgsResult = {
    command: Command.run,
    taskName: '',
    taskArgs: [],
  };

  private nextValue = BuilderNextValue.taskPath;

  // Returns if args parsing should continue.
  handleArg(s: string): boolean {
    const { result, nextValue } = this;

    // If task path is already set, all following arguments are task arguments.
    if (nextValue === BuilderNextValue.taskArgs) {
      result.taskArgs.push(s);
      return true;
    }
    if (s.startsWith('-')) {
      if (nextValue === BuilderNextValue.configFile) {
        this.throwConfigFileNotSet();
      }
      switch (s) {
        case '-v':
        case '--version': {
          result.command = Command.version;
          return false;
        }
        case '--help': {
          result.command = Command.help;
          return false;
        }
        case '--verbose': {
          result.verbose = true;
          break;
        }
        case '--private': {
          result.private = true;
          break;
        }
        case '--config': {
          this.nextValue = BuilderNextValue.configFile;
          break;
        }
        default: {
          throw new Error(`Unknown option \`${s}\`.`);
        }
      } // end of switch (s).
    } else {
      switch (nextValue) {
        case BuilderNextValue.configFile: {
          result.configFile = s;
          this.nextValue = BuilderNextValue.taskPath;
          break;
        }

        case BuilderNextValue.taskPath: {
          result.taskName = s;
          this.nextValue = BuilderNextValue.taskArgs;
          break;
        }

        default: {
          throw new Error(`Unexpected value ${nextValue}`);
        }
      }
    }
    return true;
  }

  getResult(): ArgsResult {
    const { result, nextValue } = this;
    if (result.command !== Command.run) {
      return result;
    }
    if (nextValue === BuilderNextValue.configFile) {
      this.throwConfigFileNotSet();
    }
    if (nextValue === BuilderNextValue.taskPath) {
      throw new Error('No task specified.');
    }
    return result;
  }

  // eslint-disable-next-line class-methods-use-this
  private throwConfigFileNotSet() {
    throw new Error("`--config` doesn't have a valid value set.");
  }
}

export function parseArgs(args: string[]): ArgsResult {
  try {
    const builder = new ArgsBuilder();
    for (const s of args) {
      const shouldContinue = builder.handleArg(s);
      if (!shouldContinue) {
        break;
      }
    }
    return builder.getResult();
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : `${err}`,
      command: Command.version,
      taskName: '',
      taskArgs: [],
    };
  }
}
