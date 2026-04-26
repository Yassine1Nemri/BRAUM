import type { Grade, GradeResult, ScoreBreakdownKey } from "../types/grade.js";
import type { ScanModuleResults } from "../types/scan.js";

const WEIGHTS: Record<ScoreBreakdownKey, number> = {
  headers: 0.3,
  ssl: 0.3,
  ports: 0.2,
  files: 0.2,
};

export function calculateGrade(results: ScanModuleResults): GradeResult {
  const breakdown = {
    headers: buildBreakdownItem(results.headers?.score ?? 0, WEIGHTS.headers),
    ssl: buildBreakdownItem(results.ssl?.score ?? 0, WEIGHTS.ssl),
    ports: buildBreakdownItem(results.ports?.score ?? 0, WEIGHTS.ports),
    files: buildBreakdownItem(results.files?.score ?? 0, WEIGHTS.files),
  };

  const score = Number(
    Object.values(breakdown)
      .reduce((total, item) => total + item.weightedScore, 0)
      .toFixed(1),
  );

  return {
    score,
    grade: gradeForScore(score),
    breakdown,
  };
}

function buildBreakdownItem(score: number, weight: number) {
  return {
    score,
    weight,
    weightedScore: Number((score * weight).toFixed(1)),
  };
}

function gradeForScore(score: number): Grade {
  if (score >= 90) {
    return "A";
  }

  if (score >= 75) {
    return "B";
  }

  if (score >= 60) {
    return "C";
  }

  if (score >= 45) {
    return "D";
  }

  return "F";
}
