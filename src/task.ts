import { Actions } from './actions.js';

export type TaskItemType = string | string[] | Actions;

export interface Task {
  run?: TaskItemType;
  parallel?: boolean;
  env?: Record<string, string>;
  ignoreError?: boolean;
  before?: Actions;
  after?: Actions;
  continueOnChildError?: boolean;
  alias?: string;
  envGroups?: string | string[];

  // An internal flag indicating if a task is defined as private.
  __isPrivate?: boolean;
}
