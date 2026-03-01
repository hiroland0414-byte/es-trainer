"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

type TopMode = { key: "hospital" | "checkup" | "company"; label: string; route: string };

const MODES: TopMode[] = [
  { key: "hospital", label: "病院", route: "/hospital" },
  { key: "checkup", label: "健診センター", route: "/checkup" },
  { key: "company", label: "企業", route: "/company" },
];

export default function Page() {
  const router = useRouter();
  const [selected, setSelected] = useState<TopMode["key"] | null>(null);

  const go = (m: TopMode) => {
    setSelected(m.key);
    // “色が変わったのを見せてから”遷移
    window.setTimeout(() => router.push(m.route), 220);
  };

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
        paddingTop: 18, // 背景を上に5mm程度見せる
        paddingLeft: 18, // 背景を左右に5mm程度見せる
        paddingRight: 18,
        paddingBottom: 20,
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Noto Sans JP", sans-serif',
      }}
    >
      {/* 背景ベール */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.10))",
          pointerEvents: "none",
        }}
      />

      {/* 白枠（周囲に背景が見えるように margin で確保） */}
      <div
        style={{
          width: 390,
          borderRadius: 30,
          padding: 18,
          paddingTop: 6,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.94), rgba(220,255,220,0.88))",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          backdropFilter: "blur(6px)",
          border: "1px solid rgba(255,255,255,0.6)",
        }}
      >
        {/* ロゴ（左右いっぱい） */}
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
            alt="K-career"
            style={{
              width: "100%",
              height: 52,
              objectFit: "contain",
              display: "block",
              padding: "2px 0",
            }}
          />
        </div>

        <div style={{ textAlign: "center", fontSize: 20, fontWeight: 900, color: "#167a52", marginTop: 2 }}>
          E.S.作成基礎トレーナー
        </div>

        <div
          style={{
            textAlign: "center",
            fontSize: 13,
            fontWeight: 700,
            color: "rgba(22,122,82,0.92)",
            marginTop: 6,
            marginBottom: 14,
          }}
        >
          比較ではなく、視点を切り替えて深く考える
        </div>

        {/* モードボタン：初期白／選択で色 */}
        <div style={{ display: "grid", gap: 14 }}>
          {MODES.map((m) => {
            const active = selected === m.key;
            return (
              <button
                key={m.key}
                onClick={() => go(m)}
                style={{
                  width: "100%",
                  padding: "18px 0",
                  borderRadius: 22,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 17,
                  fontWeight: 900,
                  background: active
                    ? "linear-gradient(90deg, rgba(20,184,166,0.95), rgba(34,197,94,0.95))"
                    : "linear-gradient(90deg, rgba(255,255,255,0.90), rgba(240,255,240,0.85))",
                  color: active ? "white" : "#167a52",
                  boxShadow: active
                    ? "0 12px 26px rgba(0,0,0,0.22)"
                    : "0 10px 22px rgba(0,0,0,0.14)",
                  transition: "all 160ms ease",
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 18,
            padding: "14px",
            borderRadius: 16,
            background: "rgba(22,122,82,0.10)",
            border: "1px solid rgba(22,122,82,0.18)",
            fontSize: 12,
            lineHeight: 1.75,
            color: "rgba(22,90,60,0.95)",
            textAlign: "center",
          }}
        >
          このアプリは、E.S.（自己PR・ガクチカ・志望動機）を
          <br />
          「構造」から強くするためのトレーニングです。
          <br />
          模範解答は出さず、改善の方向だけを明確にします。
        </div>
      </div>
    </main>
  );
}
