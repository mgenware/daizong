import { cosmiconfig } from 'cosmiconfig';
import * as nodepath from 'path';
import { Task } from './task';

const settingsKey = '_';

interface SettingsDefinition {
  defaultEnv?: Record<string, string | undefined>;
  // After parsing, `privateTasks` are moved to `Config.tasks` with `__isPrivate` set to true.
  privateTasks?: Record<string, Task | undefined>;
  envGroups?: Record<string, Record<string, string | undefined>>;
}

interface ConfigDefinition {
  [name: string]: Task | undefined;
}

export interface Settings {
  defaultEnv?: Record<string, string | undefined>;
  envGroups: Record<string, Record<string, string | undefined>>;
}

export interface Config {
  // Tasks defined in config.
  originalTasks: Record<string, Task | undefined>;
  // Tasks with aliases injected.
  fullTasks: Record<string, Task | undefined>;
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
  const rawConfig = (explorerRes?.config ?? {}) as ConfigDefinition;
  const rawSettings = ((rawConfig[settingsKey] ||
    {}) as unknown) as SettingsDefinition;
  // Remove the preserved `_` field from tasks.
  delete rawConfig[settingsKey];
  const tasks = rawConfig as Record<string, Task | undefined>;

  const settings: Settings = { envGroups: {} };
  settings.defaultEnv = rawSettings.defaultEnv;
  if (rawSettings.envGroups) {
    settings.envGroups = rawSettings.envGroups;
  }

  // Merge private tasks into `config.tasks`.
  const { privateTasks } = rawSettings;
  if (privateTasks) {
    for (const [key, value] of Object.entries(privateTasks)) {
      if (!value) {
        continue;
      }
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
    if (!task) {
      continue;
    }
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
