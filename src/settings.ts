import Cmd from './cmd';

// Extra settings defined in "_" field in config file.
export default interface Settings {
  defaultEnv?: Record<string, string>;
  privateTasks?: Record<string, Cmd>;
}
