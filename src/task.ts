import { Actions } from './actions';

export type TaskItemType = string | string[] | Actions;

// Used as a placeholder for alias.
export class TaskRef {
  constructor(public task: Task) {}
}

export interface Task {
  run?: TaskItemType;
  parallel?: boolean;
  env?: Record<string, string>;
  ignoreError?: boolean;
  before?: Actions;
  after?: Actions;
  continueOnChildError?: boolean;
  alias?: string;

  // An internal flag indicating if a task is defined as private.
  __isPrivate?: boolean;
}

export type TaskValue = TaskRef | Task;
