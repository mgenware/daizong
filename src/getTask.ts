import { Config } from './config';
import Task from './task';

function findChild(
  obj: Record<string, unknown>,
  path: string[],
  fullPath: string[],
): Task {
  let currentObj = obj;
  let child: Task | undefined;
  let i = 0;
  while (i < path.length && !!currentObj) {
    const name = path[i];
    currentObj = currentObj[name] as Record<string, unknown>;
    if (i === path.length - 1) {
      child = currentObj;
    }
    i++;
  }

  // fullPath: a b c d
  // path: b c d
  // if we failed to find c, we need to print "a b c" is undefined.
  // i is 3 (index of d)
  // fullPath(0, 3) is "a b c"
  if (!child) {
    throw new Error(
      `Task "${fullPath
        .slice(0, i)
        .join(' ')}" does not contain a child task named "${fullPath[i]}"`,
    );
  }
  return child;
}

export default function getTask(
  config: Config,
  names: string[],
  allowPrivate: boolean,
): Task {
  if (!names || names.length === 0) {
    throw new Error('No tasks specified');
  }
  const currentName = names[0];
  let task = config.tasks[currentName];
  if (!task) {
    const validTasks = Object.entries(config.tasks)
      .filter(([, value]) => !value.__isPrivate)
      .sort(([k1], [k2]) => k1.localeCompare(k2));
    throw new Error(
      `Task "${currentName}" is not defined. Valid tasks: ${JSON.stringify(
        validTasks,
      )}`,
    );
  }
  if (task.__isPrivate && !allowPrivate) {
    throw new Error(
      `Task "${currentName}" is private, you can only run it from other tasks`,
    );
  }
  if (names.length > 1) {
    task = findChild(task as Record<string, unknown>, names.slice(1), names);
  }
  return task;
}
