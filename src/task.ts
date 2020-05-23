export type RunItemType = string | string[];

export default interface Task {
  run?: RunItemType[];
}
