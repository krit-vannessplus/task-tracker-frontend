// types.ts
export const TASK_STATUS = ["Pending", "Ready", "In Progress", "Done"] as const;

export const TASK_PRIORITY = ["Low", "Medium", "High"] as const;

export type TaskStatus = (typeof TASK_STATUS)[number];
export type TaskPriority = (typeof TASK_PRIORITY)[number];

export interface Task {
  id: string;
  projectName: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assignees: string[];
  followers: string[];
  dependencies: string[];
}
