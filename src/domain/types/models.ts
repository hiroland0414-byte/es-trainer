// src/domain/types/models.ts

/* ============================================================
   IDs
============================================================ */

export type AxisId = "clarity" | "specificity" | "logic" | "contribution" | "fit";

export type PersonaId =
  | "hospital_rt_head"
  | "hospital_hr"
  | "hospital_nurse_head"
  | "company_sales_head"
  | "company_hr"
  | "company_tech_head"
  | "company_field_service_head"
  | "checkup_hr";

export type DocType = "motivation" | "self_pr" | "gakuchika";

/**
 * NOTE:
 * 以前の実装揺れ（company_eng_* など）で modeId がズレると /m/[modeId] が死ぬので、
 * ここは “現状使っているID” を広めに受けておく（崩れない優先）。
 */
export type ModeId =
  // --- hospital ---
  | "hospital_rt_motivation_v1"
  | "hospital_nurse_motivation_v1"

  // --- checkup ---
  | "checkup_center_motivation_v1"
  | "checkup_center_pr_v1"
  | "checkup_center_gakuchika_v1"

  // --- company ---
  | "company_tech_motivation_v1"
  | "company_tech_self_pr_v1"
  | "company_tech_gakuchika_v1"
  | "company_sales_motivation_v1"
  | "company_sales_self_pr_v1"
  | "company_sales_gakuchika_v1"

  // 念のため（過去揺れ対策）
  | "company_eng_motivation_v1";

/* ============================================================
   Config Models
============================================================ */

export type AxisConfig = {
  axisId: AxisId;
  label: string;
  description?: string;
};

export type PersonaConfig = {
  personaId: PersonaId;
  label: string;

  style: {
    tone: "strict" | "warm" | "coach";
    severity?: 1 | 2 | 3 | 4 | 5;
  };

  // ★評価者が特に重視する軸（並び順が重要）
  priorityAxes: AxisId[];
};

export type ModeConfig = {
  modeId: ModeId;
  title: string;

  docType: DocType;

  // UI表示順（レーダーもこの順）
  axes: AxisConfig[];

  // モードごとの評価者
  personas: PersonaConfig[];

  // 思想ロック用注意文
  notices: string[];
};

/* ============================================================
   Scoring Result Models
============================================================ */

export type ScoreValue = 0 | 1 | 2 | 3 | 4 | 5;

export type AxisScore = {
  axisId: AxisId;
  score: ScoreValue;
  reason: string;
};

export type RedPenItem = {
  axisId: AxisId;
  priorityRank: number; // 小さいほど重要（priorityAxes順）

  // ★本文内の下線位置（normalize済み本文の文字index）
  // 見つからない場合のみ -1
  start: number;
  end: number;

  // 表示用の短い引用（※保存時は落としてもOK）
  quote: string;

  // 赤ペンコメント
  comment: string;
};

export type Feedback = {
  good: string[];
  improve: string[];
  next: string[];

  // ★本文引用付き赤ペン
  redPenItems: RedPenItem[];
};

export type ScoreResult = {
  createdAt: number;
  modeId: ModeId;

  // 合計点は作らない（思想ロック）
  scores: AxisScore[];

  feedback: Feedback;

  // 本文は保存しない。非個人情報のみ。
  meta?: {
    charCount?: number;
    flags?: string[];
  };
};

/* ============================================================
   Storage
============================================================ */

export type StoredResult = ScoreResult;