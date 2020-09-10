import { cosmiconfig } from 'cosmiconfig';
import * as nodepath from 'path';
import { Task } from './task';

const settingsKey = '_';

interface SettingsDefinition {
  defaultEnv?: Record<string, string>;
  // After parsing, `privateTasks` are moved to `Config.tasks` with `__isPrivate` set to true.
  privateTasks?: Record<string, Task>;
  envGroups?: Record<string, Record<string, string>>;
}

interface ConfigDefinition {
  [name: string]: Task | undefined;
}

export interface Settings {
  defaultEnv?: Record<string, string>;
  envGroups: Record<string, Record<string, string>>;
}

export interface Config {
  // Tasks defined in config.
  originalTasks: Record<string, Task>;
  // Tasks with aliases injected.
  fullTasks: Record<string, Task>;
  settings: Settings;
  path: string;
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
  const rawConfig = (explorerRes?.config || {}) as ConfigDefinition;
  const rawSettings = ((rawConfig[settingsKey] ||
    {}) as unknown) as SettingsDefinition;
  // Remove the preserved `_` field from tasks.
  delete rawConfig[settingsKey];
  const tasks = rawConfig as Record<string, Task>;

  const settings: Settings = { envGroups: {} };
  settings.defaultEnv = rawSettings.defaultEnv;
  if (rawSettings.envGroups) {
    settings.envGroups = rawSettings.envGroups;
  }

  // Merge private tasks into `config.tasks`.
  const { privateTasks } = rawSettings;
  if (privateTasks) {
    for (const [key, value] of Object.entries(privateTasks)) {
      if (tasks[key]) {
        throw new Error(`Task "${key}" is already defined in public tasks`);
      }
      value.__isPrivate = true;
      tasks[key] = value;
    }
    delete rawSettings.privateTasks;
  }

  // Process aliases.
  const fullTasks = { ...tasks };
  for (const [name, task] of Object.entries(tasks)) {
    const { alias } = task;
    if (alias) {
      if (task.__isPrivate) {
        throw new Error(
          `Private cannot have an alias. Task: "${name}", alias: "${alias}"`,
        );
      }
      if (fullTasks[alias]) {
        throw new Error(`Duplicate name "${alias}"`);
      }
      fullTasks[alias] = task;
    }
  }

  const config: Config = {
    settings,
    originalTasks: tasks,
    fullTasks,
    path: explorerRes?.filepath || '',
  };
  return config;
}
