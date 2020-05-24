export type CmdItemType = string | string[];

export default interface Task {
  cmd?: CmdItemType[] | CmdItemType;
  parallel?: boolean;
  env?: Record<string, string>;
}
