// src/domain/engine/causeChain/detectStages.ts
import { STAGE_PATTERNS } from "./patterns";
import { CauseStage } from "./types";

export function detectCauseStages(text: string): CauseStage[] {
  const stages: CauseStage[] = [];

  (Object.keys(STAGE_PATTERNS) as unknown as CauseStage[]).forEach((stage) => {
    const pattern = STAGE_PATTERNS[stage];
    if (pattern.test(text)) {
      stages.push(stage);
    }
  });

  return stages;
}