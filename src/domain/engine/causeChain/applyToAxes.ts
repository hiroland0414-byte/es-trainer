// src/domain/engine/causeChain/applyToAxes.ts
import { CauseChainResult } from "./types";
import { AxisId } from "@/domain/types/models";

export function applyCauseChainToAxes(
  base: Record<AxisId, number>,
  cause: CauseChainResult
): Record<AxisId, number> {

  const updated = { ...base };

  if (cause.weakestStage === 5) {
    updated.contribution = Math.max(1, updated.contribution - 1);
  }

  if (cause.weakestStage === 4) {
    updated.logic = Math.max(1, updated.logic - 1);
  }

  if (cause.weakestStage === 3) {
    updated.specificity = Math.max(1, updated.specificity - 1);
  }

  if (cause.weakestStage === 2) {
    updated.clarity = Math.max(1, updated.clarity - 1);
  }

  return updated;
}