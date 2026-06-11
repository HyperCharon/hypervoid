// Shared subject constants for the study tools (used in both server + client).

export const SUBJECTS = ["politics", "english", "math", "major"] as const;
export type Subject = (typeof SUBJECTS)[number];

export const SUBJECT_LABELS: Record<Subject, string> = {
  politics: "政治",
  english: "英语",
  math: "数学",
  major: "专业课",
};

export function subjectLabel(s: Subject): string {
  return SUBJECT_LABELS[s] ?? s;
}
