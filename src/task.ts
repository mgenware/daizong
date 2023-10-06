export interface Task {
  run?: unknown;
  parallel?: boolean;
  env?: Record<string, string>;
  ignoreError?: boolean;
  continueOnChildError?: boolean;
  workingDir?: string;
  alias?: string;
  envGroups?: string | string[];
  before?: unknown;
  after?: unknown;

  // Internal flag indicating if a task is defined as private.
  __isPrivate?: boolean;
}
