import { Config } from './config.js';
import { Task } from './task.js';

// If you have task "a b" defined and a `args` of "a b c d",
// this returns [Task("a b"), ["a", "b"], ["c", "d"]].
function findTask(
  config: Config,
  args: string[],
): [Task | null, string[], string[]] {
  // eslint-disable-next-line max-len
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-explicit-any
  let obj = config.tasks as any;
  let found = false;
  const matched: string[] = [];
  let unmatched: string[] = [];
  for (let i = 0; i < args.length; i++) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const arg = args[i]!;
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (!obj[arg]) {
      unmatched = args.splice(i);
      break;
    } else {
      found = true;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      obj = obj[arg];
      matched.push(arg);
    }
  }
  return [found ? (obj as Task) : null, matched, unmatched];
}

export default function getTask(
  config: Config,
  args: string[],
  allowPrivate: boolean,
): [Task, string[], string[]] {
  if (!args.length) {
    throw new Error('No tasks specified');
  }
  const [task, matchedArgs, unmatchedArgs] = findTask(config, args);
  if (!task) {
    throw new Error('The task you specified does not exist');
  }
  if (task.__isPrivate && !allowPrivate) {
    throw new Error(
      `Task "${matchedArgs.join(
        ' ',
      )}" is private, it can only be triggered by other tasks`,
    );
  }
  return [task, matchedArgs, unmatchedArgs];
}
