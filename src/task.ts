import { BTCommands } from './btCmd.js';

export type RunValueType = string | string[] | BTCommands;

export interface Task {
  run?: RunValueType;
  parallel?: boolean;
  env?: Record<string, string>;
  ignoreError?: boolean;
  before?: string;
  after?: string;
  continueOnChildError?: boolean;
  alias?: string;
  envGroups?: string | string[];

  // An internal flag indicating if a task is defined as private.
  __isPrivate?: boolean;
}
