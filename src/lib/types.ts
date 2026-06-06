export type UserRole = "parent" | "child";
export type RewardType = "time" | "point";
export type LogType = "earn" | "spend";

export interface HomeworkItem {
  subject: string;
  description: string;
  dueDate: string;    // YYYY-MM-DD
  dueTime?: string;   // HH:MM
  endTime?: string;   // HH:MM
}

export interface Homework extends HomeworkItem {
  id: string;
  pairId: string;
  rewardAmount: number;
  isCompleted: boolean;
  completedAt?: string;
  createdBy: string;
  createdAt: string;
}

export interface RewardSetting {
  id: string;
  pairId: string;
  type: RewardType;
  name: string;
  unit: string;
}

export interface RewardLog {
  id: string;
  pairId: string;
  childId: string;
  homeworkId?: string;
  type: LogType;
  rewardType: RewardType;
  amount: number;
  note?: string;
  createdAt: string;
}

export interface SubjectRule {
  subject: string;
  ruleContent: string;
}
