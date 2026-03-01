// src/domain/engine/evaluateText.ts
import type {
  ModeConfig,
  PersonaId,
  ScoreResult,
  AxisId,
  ScoreValue,
  AxisScore,
} from "@/domain/types/models";

import { evaluate } from "@/domain/scoring/scoringEngine";

import {
  detectCauseStages,
  analyzeCauseChain,
  applyCauseChainToAxes,
  causeStageQuestion,
} from "@/domain/engine/causeChain";

/**
 * number → ScoreValue(0〜5) に正規化
 */
function toScoreValue(n: number): ScoreValue {
  const v = Math.max(0, Math.min(5, Math.round(n)));
  return v as ScoreValue;
}

/**
 * ScoreResult.scores → 5軸のmapへ変換
 */
function toAxisScores(result: ScoreResult): Record<AxisId, number> {
  const base: Record<AxisId, number> = {
    clarity: 3,
    specificity: 3,
    logic: 3,
    contribution: 3,
    fit: 3,
  };

  for (const sc of result.scores ?? []) {
    if (sc.axisId in base) {
      base[sc.axisId as AxisId] = Number(sc.score);
    }
  }

  return base;
}

/**
 * 補正後の数値を ScoreResult に戻す
 */
function applyBack(result: ScoreResult, axisScores: Record<AxisId, number>): ScoreResult {
  const updatedScores: AxisScore[] = (result.scores ?? []).map((sc) => {
    if (!(sc.axisId in axisScores)) return sc;

    return {
      ...sc,
      score: toScoreValue(axisScores[sc.axisId as AxisId]),
    };
  });

  return {
    ...result,
    scores: updatedScores,
  };
}

/**
 * エンジン統合地点
 */
export function evaluateText(text: string, mode: ModeConfig, personaId: PersonaId): ScoreResult {
  // personaごとのpriorityAxes（無ければ mode.personas[0] にフォールバック）
  const priorityAxes =
    mode.personas.find((p) => p.personaId === personaId)?.priorityAxes ??
    mode.personas[0]?.priorityAxes ??
    ["clarity", "specificity", "logic", "contribution", "fit"];

  // ① 既存心臓（ruleBasedScorer）＋ docType を必ず渡す（今回の揺れ対策）
  const baseResult = evaluate(mode.modeId, text, personaId, priorityAxes, mode.docType);

  // ② 因果鎖解析
  const stages = detectCauseStages(text);
  const cause = analyzeCauseChain(stages);

  // ③ スコア補正（causeChain → axisScoresへ）
  const baseAxisScores = toAxisScores(baseResult);
  const axisScoresV2 = applyCauseChainToAxes(baseAxisScores, cause);

  let merged = applyBack(baseResult, axisScoresV2);

  // ④ 問いを1つだけ追加（思想ロック：多すぎない）
  if (cause.weakestStage) {
    const question = causeStageQuestion(cause.weakestStage);

    merged = {
      ...merged,
      feedback: {
        ...merged.feedback,
        next: [question, ...(merged.feedback?.next ?? [])].slice(0, 5),
      },
    };
  }

  return merged;
}