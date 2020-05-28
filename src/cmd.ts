export type CmdItemType = string | string[];

export default interface Cmd {
  run?: CmdItemType;
  parallel?: boolean;
  env?: Record<string, string>;
  ignoreError?: boolean;
}
