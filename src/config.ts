import { cosmiconfig } from 'cosmiconfig';
import * as nodepath from 'path';
import Task from './task';

export interface Settings {
  defaultEnv?: Record<string, string>;
  privateTasks?: Record<string, Task>;
}

export interface ConfigSource {
  [name: string]: Task | undefined;
}

export interface Config {
  source: ConfigSource;
  path?: string;
}

export async function loadConfig(
  pkgName: string,
  configFile: string | undefined,
): Promise<Config> {
  const explorer = cosmiconfig(pkgName);
  const explorerRes = await (configFile
    ? explorer.load(configFile)
    : explorer.search());

  if (!explorerRes || explorerRes.isEmpty) {
    throw new Error(`No config file found at "${nodepath.resolve('.')}"`);
  }
  const configSource = explorerRes?.config || {};
  return {
    source: configSource,
    path: explorerRes?.filepath,
  };
}
