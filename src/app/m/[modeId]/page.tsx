// src/app/m/[modeId]/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MODES } from "@/domain/config/modes";
import { evaluateText } from "@/domain/engine";
import { saveResult } from "@/domain/storage/localStorageRepo";
import type { DocType, ModeConfig, PersonaId, ScoreResult } from "@/domain/types/models";
import { RadarCard } from "@/app/_components/RadarCard";
import { getDocType } from "@/lib/usage/docTypeSession";

const PRINT_KEY = "print_payload_v1";

export default function Page() {
  const router = useRouter();
  const params = useParams<{ modeId: string }>();
  const modeId = (params?.modeId ?? "") as string;

  const mode = useMemo<ModeConfig | null>(() => {
    return (MODES as Record<string, ModeConfig>)[modeId] ?? null;
  }, [modeId]);

  // mode が不正なら、戻れる画面だけ出す
  if (!mode) {
    return (
      <Shell>
        <Card>
          <Logo />
          <Title>モードが見つかりません</Title>
          <Desc>URL の modeId が不正です。E.S.質問選択へ戻ってください。</Desc>
          <RightHalfButton onClick={() => router.push("/")}>トップへ戻る</RightHalfButton>
        </Card>
      </Shell>
    );
  }

  // docType（選択ページで setDocType 済み）
  const docType = useMemo<DocType>(() => {
    const dt = getDocType();
    // 念のため：mode.docType をフォールバック
    return (dt ?? mode.docType) as DocType;
  }, [mode.docType]);

  // --------------------------
  // ★下書き保持（mode×docType ごと）
  // --------------------------
  const DRAFT_KEY = `draft_text_${mode.modeId}_${docType}`;
  const DRAFT_PERSONA_KEY = `draft_persona_${mode.modeId}_${docType}`;

  const [text, setText] = useState(() => {
    if (typeof window === "undefined") return "";
    return sessionStorage.getItem(DRAFT_KEY) ?? "";
  });

  const [personaId, setPersonaId] = useState<PersonaId>(() => {
    if (typeof window === "undefined") return mode.personas[0].personaId;
    const saved = sessionStorage.getItem(DRAFT_PERSONA_KEY) as PersonaId | null;
    return saved ?? mode.personas[0].personaId;
  });

  const personaLabel = mode.personas.find((p) => p.personaId === personaId)?.label ?? "";

  const [result, setResult] = useState<ScoreResult | null>(null);
  const [evalActive, setEvalActive] = useState(false);

  const questionRoute = guessQuestionRoute(mode.modeId);

  const clearDraftText = () => {
    setText("");
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {}
  };

  const goQuestionSelect = () => {
    // ★質問選択に戻る時は自動クリア（仕様）
    clearDraftText();
    setResult(null);
    router.push(questionRoute);
  };

  const goA4 = () => {
    if (!result) return;
    const payload = {
      modeId: mode.modeId,
      modeTitle: mode.title,
      personaLabel,
      text: normalizeForPrint(text),
      result,
    };
    try {
      sessionStorage.setItem(PRINT_KEY, JSON.stringify(payload));
      router.push(`/print/${mode.modeId}`);
    } catch {
      router.push(`/print/${mode.modeId}`);
    }
  };

  const runEvaluate = () => {
    setEvalActive(true);
    window.setTimeout(() => {
      const r = evaluateText(text, mode, personaId);
      setResult(r);
      saveResult(r);
      setEvalActive(false);
    }, 220);
  };

  // タイトルは docType だけ表示（重複防止）
  const docTitle = useMemo(() => docTypeLabel(docType), [docType]);

  return (
    <Shell>
      <Card>
        <Logo />
        <Title>{docTitle}</Title>

        <Desc>
          模範解答は出しません（あなたの文章を強くするため）。
          <br />
          本文は保存しません（分析結果のみ保存）。
        </Desc>

        <SectionTitle>評価者</SectionTitle>
        <div style={boxStyle()}>
          <select
            value={personaId}
            onChange={(e) => {
              const v = e.target.value as PersonaId;
              setPersonaId(v);
              try {
                sessionStorage.setItem(DRAFT_PERSONA_KEY, v);
              } catch {}
            }}
            style={selectStyle()}
          >
            {mode.personas.map((p) => (
              <option key={p.personaId} value={p.personaId}>
                {p.label}
              </option>
            ))}
          </select>
          <div style={{ marginTop: 6, fontSize: 12, opacity: 0.82, lineHeight: 1.6 }}>
            視点が変わると、同じ文章でも“刺さる順番”が変わります。
          </div>
        </div>

        <SectionTitle>入力</SectionTitle>
        <textarea
          value={text}
          onChange={(e) => {
            const v = e.target.value;
            setText(v);
            try {
              sessionStorage.setItem(DRAFT_KEY, v);
            } catch {}
          }}
          placeholder="文章を貼り付け（本文は保存しません）"
          style={textareaStyle()}
        />

        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <button onClick={clearDraftText} style={miniButtonStyle()}>
            入力をクリア
          </button>
          <button onClick={goQuestionSelect} style={miniButtonStyle()}>
            E.S.質問選択へ
          </button>
          <div style={{ flex: 1 }} />
        </div>

        <ActionButton active={evalActive} onClick={runEvaluate}>
          評価（構造チェック）
        </ActionButton>

        {result && (
          <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
            <RadarCard mode={mode} result={result} />

            <div style={resultCardStyle()}>
              <div style={{ fontWeight: 900, color: "#167a52", marginBottom: 8 }}>
                軸別（1～5／未構造のみ0）
              </div>

              <div style={{ display: "grid", gap: 8 }}>
                {result.scores.map((sc) => (
                  <div key={sc.axisId} style={axisRowStyle()}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <div style={{ fontWeight: 900 }}>
                        {mode.axes.find((a) => a.axisId === sc.axisId)?.label}
                      </div>
                      <div style={{ fontWeight: 900, fontSize: 18 }}>{sc.score}</div>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.6, opacity: 0.85 }}>
                      {sc.reason}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                <FeedbackSection title="良かったところ" items={result.feedback.good} />
                <FeedbackSection title="改善したいところ" items={result.feedback.improve} />
                <FeedbackSection title="次の一手" items={result.feedback.next} />
              </div>

              <div style={{ marginTop: 12 }}>
                <button onClick={goA4} style={a4ButtonStyle()}>
                  赤ペンPDFを表示（A4）
                </button>
                <div style={{ marginTop: 6, fontSize: 12, opacity: 0.78, lineHeight: 1.6 }}>
                  ※ 表示後に「ダウンロード」で端末に保存できます
                </div>
              </div>
            </div>
          </div>
        )}

        <Footnote>
          ※ 総合点・ランキングは出しません。
          <br />
          ※ A4 出力は「ダウンロード」です。
        </Footnote>
      </Card>
    </Shell>
  );
}

/* -----------------------------
 * helpers
 * ----------------------------*/
function normalizeForPrint(raw: string) {
  return (raw ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** modeId から「E.S.質問選択」ページを推定 */
function guessQuestionRoute(modeId: string) {
  // hospital
  if (modeId.startsWith("hospital_rt_")) return "/hospital/rt";
  if (modeId.startsWith("hospital_nurse_")) return "/hospital/nurse";

  // company
  if (modeId.startsWith("company_tech_")) return "/company/tech";
  if (modeId.startsWith("company_sales_")) return "/company/sales";

  // checkup
  if (modeId.startsWith("checkup_")) return "/checkup";

  return "/";
}

function docTypeLabel(dt: DocType) {
  if (dt === "motivation") return "志望動機";
  if (dt === "self_pr") return "自己PR";
  return "ガクチカ";
}

/* -----------------------------
 * UI Parts（既存テイスト踏襲）
 * ----------------------------*/
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundImage: "url('/bg.jpeg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        paddingTop: 18,
        paddingLeft: 18,
        paddingRight: 18,
        paddingBottom: 20,
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Noto Sans JP", sans-serif',
      }}
    >
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.10))",
          pointerEvents: "none",
        }}
      />
      {children}
    </main>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: 390,
        borderRadius: 30,
        padding: 18,
        paddingTop: 6,
        background: "linear-gradient(180deg, rgba(255,255,255,0.94), rgba(220,255,220,0.88))",
        boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        backdropFilter: "blur(6px)",
        border: "1px solid rgba(255,255,255,0.6)",
        position: "relative",
      }}
    >
      {children}
    </div>
  );
}

function Logo() {
  return (
    <div
      style={{
        width: "100%",
        borderRadius: 14,
        overflow: "hidden",
        marginBottom: 8,
        background: "rgba(255,255,255,0.55)",
      }}
    >
      <img
        src="/logo.png"
        alt="logo"
        style={{
          width: "100%",
          height: 52,
          objectFit: "contain",
          display: "block",
          padding: "2px 0",
        }}
      />
    </div>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return <div style={{ textAlign: "center", fontSize: 18, fontWeight: 900, color: "#167a52", marginTop: 2 }}>{children}</div>;
}

function Desc({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        textAlign: "center",
        fontSize: 12,
        fontWeight: 700,
        color: "rgba(22,122,82,0.92)",
        marginTop: 6,
        marginBottom: 12,
        lineHeight: 1.7,
      }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontWeight: 900, color: "#167a52", marginTop: 6, marginBottom: 8 }}>{children}</div>;
}

function boxStyle(): React.CSSProperties {
  return {
    background: "rgba(255,255,255,0.78)",
    borderRadius: 14,
    padding: 10,
    border: "1px solid rgba(0,0,0,0.10)",
    marginBottom: 10,
  };
}

function selectStyle(): React.CSSProperties {
  return {
    width: "100%",
    height: 44,
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.15)",
    padding: "0 12px",
    fontWeight: 800,
    color: "#0e6b49",
    background: "rgba(255,255,255,0.96)",
  };
}

function textareaStyle(): React.CSSProperties {
  return {
    width: "100%",
    minHeight: 120,
    resize: "vertical",
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.15)",
    padding: 12,
    fontSize: 14,
    lineHeight: 1.7,
    background: "rgba(255,255,255,0.92)",
    outline: "none",
  };
}

function miniButtonStyle(): React.CSSProperties {
  return {
    height: 36,
    padding: "0 12px",
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "rgba(255,255,255,0.85)",
    fontWeight: 800,
    color: "#167a52",
    cursor: "pointer",
  };
}

function ActionButton({
  children,
  onClick,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!!active}
      style={{
        width: "100%",
        height: 54,
        marginTop: 12,
        borderRadius: 18,
        border: "1px solid rgba(0,0,0,0.10)",
        background: active
          ? "rgba(22,122,82,0.25)"
          : "linear-gradient(90deg, rgba(22,122,82,0.16), rgba(22,122,82,0.10))",
        fontWeight: 900,
        fontSize: 16,
        color: "#167a52",
        cursor: active ? "default" : "pointer",
      }}
    >
      {active ? "処理中…" : children}
    </button>
  );
}

function resultCardStyle(): React.CSSProperties {
  return {
    background: "rgba(255,255,255,0.76)",
    borderRadius: 18,
    padding: 12,
    border: "1px solid rgba(0,0,0,0.10)",
  };
}

function axisRowStyle(): React.CSSProperties {
  return {
    background: "rgba(255,255,255,0.85)",
    borderRadius: 14,
    padding: 10,
    border: "1px solid rgba(0,0,0,0.08)",
  };
}

function FeedbackSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div style={{ background: "rgba(230,255,245,0.65)", borderRadius: 14, padding: 10 }}>
      <div style={{ fontWeight: 900, color: "#0f6b49", marginBottom: 6 }}>{title}</div>
      {items.length === 0 ? (
        <div style={{ fontSize: 12, opacity: 0.75 }}>（該当なし）</div>
      ) : (
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7, fontSize: 13 }}>
          {items.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function a4ButtonStyle(): React.CSSProperties {
  return {
    width: "100%",
    height: 52,
    borderRadius: 999,
    border: "1px solid rgba(200,0,0,0.18)",
    background: "linear-gradient(90deg, rgba(255,235,238,0.95), rgba(255,205,210,0.92))",
    fontWeight: 900,
    fontSize: 16,
    color: "#8a1c1c",
    cursor: "pointer",
  };
}

function RightHalfButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "50%",
        height: 46,
        borderRadius: 999,
        border: "1px solid rgba(0,0,0,0.12)",
        background: "rgba(255,255,255,0.82)",
        fontWeight: 900,
        color: "#167a52",
        marginTop: 14,
        marginLeft: "auto",
        display: "block",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function Footnote({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 10, fontSize: 11, opacity: 0.72, textAlign: "center", lineHeight: 1.6 }}>
      {children}
    </div>
  );
}