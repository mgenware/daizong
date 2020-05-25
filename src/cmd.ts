export type CmdItemType = string | string[];

export default interface Cmd {
  cmd?: CmdItemType | Cmd[];
  parallel?: boolean;
  env?: Record<string, string>;
}

export function isSingleCmd(name: string, cmd: CmdItemType | Cmd[]): boolean {
  if (typeof cmd === 'string') {
    return true;
  }
  if (!Array.isArray(cmd)) {
    throw new Error(
      `The command "${name}" should be an array, got ${JSON.stringify(cmd)}`,
    );
  }
  if (!cmd.length) {
    throw new Error(`The command "${name}" is empty`);
  }
  const firstChild = cmd[0];
  if (typeof firstChild === 'string') {
    return true;
  }
  return false;
}
