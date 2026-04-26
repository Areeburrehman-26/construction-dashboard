export type InferenceMode = "both" | "ppe_only" | "crack_only";
export type JobStatus = "pending" | "processing" | "completed";
export type DatasetCategory = "ppe" | "crack" | "both";
export type FeedbackStatus = "positive" | "negative";

export const modeLabels: Record<InferenceMode, string> = {
  both: "Complete Safety Scan",
  ppe_only: "Worker PPE Check",
  crack_only: "Structural Crack Check",
};

export const statusLabels: Record<JobStatus, string> = {
  pending: "Waiting",
  processing: "In Progress",
  completed: "Completed",
};

export const formatDateTime = (value: number) =>
  new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
