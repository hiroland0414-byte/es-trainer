// src/domain/config/modes.ts
import { AXES } from "./axes";
import { PERSONAS } from "./personas";
import type { AxisId, ModeConfig, ModeId, PersonaConfig, PersonaId, DocType } from "@/domain/types/models";

type AxisOverride = Partial<Record<AxisId, { label?: string; description?: string }>>;

function buildPersona(personaId: PersonaId): PersonaConfig {
  const base = PERSONAS[personaId];
  return {
    personaId,
    label: base.label,
    style: base.style,
    priorityAxes: base.priorityAxes,
  };
}

function makeMode(
  modeId: ModeId,
  title: string,
  docType: DocType,
  personaIds: PersonaId[],
  axisOverride?: AxisOverride
): ModeConfig {
  const axes = (Object.keys(AXES) as AxisId[]).map((axisId) => {
    const base = AXES[axisId];
    const ov = axisOverride?.[axisId];
    return {
      axisId,
      label: ov?.label ?? base.label,
      description: ov?.description ?? base.description,
    };
  });

  const personas = personaIds.map((pid) => buildPersona(pid));

  // ★ ModeConfig.notices は必須
  const notices: string[] = [
    "※ 模範解答は出しません（構造を強くするため）。",
    "※ 本文は保存しません（分析結果のみ保存）。",
  ];

  return {
    modeId,
    title,
    docType,
    notices,
    axes,
    personas,
  };
}

export const MODES: Record<string, ModeConfig> = {
  // ============================================================
  // 病院：診療放射線技師｜志望動機
  // ============================================================
  hospital_rt_motivation_v1: makeMode(
    "hospital_rt_motivation_v1",
    "病院×診療放射線技師｜志望動機",
    "motivation",
    ["hospital_rt_head", "hospital_hr"],
    { fit: { label: "適合R" } }
  ),

  // ============================================================
  // 病院：看護師｜志望動機
  // ============================================================
  hospital_nurse_motivation_v1: makeMode(
    "hospital_nurse_motivation_v1",
    "病院×看護師｜志望動機",
    "motivation",
    ["hospital_nurse_head", "hospital_hr"],
    { fit: { label: "適合N" } }
  ),

  // ============================================================
  // 健診センター：志望動機 / 自己PR / ガクチカ（評価者は人事1名）
  // ============================================================
  checkup_center_motivation_v1: makeMode(
    "checkup_center_motivation_v1",
    "健診センター｜志望動機",
    "motivation",
    ["checkup_hr"],
    {
      clarity: {
        label: "わかりやすさ（説明）",
        description: "受診者に伝わる説明・案内の筋が通っている",
      },
      fit: { label: "適合（健診）" },
    }
  ),

  checkup_center_pr_v1: makeMode(
    "checkup_center_pr_v1",
    "健診センター｜自己PR",
    "self_pr",
    ["checkup_hr"],
    {
      clarity: {
        label: "わかりやすさ（強み）",
        description: "強みが構造的に提示されている",
      },
      specificity: {
        label: "具体性（経験）",
        description: "強みが具体的な経験に基づいている",
      },
      fit: { label: "適合（健診）" },
    }
  ),

  checkup_center_gakuchika_v1: makeMode(
    "checkup_center_gakuchika_v1",
    "健診センター｜ガクチカ",
    "gakuchika",
    ["checkup_hr"],
    {
      clarity: {
        label: "わかりやすさ（流れ）",
        description: "経験→工夫→成果の流れが明確",
      },
      logic: {
        label: "論理構造",
        description: "出来事が筋道立っている",
      },
      fit: { label: "適合（健診）" },
    }
  ),

  // ============================================================
  // 企業：技術系｜志望動機 / 自己PR / ガクチカ
  // ============================================================
  company_tech_motivation_v1: makeMode(
    "company_tech_motivation_v1",
    "企業×技術系｜志望動機",
    "motivation",
    ["company_tech_head", "company_field_service_head", "company_hr"],
    { fit: { label: "適合（技術）" } }
  ),

  company_tech_self_pr_v1: makeMode(
    "company_tech_self_pr_v1",
    "企業×技術系｜自己PR",
    "self_pr",
    ["company_tech_head", "company_field_service_head", "company_hr"],
    {
      clarity: { label: "わかりやすさ（強み）" },
      specificity: { label: "具体性（根拠）" },
      fit: { label: "適合（技術）" },
    }
  ),

  company_tech_gakuchika_v1: makeMode(
    "company_tech_gakuchika_v1",
    "企業×技術系｜ガクチカ",
    "gakuchika",
    ["company_tech_head", "company_field_service_head", "company_hr"],
    {
      clarity: { label: "わかりやすさ（流れ）" },
      logic: { label: "論理構造" },
      fit: { label: "適合（技術）" },
    }
  ),

  // ============================================================
  // 企業：営業系｜志望動機 / 自己PR / ガクチカ
  // ============================================================
  company_sales_motivation_v1: makeMode(
    "company_sales_motivation_v1",
    "企業×営業系｜志望動機",
    "motivation",
    ["company_sales_head", "company_hr"],
    { fit: { label: "適合（営業）" } }
  ),

  company_sales_self_pr_v1: makeMode(
    "company_sales_self_pr_v1",
    "企業×営業系｜自己PR",
    "self_pr",
    ["company_sales_head", "company_hr"],
    {
      clarity: { label: "わかりやすさ（強み）" },
      specificity: { label: "具体性（根拠）" },
      fit: { label: "適合（営業）" },
    }
  ),

  company_sales_gakuchika_v1: makeMode(
    "company_sales_gakuchika_v1",
    "企業×営業系｜ガクチカ",
    "gakuchika",
    ["company_sales_head", "company_hr"],
    {
      clarity: { label: "わかりやすさ（流れ）" },
      logic: { label: "論理構造" },
      fit: { label: "適合（営業）" },
    }
  ),
};