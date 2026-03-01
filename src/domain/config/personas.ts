// src/domain/config/personas.ts
import type { AxisId, PersonaId } from "@/domain/types/models";

/**
 * PERSONAS
 * - priorityAxes は「改善点/次の一手/赤ペン」の並び順を決める最重要パラメータ
 * - 企業は “役割” ごとに刺さる順がかなり違うので、ここで最適化する
 *
 * style は UI 表示に使う想定（型が厳しい場合は models.ts の PersonaConfig.style に合わせて調整）
 */
type PersonaBase = {
  label: string;
  style: "strict" | "warm" | "coach";
  priorityAxes: AxisId[];
};

const BASE: Record<PersonaId, PersonaBase> = {
  /* ============================================================
     病院
  ============================================================ */
  hospital_rt_head: {
    label: "放射線技師長",
    style: "strict",
    // 現場：安全/品質の再現性 → 論理と具体 → 最後に適合
    priorityAxes: ["specificity", "logic", "contribution", "fit", "clarity"],
  },
  hospital_hr: {
    label: "病院 人事担当",
    style: "warm",
    // 人事：読みやすさ→納得感→適合（どこでも言えるを嫌う）→貢献→具体
    priorityAxes: ["clarity", "logic", "fit", "contribution", "specificity"],
  },
  hospital_nurse_head: {
    label: "看護師長",
    style: "strict",
    // 現場：患者価値→行動の具体→因果→適合→最後に読みやすさ
    priorityAxes: ["contribution", "specificity", "logic", "fit", "clarity"],
  },

  /* ============================================================
     企業
  ============================================================ */
  company_hr: {
    label: "企業 人事",
    style: "warm",
    // 企業人事：伝わる→筋が通る→カルチャー適合→貢献→具体
    priorityAxes: ["clarity", "logic", "fit", "contribution", "specificity"],
  },

  company_tech_head: {
    label: "技術部長",
    style: "strict",
    // 技術：再現性（具体）→論理（検証の筋）→貢献（価値）→適合→読みやすさ
    priorityAxes: ["specificity", "logic", "contribution", "fit", "clarity"],
  },

  company_field_service_head: {
    label: "フィールドサービス責任者",
    style: "coach",
    // FS：現場で伝わる/回る → 具体 → 適合（現場理解）→ 貢献 → 論理
    priorityAxes: ["clarity", "specificity", "fit", "contribution", "logic"],
  },

  company_sales_head: {
    label: "営業部長",
    style: "strict",
    // 営業：顧客価値（貢献）→適合（なぜこの市場/商材か）→論理（提案の筋）→具体（事例）→読みやすさ
    priorityAxes: ["contribution", "fit", "logic", "specificity", "clarity"],
  },

  /* ============================================================
     健診
  ============================================================ */
  checkup_hr: {
    label: "人事担当者",
    style: "warm",
    // 健診：分かりやすさ（説明）→具体（配慮/案内）→貢献→論理→適合
    priorityAxes: ["clarity", "specificity", "contribution", "logic", "fit"],
  },
};

export const PERSONAS: Record<PersonaId, PersonaBase> = BASE;