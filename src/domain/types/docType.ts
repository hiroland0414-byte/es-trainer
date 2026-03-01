// src/domain/types/docType.ts
export type DocType = "motivation" | "self_pr" | "gakuchika";

export const DOC_LABEL: Record<DocType, string> = {
  motivation: "志望動機",
  self_pr: "自己PR",
  gakuchika: "ガクチカ",
};