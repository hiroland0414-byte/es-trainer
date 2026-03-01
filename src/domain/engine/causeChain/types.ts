// src/domain/engine/causeChain/types.ts

export type CauseStage = 1 | 2 | 3 | 4 | 5;

export type CauseStagePresence = Record<CauseStage, boolean>;

export type CauseLink = {
  from: CauseStage;
  to: CauseStage;
  ok: boolean;
};

export type CauseChainResult = {
  presence: CauseStagePresence;
  links: CauseLink[];
  highestStage: CauseStage;
  weakestStage?: CauseStage;
};