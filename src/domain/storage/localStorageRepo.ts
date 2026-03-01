// src/domain/storage/localStorageRepo.ts
import { ScoreResult, StoredResult } from "@/domain/types/models";

const KEY = "es_trainer_results_v1";
const MAX = 50;

export function loadResults(): StoredResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredResult[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x) => x && typeof x.createdAt === "number")
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

export function saveResult(result: ScoreResult): void {
  if (typeof window === "undefined") return;

  const existing = loadResults();

  // ★引用（quote）は保存しない（画面/印刷のために都度生成）
  // start/end/comment は残してOK（個人特定にならない前提の設計）
  const sanitized: StoredResult = {
    ...result,
    feedback: {
      ...result.feedback,
      redPenItems: result.feedback.redPenItems.map(({ quote, ...rest }) => ({
        ...rest,
        quote: "",
      })),
    },
  };

  const next = [sanitized, ...existing].slice(0, MAX);

  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // noop
  }
}

export function clearResults(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // noop
  }
}
