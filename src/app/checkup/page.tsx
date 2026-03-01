"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

type Q = "motivation" | "selfPR" | "gakuchika";

export default function Page() {
  const router = useRouter();
  const [selected, setSelected] = useState<Q | null>(null);

  const go = (q: Q) => {
    setSelected(q);

window.setTimeout(() => {
  if (q === "motivation") {
    router.push("/m/checkup_center_motivation_v1");
  }
  if (q === "selfPR") {
    router.push("/m/checkup_center_pr_v1");
  }
  if (q === "gakuchika") {
    router.push("/m/checkup_center_gakuchika_v1");
  }
  }, 140);
  };

  return (
    <main style={shellStyle()}>
      <div style={overlayStyle()} />

      <div style={cardStyle()}>
        <Logo />

        <Title>健診センター</Title>
        <Desc>受診者への説明・配慮の文脈で、文章構造を整えます</Desc>

        <div style={boxStyle()}>
          <div style={sectionTitleStyle()}>E.S.質問選択</div>

          <SelectButton
            label="志望動機"
            active={selected === "motivation"}
            onClick={() => go("motivation")}
          />
          <SelectButton
            label="自己PR"
            active={selected === "selfPR"}
            onClick={() => go("selfPR")}
          />
          <SelectButton
            label="ガクチカ"
            active={selected === "gakuchika"}
            onClick={() => go("gakuchika")}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <RightHalfButton onClick={() => router.push("/")}>
            選択へ戻る
          </RightHalfButton>
        </div>
      </div>
    </main>
  );
}

/* UI */

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
        fontSize: 20,
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

function SelectButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        borderRadius: 18,
        padding: "14px 12px",
        border: "1px solid rgba(0,0,0,0.14)",
        background: active
          ? "rgba(22, 170, 120, 0.18)"
          : "rgba(255,255,255,0.92)",
        fontWeight: 900,
        color: "#167a52",
        cursor: "pointer",
        marginTop: 10,
        boxShadow: "0 10px 18px rgba(0,0,0,0.08)",
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
  return (
    <button
      onClick={onClick}
      style={{
        width: "50%",
        borderRadius: 18,
        padding: "12px 12px",
        border: "1px solid rgba(0,0,0,0.14)",
        background: "rgba(255,255,255,0.90)",
        fontWeight: 900,
        color: "#167a52",
        cursor: "pointer",
        marginTop: 12,
        textAlign: "center",
      }}
    >
      {children}
    </button>
  );
}

function Footnote({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 10, fontSize: 12, opacity: 0.78, lineHeight: 1.6 }}>
      {children}
    </div>
  );
}

function sectionTitleStyle(): React.CSSProperties {
  return { fontWeight: 900, color: "#167a52", marginTop: 6, marginBottom: 8 };
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

function shellStyle(): React.CSSProperties {
  return {
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
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, "Noto Sans JP", sans-serif',
  };
}

function overlayStyle(): React.CSSProperties {
  return {
    position: "fixed",
    inset: 0,
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.10))",
    pointerEvents: "none",
  };
}

function cardStyle(): React.CSSProperties {
  return {
    width: 390,
    borderRadius: 30,
    padding: 18,
    paddingTop: 6,
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.94), rgba(220,255,220,0.88))",
    boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
    backdropFilter: "blur(6px)",
    border: "1px solid rgba(255,255,255,0.6)",
    position: "relative",
  };
}
