"use client";

import React, { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { MODES } from "@/domain/config/modes";
import { setDocType } from "@/lib/usage/docTypeSession";
import type { DocType } from "@/domain/types/docType";
import { DOC_LABEL } from "@/domain/types/docType";

type Profession = "rt" | "nurse";

function resolveModeIdForHospital(profession: Profession): string | null {
  // MODES のキーを列挙して、病院×職種に合うものを探す
  // まずは従来の想定（hospital_rt_ / hospital_nurse_）を優先する
  const keys = Object.keys(MODES ?? {}) as string[];

  const prefix = profession === "rt" ? "hospital_rt_" : "hospital_nurse_";

  // 1) prefix一致の最初のキー
  const k1 = keys.find((k) => k.startsWith(prefix));
  if (k1) return k1;

  // 2) もし命名が違っていても拾えるように保険：含まれる文字で探す
  const hint = profession === "rt" ? "rt" : "nurse";
  const k2 = keys.find((k) => k.includes("hospital") && k.includes(hint));
  if (k2) return k2;

  // 見つからない
  return null;
}

export default function Page() {
  const router = useRouter();
  const params = useParams<{ profession: string }>();

  const profession = (params.profession as Profession) ?? "rt";

  // ★ここが重要：MODES から実在する modeId を解決する
  const modeId = useMemo(() => resolveModeIdForHospital(profession), [profession]);

  const [selected, setSelected] = useState<DocType | null>(null);

  const titleProfession = useMemo(() => {
    if (profession === "rt") return "診療放射線技師";
    if (profession === "nurse") return "看護師";
    return "";
  }, [profession]);

  const go = (docType: DocType) => {
    if (!modeId) return; // 見つからない場合は何もしない（下で案内表示）
    setSelected(docType);
    setDocType(docType);
    window.setTimeout(() => {
      router.push(`/m/${modeId}`); // ★実在する modeId を渡す
    }, 180);
  };

  // modeId が見つからない場合は、次へ行かせない（原因が分かる表示）
  if (!modeId) {
    return (
      <Shell>
        <Card>
          <Logo />
          <Title>{`病院：${titleProfession}`}</Title>
          <Desc>
            モード設定（MODES）に対応する modeId が見つかりません。
            <br />
            modes.ts のキー名を確認してください。
          </Desc>

          <div style={boxStyle()}>
            <div style={{ fontSize: 12, lineHeight: 1.7, opacity: 0.85 }}>
              期待しているキーの例：
              <br />
              ・hospital_rt_...
              <br />
              ・hospital_nurse_...
            </div>
          </div>

          <RightHalfButton onClick={() => router.push("/hospital")}>職種選択へ</RightHalfButton>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell>
      <Card>
        <Logo />
        <Title>{`病院：${titleProfession}`}</Title>
        <Desc>
          次に、文章の種類を選びます。
          <br />
          （選んだら自動で入力画面へ進みます）
        </Desc>

        <SectionTitle>E.S.質問選択</SectionTitle>

        <div style={boxStyle()}>
          <SelectButton
            label={DOC_LABEL.motivation}
            active={selected === "motivation"}
            onClick={() => go("motivation")}
          />
          <SelectButton
            label={DOC_LABEL.self_pr}
            active={selected === "self_pr"}
            onClick={() => go("self_pr")}
          />
          <SelectButton
            label={DOC_LABEL.gakuchika}
            active={selected === "gakuchika"}
            onClick={() => go("gakuchika")}
          />
        </div>

        <RightHalfButton onClick={() => router.push("/hospital")}>職種選択へ</RightHalfButton>

        <Footnote>
          ※ 「次へ」ボタンはありません。選択した瞬間に進みます。
          <br />
          ※ 入力内容は保存しません（分析結果のみ保存）。
        </Footnote>
      </Card>
    </Shell>
  );
}

/* UI（m/[modeId] と同系） */
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
  return (
    <div
      style={{
        textAlign: "center",
        fontSize: 18,
        fontWeight: 900,
        color: "#167a52",
        marginTop: 2,
      }}
    >
      {children}
    </div>
  );
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
  return (
    <div style={{ fontWeight: 900, color: "#167a52", marginTop: 6, marginBottom: 8 }}>
      {children}
    </div>
  );
}

function boxStyle(): React.CSSProperties {
  return {
    background: "rgba(255,255,255,0.78)",
    borderRadius: 14,
    padding: 10,
    border: "1px solid rgba(0,0,0,0.10)",
    display: "grid",
    gap: 10,
  };
}

function SelectButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        height: 52,
        borderRadius: 18,
        border: "1px solid rgba(0,0,0,0.12)",
        background: active ? "rgba(22,122,82,0.16)" : "rgba(255,255,255,0.92)",
        fontWeight: 900,
        fontSize: 16,
        color: "#167a52",
        cursor: "pointer",
        transition: "background 120ms ease",
      }}
    >
      {label}
    </button>
  );
}

function RightHalfButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  const [pressed, setPressed] = React.useState(false);

  const baseBg =
    "linear-gradient(90deg, rgba(255,210,150,0.90), rgba(255,185,120,0.90))";
  const pressedBg =
    "linear-gradient(90deg, rgba(255,210,150,0.55), rgba(255,185,120,0.55))";

  return (
    <button
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        width: "50%",
        borderRadius: 18,
        padding: "12px 12px",
        border: "1px solid rgba(0,0,0,0.10)",
        background: pressed ? pressedBg : baseBg,
        fontWeight: 900,
        color: "#0b3aa6", // 青で統一
        cursor: "pointer",
        marginTop: 12,
        textAlign: "center",
        boxShadow: "0 8px 18px rgba(0,0,0,0.14)",
        transform: pressed ? "scale(0.98)" : "scale(1)",
        transition: "transform 120ms ease",
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