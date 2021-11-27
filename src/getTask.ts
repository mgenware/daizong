import { Config } from './config.js';
import { Task } from './task.js';

function findTask(config: Config, path: string[]): Task {
  // eslint-disable-next-line max-len
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-explicit-any
  let obj = config.tasks as any;
  for (const arg of path) {
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (!obj[arg]) {
      break;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      obj = obj[arg];
    }
  }
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (!obj) {
    throw new Error(`Task "${path.toString()}" doesn't exist.`);
  }
  if (typeof obj === 'string') {
    return { run: obj };
  }
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (!obj.run) {
    throw new Error(
      `A valid task is either a string or an object with a "run" field. Got ${JSON.stringify(
        obj,
      )}`,
    );
  }
  return obj as Task;
}

export default function getTask(
  config: Config,
  path: string[],
  allowPrivate: boolean,
): Task {
  if (!path.length) {
    throw new Error('No tasks specified');
  }
  const task = findTask(config, path);
  if (task.__isPrivate && !allowPrivate) {
    throw new Error(
      `Task "${path.toString()}" is private, it can only be triggered by other tasks`,
    );
  }
  return task;
}
