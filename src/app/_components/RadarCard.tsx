"use client";

import React, { useMemo } from "react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import type { ModeConfig, ScoreResult } from "@/domain/types/models";

type Props = {
  mode: ModeConfig;
  result: ScoreResult;
};

export function RadarCard({ mode, result }: Props) {
  const data = useMemo(() => {
    return result.scores.map((s) => {
      const axis = mode.axes.find((a) => a.axisId === s.axisId);
      const label = axis?.label ?? String(s.axisId);
      return {
        subject: shortenLabel(label),
        value: s.score,
      };
    });
  }, [mode, result]);

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.85)",
        borderRadius: 18,
        padding: 14,
        border: "1px solid rgba(0,0,0,0.08)",
      }}
    >
      <div style={{ fontWeight: 900, color: "#167a52", marginBottom: 8 }}>
        構造レーダー（補助）
      </div>

      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          <RadarChart data={data} outerRadius="80%">
            <PolarGrid />

            {/* 角度軸：ラベル欠け対策で短縮 */}
            <PolarAngleAxis
              dataKey="subject"
              tick={{
                fontSize: 12,
                fill: "#145c3f",
                fontWeight: 700,
              }}
            />

            {/* 数値軸：0〜5固定、整数のみ、表示の傾き対策 */}
            <PolarRadiusAxis
              angle={90}
              domain={[0, 5]}
              tickCount={6}
              allowDecimals={false}
              tickFormatter={(v) => String(v)}
              tick={{
                fontSize: 10,
                fill: "#6a6a6a",
              }}
              axisLine={false}
            />

            <Radar
              dataKey="value"
              stroke="#1ba97a"
              fill="#1ba97a"
              fillOpacity={0.35}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ fontSize: 12, marginTop: 6, opacity: 0.75 }}>
        レーダーは見取り図。主役は下の文章フィードバックです（総合点は出しません）。
      </div>
    </div>
  );
}

/** 320pxでも欠けにくいように短縮（全角想定で控えめ） */
function shortenLabel(label: string) {
  const s = (label ?? "").trim();
  if (!s) return "";
  if (s.length <= 5) return s;
  return s.slice(0, 5);
}
