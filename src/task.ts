import { Actions } from './actions';

export type TaskItemType = string | string[];

export default interface Task {
  run?: TaskItemType;
  parallel?: boolean;
  env?: Record<string, string>;
  ignoreError?: boolean;
  before?: Actions;
  after?: Actions;
}
