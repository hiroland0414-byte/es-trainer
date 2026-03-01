import type { DocType } from "@/domain/types/models";

export const DOC_TYPE_MIN_CHARS: Record<DocType, number> = {
  motivation: 300,
  self_pr: 160,
  gakuchika: 160,
};