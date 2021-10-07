/* eslint-disable no-param-reassign */
const configFlag = '--config=';
const quotesSet = new Set<string>(['"', '"']);

export enum Command {
  version,
  help,
  run,
}

export interface Result {
  command: Command;
  configFile?: string;
  args?: string[];
  verbose?: boolean;
  private?: boolean;
}

function trimString(s: string, chars: Set<string>): string {
  let start = 0;
  let end = s.length;

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  while (start < end && chars.has(s[start]!)) {
    ++start;
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  while (end > start && chars.has(s[end - 1]!)) {
    --end;
  }

  return start > 0 || end < s.length ? s.substring(start, end) : s;
}

function trimFlagValue(s: string): string {
  return trimString(s, quotesSet);
}

function handleFlag(r: Result, flag: string) {
  let switchHandled = true;
  // eslint-disable-next-line default-case
  switch (flag) {
    case '-v':
    case '--version': {
      r.command = Command.version;
      break;
    }
    case '--help': {
      r.command = Command.help;
      break;
    }
    case '--verbose': {
      r.verbose = true;
      break;
    }
    case '--private': {
      r.private = true;
      break;
    }
    default: {
      switchHandled = false;
    }
  }
  if (switchHandled) {
    return;
  }
  if (flag.startsWith(configFlag)) {
    r.configFile = trimFlagValue(flag.substr(configFlag.length));
  } else {
    console.warn(`[WARNING] Unknown flag: ${flag}`);
  }
}

export function parseArgs(args: string[]): Result {
  // Dash arguments after a task name are considered
  // arguments to the task instead of daizong.
  // Example:
  // a b --version -> run task "a b" with "--version".
  const r: Result = { command: Command.run };
  let i = 0;
  for (; i < args.length; i++) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const arg = args[i]!;
    if (arg.startsWith('-')) {
      handleFlag(r, arg);
    } else {
      break;
    }
  }
  // Return the result if command is not `run`.
  if (r.command !== Command.run) {
    return r;
  }
  if (i >= args.length) {
    throw new Error('No tasks specified');
  }
  // `args` now has daizong flags stripped.
  args = args.splice(i);
  r.args = args;
  return r;
}
