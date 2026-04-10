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

  const resolvedDocType: DocType = (docType ?? "motivation") as DocType;

  return scoreText(modeId, raw, personaId, resolvedPriorityAxes, resolvedDocType);
}