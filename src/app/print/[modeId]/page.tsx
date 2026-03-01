"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { ScoreResult } from "@/domain/types/models";

const PRINT_KEY = "print_payload_v1";

type PrintPayload = {
  modeId: string;
  modeTitle: string;
  personaLabel: string;
  docType: string;
  docTypeLabel: string;
  text: string;
  result: ScoreResult;
};

type Range = { start: number; end: number };

export default function Page() {
  const router = useRouter();
  const params = useParams<{ modeId: string }>();
  const modeId = params?.modeId ?? "";

  const [payload, setPayload] = useState<PrintPayload | null>(null);
  const [downloading, setDownloading] = useState(false);

  const a4Ref = useRef<HTMLDivElement | null>(null);

  // payload 読み込み
  useEffect(() => {
    const raw = sessionStorage.getItem(PRINT_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as PrintPayload;
      setPayload(parsed);
    } catch {}
  }, []);

  const underlineRanges = useMemo((): Range[] => {
    if (!payload) return [];
    const text = payload.text;
    const len = text.length;

    const items = payload.result.feedback.redPenItems;

    const ranges: Range[] = [];
    let cursor = 0;

    for (const it of items) {
      const span = findSpanRobustFrom(text, it.quote, cursor);
      if (span.start >= 0 && span.end > span.start) {
        ranges.push(span);
        cursor = span.end;
        continue;
      }

      const span2 = findSpanRobustFrom(text, it.quote, 0);
      if (span2.start >= 0 && span2.end > span2.start) {
        ranges.push(span2);
        cursor = span2.end;
      }
    }

    return mergeRanges(ranges, len);
  }, [payload]);

  const annotatedBody = useMemo(() => {
    if (!payload) return "";
    return renderUnderlinedText(payload.text, underlineRanges);
  }, [payload, underlineRanges]);

  const grouped = useMemo(() => {
    if (!payload) return [];
    const map = new Map<string, { quote: string; priority: number; comments: string[] }>();

    for (const it of payload.result.feedback.redPenItems) {
      const key = (it.quote ?? "").trim();
      if (!key) continue;

      const cur = map.get(key);
      if (!cur) {
        map.set(key, {
          quote: key,
          priority: it.priorityRank ?? 999,
          comments: [it.comment],
        });
      } else {
        cur.priority = Math.min(cur.priority, it.priorityRank ?? 999);
        cur.comments.push(it.comment);
      }
    }

    return Array.from(map.values()).sort((a, b) => a.priority - b.priority);
  }, [payload]);

  if (!payload) {
    return <div style={{ padding: 40 }}>データが見つかりません。評価画面からやり直してください。</div>;
  }

  const { modeTitle, personaLabel, result, docTypeLabel } = payload;

  const downloadPdf = async () => {
    if (!a4Ref.current) return;

    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      // A4 DOM → Canvas
      const canvas = await html2canvas(a4Ref.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");

      // A4サイズ（mm）
      const pdf = new jsPDF("p", "mm", "a4");
      const pageW = 210;
      const pageH = 297;

      // 画像をA4にフィット
      const imgW = pageW;
      const imgH = (canvas.height * imgW) / canvas.width;

      if (imgH <= pageH) {
        pdf.addImage(imgData, "PNG", 0, 0, imgW, imgH);
      } else {
        // 1ページに収まらない場合：縦分割で複数ページ
        let y = 0;
        let page = 0;
        while (y < imgH) {
          if (page > 0) pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, -y, imgW, imgH);
          y += pageH;
          page += 1;
        }
      }

      const safeTitle = `${docTypeLabel}_${modeTitle}`.replace(/[\\/:*?"<>|]/g, "_");
      pdf.save(`${safeTitle}.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{ background: "#f0f0f0", padding: 20 }}>
      {/* 操作バー */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 10,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <button onClick={downloadPdf} style={pastelRedButton()} disabled={downloading}>
          {downloading ? "作成中…" : "ダウンロード"}
        </button>

        <button onClick={() => router.push(`/m/${modeId}`)} style={secondaryButton()}>
          評価画面へ戻る
        </button>
      </div>

      {/* A4本体（これをPDF化する） */}
      <div className="a4" ref={a4Ref}>
        <h1>赤ペンフォローシート</h1>

        <div className="meta">
          <div>モード：{modeTitle}</div>
          <div>文章：{docTypeLabel}</div>
          <div>評価者：{personaLabel}</div>
          <div>作成日：{new Date(result.createdAt).toLocaleString()}</div>
        </div>

        <hr />

        <h2>原文</h2>
        <div className="body-text">{annotatedBody}</div>

        <hr />

        <h2>赤ペン指摘</h2>
        {grouped.map((g, idx) => (
          <div key={idx} className="red-item">
            <div className="quote">「{g.quote}」</div>
            <ul className="comment-list">
              {g.comments.map((c, i) => (
                <li key={i} className="comment">
                  {c}
                </li>
              ))}
            </ul>
          </div>
        ))}

        <hr />

        <h2>総括コメント</h2>
        <ul>
          {result.feedback.improve.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      </div>

      <style jsx global>{`
        .a4 {
          width: 210mm;
          min-height: 297mm;
          background: white;
          padding: 24mm;
          margin: auto;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
          font-family: "Noto Sans JP", sans-serif;
        }
        .meta {
          font-size: 12px;
          margin-bottom: 12px;
        }
        .body-text {
          white-space: pre-wrap;
          line-height: 1.85;
          margin-bottom: 16px;
          font-size: 13.5px;
          color: #111;
        }

        /* ★本文中のフレーズ下線（PDFで安定） */
        .ul-red {
          text-decoration-line: underline;
          text-decoration-color: #c00000;
          text-decoration-thickness: 2px;
          text-underline-offset: 2px;
        }

        .red-item {
          margin-bottom: 16px;
        }
        .quote {
          color: #111;
          font-weight: 700;
          margin-bottom: 6px;
        }
        .comment-list {
          margin: 0;
          padding-left: 18px;
        }
        .comment-list .comment {
          color: #c00000;
          line-height: 1.7;
          margin-bottom: 4px;
        }
      `}</style>
    </div>
  );
}

/* ===== underline helpers ===== */

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function mergeRanges(ranges: Range[], textLen: number): Range[] {
  const cleaned = ranges
    .map((r) => ({
      start: clamp(r.start, 0, textLen),
      end: clamp(r.end, 0, textLen),
    }))
    .filter((r) => r.end > r.start)
    .sort((a, b) => a.start - b.start);

  const merged: Range[] = [];
  for (const r of cleaned) {
    const last = merged[merged.length - 1];
    if (!last) merged.push(r);
    else if (r.start <= last.end + 1) last.end = Math.max(last.end, r.end);
    else merged.push(r);
  }
  return merged;
}

function renderUnderlinedText(text: string, ranges: Range[]) {
  if (!ranges.length) return text;

  const out: React.ReactNode[] = [];
  let cursor = 0;

  ranges.forEach((r, i) => {
    if (r.start > cursor) out.push(<span key={`t-${i}-a`}>{text.slice(cursor, r.start)}</span>);
    out.push(
      <span key={`t-${i}-u`} className="ul-red">
        {text.slice(r.start, r.end)}
      </span>
    );
    cursor = r.end;
  });

  if (cursor < text.length) out.push(<span key="t-last">{text.slice(cursor)}</span>);
  return out;
}

function findSpanRobustFrom(text: string, quote: string, fromIndex: number): Range {
  const base = Math.max(0, fromIndex);
  const t = text.slice(base);
  const span = findSpanRobust(t, quote);
  if (span.start < 0) return span;
  return { start: span.start + base, end: span.end + base };
}

function findSpanRobust(text: string, quote: string): Range {
  const q = (quote ?? "").trim();
  if (!q) return { start: -1, end: -1 };

  const idx = text.indexOf(q);
  if (idx >= 0) return { start: idx, end: idx + q.length };

  const span2 = findSpanNoWs(text, q);
  if (span2.start >= 0) return span2;

  return { start: -1, end: -1 };
}

function removeWs(s: string) {
  return (s ?? "").replace(/\s+/g, "");
}

function buildNoWs(src: string) {
  const chars: string[] = [];
  const map: number[] = [];
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (/\s/.test(ch)) continue;
    chars.push(ch);
    map.push(i);
  }
  return { noWs: chars.join(""), map };
}

function findSpanNoWs(text: string, snippet: string): Range {
  const t = buildNoWs(text);
  const s = removeWs(snippet);
  if (!s) return { start: -1, end: -1 };

  const idx = t.noWs.indexOf(s);
  if (idx < 0) return { start: -1, end: -1 };

  const startOrig = t.map[idx];
  const endOrig = t.map[idx + s.length - 1] + 1;
  if (startOrig == null || endOrig == null || endOrig <= startOrig) {
    return { start: -1, end: -1 };
  }
  return { start: startOrig, end: endOrig };
}

/* ===== buttons ===== */

function pastelRedButton(): React.CSSProperties {
  return {
    padding: "10px 16px",
    borderRadius: 16,
    border: "1px solid rgba(200,0,0,0.18)",
    fontWeight: 900,
    cursor: "pointer",
    background: "linear-gradient(90deg, rgba(255,235,238,0.95), rgba(255,205,210,0.92))",
    color: "#8a1c1c",
    boxShadow: "0 10px 20px rgba(0,0,0,0.14)",
  };
}

function secondaryButton(): React.CSSProperties {
  return {
    padding: "10px 16px",
    borderRadius: 16,
    border: "1px solid rgba(0,0,0,0.2)",
    fontWeight: 800,
    cursor: "pointer",
    background: "white",
  };
}