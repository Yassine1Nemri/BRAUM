export type Grade = "A" | "B" | "C" | "D" | "F";
export type ScoreBreakdownKey = "headers" | "ssl" | "ports" | "files";

export interface ScoreBreakdownItem {
  score: number;
  weight: number;
  weightedScore: number;
}

export interface GradeResult {
  score: number;
  grade: Grade;
  breakdown: Record<ScoreBreakdownKey, ScoreBreakdownItem>;
}
