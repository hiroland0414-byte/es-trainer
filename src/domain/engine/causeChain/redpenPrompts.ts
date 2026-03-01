// src/domain/engine/causeChain/redpenPrompts.ts
import { CauseStage } from "./types";

export function causeStageQuestion(stage: CauseStage): string {
  switch (stage) {
    case 5:
      return "その強みは相手側にどのようなメリットとして届きますか？";
    case 4:
      return "その経験で、何がどのように変わりましたか？";
    case 3:
      return "その考えが生まれた具体的な経験は何ですか？";
    case 2:
      return "なぜそう考えるのか、あなたの価値観は何ですか？";
    default:
      return "文章の因果の流れを整理してみましょう。";
  }
}