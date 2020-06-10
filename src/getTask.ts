import { ConfigSource, Settings } from './config';
import Task from './task';
import { settingsKey } from './consts';

function checkTask(
  task: Task | undefined,
  taskPath: string[],
  configSource: ConfigSource,
): asserts task {
  if (task) {
    return;
  }
  const validTasks = Object.keys(configSource).filter((s) => s !== settingsKey);
  throw new Error(
    `Task "${taskPath.join(
      ' ',
    )}" is not defined. Valid tasks are "${validTasks.join(', ')}".`,
  );
}

function findChild(
  obj: Record<string, unknown>,
  path: string[],
  fullPath: string[],
  configSource: ConfigSource,
): Task {
  let currentObj = obj;
  let result: Task | undefined;
  let i = 0;
  while (i < path.length && !!currentObj) {
    const name = path[i];
    currentObj = currentObj[name] as Record<string, unknown>;
    if (i === path.length - 1) {
      result = currentObj;
    }
    i++;
  }

  // fullPath: a b c d
  // path: b c d
  // if we failed to find c, we need to print "a b c" is undefined.
  // i is 3 (index of d)
  // fullPath(0, 3) is "a b c"
  checkTask(result, fullPath.slice(0, i), configSource);
  return result;
}

export default function getTask(
  configSource: ConfigSource,
  settings: Settings,
  names: string[],
): Task {
  if (!names || names.length === 0) {
    throw new Error('No tasks specified');
  }
  const currentName = names[0];
  if (currentName === settingsKey) {
    throw new Error(
      `You cannot use "${settingsKey}" as a command name, "${settingsKey}" is a preserved name for daizong configuration`,
    );
  }
  let result = configSource[currentName];
  if (!result && settings.privateTasks) {
    result = settings.privateTasks[currentName];
  }
  if (names.length > 1) {
    result = findChild(
      result as Record<string, unknown>,
      names.slice(1),
      names,
      configSource,
    );
  }
  checkTask(result, names, configSource);
  return result;
}
