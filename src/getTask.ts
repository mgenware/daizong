import { Config } from './config.js';
import { Task } from './task.js';

function findTask(config: Config, path: string[]): Task {
  // eslint-disable-next-line max-len
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-explicit-any
  let obj = config.tasks as any;
  for (const arg of path) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    obj = obj[arg];
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (!obj) {
      break;
    }
  }
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (!obj) {
    throw new Error(`The task #${path.join('-')} doesn't exist.`);
  }
  if (typeof obj === 'string') {
    return { run: obj };
  }
  if (Array.isArray(obj)) {
    return { run: obj };
  }
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (!obj.run) {
    throw new Error(
      `A valid task could only be a string, an array of strings, or an object with a "run" field. Got ${JSON.stringify(
        obj,
      )}`,
    );
  }
  return obj as Task;
}

export default function getTask(
  config: Config,
  name: string,
  allowPrivate: boolean,
): Task {
  const path = name.split('-');
  if (!name || !path.length) {
    throw new Error('No tasks specified');
  }
  const task = findTask(config, path);
  if (task.__isPrivate && !allowPrivate) {
    throw new Error(
      `The task #${path.toString()} is private. It can only be called by other tasks.`,
    );
  }
  return task;
}
