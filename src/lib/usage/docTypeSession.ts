import type { DocType } from "@/domain/types/docType";

const KEY = "kcareer.docType.v1";

export function setDocType(docType: DocType) {
  try {
    localStorage.setItem(KEY, docType);
  } catch {}
}

export function getDocType(): DocType {
  try {
    const v = localStorage.getItem(KEY) as DocType | null;
    return v ?? "motivation";
  } catch {
    return "motivation";
  }
}