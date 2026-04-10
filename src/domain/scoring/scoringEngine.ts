// src/domain/scoring/scoringEngine.ts
import type { AxisId, DocType, ModeId, PersonaId, ScoreResult } from "@/domain/types/models";
import { PERSONAS } from "@/domain/config/personas";
import { scoreText } from "./ruleBasedScorer";

/**
 * scoringEngine の窓口
 * - 旧：evaluate(modeId, raw, personaId)
 * - 新：evaluate(modeId, raw, personaId, priorityAxes, docType)
 * どちらでも動くように後方互換を維持する。
 */
export function evaluate(
  modeId: ModeId,
  raw: string,
  personaId: PersonaId,
  priorityAxes?: AxisId[] | null,
  docType?: DocType | null
): ScoreResult {
  const persona = PERSONAS[personaId];

  const resolvedPriorityAxes: AxisId[] =
    (priorityAxes && priorityAxes.length > 0
      ? priorityAxes
      : persona?.priorityAxes) ?? ["clarity", "specificity", "logic", "contribution", "fit"];

let resolvedDocType: DocType = (docType ?? "motivation") as DocType;

if (modeId.includes("checkup_center") && modeId.includes("_pr_")) {
  resolvedDocType = "self_pr";
}

// ★ ここに追加
console.log("raw length:", raw.length, raw);
console.log("modeId:", modeId);
console.log("docType:", resolvedDocType);

return scoreText(modeId, raw, personaId, resolvedPriorityAxes, resolvedDocType);
}