import { cosmiconfig } from 'cosmiconfig';
import * as nodepath from 'path';
import Cmd from './cmd';

export interface Settings {
  defaultEnv?: Record<string, string>;
  privateTasks?: Record<string, Cmd>;
}

export interface ConfigSource {
  [name: string]: Cmd | undefined;
}

export interface Config {
  source: ConfigSource;
  path?: string;
}

export async function loadConfig(
  pkgName: string,
  configFile: string | null,
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
