export type CmdItemType = string | string[];

export default interface Cmd {
  cmd?: CmdItemType;
  parallel?: boolean;
  env?: Record<string, string>;
}
