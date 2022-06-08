import * as fs from 'fs';
import * as np from 'path';
import { fileURLToPath } from 'url';
import { Task } from './task.js';

const settingsKey = '_';
const dirname = np.dirname(fileURLToPath(import.meta.url));

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
  // Tasks with aliases and private tasks injected.
  tasks: Record<string, Task | undefined>;
  settings: Settings;
  path: string;
}

async function fileExists(file: string) {
  return fs.promises
    .access(file, fs.constants.F_OK)
    .then(() => true)
    .catch(() => false);
}

function normalizeImport(path: string): string {
  // eslint-disable-next-line no-param-reassign
  path = np.relative(dirname, path);
  if (process.platform === 'win32') {
    return path.split(np.sep).join(np.posix.sep);
  }
  return path;
}

async function getConfigPath(files: string[]): Promise<string> {
  for (const file of files) {
    // eslint-disable-next-line no-await-in-loop
    if (await fileExists(file)) {
      return file;
    }
  }
  throw new Error(`Config file "${files[0]}" does not exist.`);
}

export async function loadConfig(
  configFile: string | undefined,
): Promise<Config> {
  // eslint-disable-next-line no-param-reassign
  configFile = await getConfigPath(
    configFile
      ? [configFile]
      : ['daizong.config.js', 'daizong.config.mjs', 'daizong.config.cjs'],
  );
  const rawConfig = (await import(normalizeImport(configFile)))
    ?.default as ConfigDefinition;
  const rawSettings = (rawConfig[settingsKey] ||
    {}) as unknown as SettingsDefinition;
  // Remove the preserved `_` field from tasks.
  delete rawConfig[settingsKey];
  const rawTasks = rawConfig as Readonly<Record<string, Task | undefined>>;

  const settings: Settings = { envGroups: {} };
  settings.defaultEnv = rawSettings.defaultEnv;
  if (rawSettings.envGroups) {
    settings.envGroups = rawSettings.envGroups;
  }

  const tasks: Record<string, Task | undefined> = { ...rawTasks };
  // Merge private tasks into `config.tasks`.
  const { privateTasks } = rawSettings;
  if (privateTasks) {
    for (const [key, value] of Object.entries(privateTasks)) {
      if (!value) {
        continue;
      }
      if (rawTasks[key]) {
        throw new Error(`Task "${key}" is already defined in public tasks`);
      }
      value.__isPrivate = true;
      tasks[key] = value;
    }
    delete rawSettings.privateTasks;
  }

  // Process aliases.
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
      if (tasks[alias]) {
        throw new Error(`Duplicate name "${alias}"`);
      }
      tasks[alias] = task;
    }
  }

  const config: Config = {
    settings,
    tasks,
    path: configFile,
  };
  return config;
}
