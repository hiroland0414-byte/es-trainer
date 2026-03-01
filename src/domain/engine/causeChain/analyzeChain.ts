// src/domain/engine/causeChain/analyzeChain.ts
import { CauseStage, CauseChainResult } from "./types";

export function analyzeCauseChain(stages: CauseStage[]): CauseChainResult {
  const presence = {
    1: stages.includes(1),
    2: stages.includes(2),
    3: stages.includes(3),
    4: stages.includes(4),
    5: stages.includes(5),
  };

  const highestStage: CauseStage =
    presence[5] ? 5 :
    presence[4] ? 4 :
    presence[3] ? 3 :
    presence[2] ? 2 : 1;

  const weakestStage =
    !presence[5] ? 5 :
    !presence[4] ? 4 :
    !presence[3] ? 3 :
    !presence[2] ? 2 :
    undefined;

  return {
    presence,
    links: [],
    highestStage,
    weakestStage,
  };
}