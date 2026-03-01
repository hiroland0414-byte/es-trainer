"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

type Pick = "rt" | "nurse" | null;

export default function Page() {
  const router = useRouter();
  const [selected, setSelected] = useState<Pick>(null);

  const go = (p: Exclude<Pick, null>) => {
    setSelected(p);
    window.setTimeout(() => {
      router.push(`/hospital/${p}`); // ★ 中間ページへ（文章種別選択）
    }, 180);
  };

  return (
    <Shell>
      <Card>
        <Logo />
        <Title>病院</Title>
        <Desc>
          職種を選んでください。
          <br />
          （選択したら自動で次へ進みます）
        </Desc>

        <SectionTitle>職種</SectionTitle>

        <div style={boxStyle()}>
          <SelectButton
            label="診療放射線技師"
            active={selected === "rt"}
            onClick={() => go("rt")}
          />
          <SelectButton
            label="看護師"
            active={selected === "nurse"}
            onClick={() => go("nurse")}
          />
        </div>

        <RightHalfButton onClick={() => router.push("/")}>選択へ戻る</RightHalfButton>

        <Footnote>※ 「次へ」ボタンはありません。選択した瞬間に進みます。</Footnote>
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
        paddingTop: 18, // ≒5mm
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