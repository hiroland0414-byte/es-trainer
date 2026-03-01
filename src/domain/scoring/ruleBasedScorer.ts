// src/domain/scoring/ruleBasedScorer.ts
import type {
  AxisId,
  AxisScore,
  DocType,
  Feedback,
  ModeId,
  PersonaId,
  RedPenItem,
  ScoreResult,
  ScoreValue,
} from "@/domain/types/models";

/**
 * ルールベース（構造兆候検出）スコアラー
 * - 0点は「未構造のみ」
 * - それ以外は1〜5
 * - 合計点は作らない
 * - priorityAxes により「改善点/次の一手/赤ペン」の刺す順を変える（評価者視点シミュレーター）
 * - 赤ペンは本文引用付き（印刷/A4のために start/end を返す）
 */
export function scoreText(
  modeId: ModeId,
  raw: string,
  personaId: PersonaId,
  priorityAxes: AxisId[],
  docType: DocType
): ScoreResult {
  const text = normalize(raw);
  const createdAt = Date.now();

  const meta = {
    charCount: text.length,
    flags: [`persona:${personaId}`, `docType:${docType}`] as string[],
  };

  const unstructured = isUnstructured(text, docType);
  if (unstructured) meta.flags.push("unstructured");

  const s = detectSignals(text, modeId);

  let scores: AxisScore[] = ([
    "clarity",
    "specificity",
    "logic",
    "contribution",
    "fit",
  ] as AxisId[]).map((axisId) => scoreAxis(axisId, s, unstructured, docType));

  // 文字数不足は「少し下げる」（未構造0は触らない）
  const minChars = minCharsByDocType(docType);
  if (!unstructured && minChars > 0 && text.length < minChars) {
    meta.flags.push(`minChars:${minChars}`, "short");
    scores = applyShortPenalty(scores);
  }

  const feedbackBase = buildFeedbackBase(
    text,
    scores,
    s,
    unstructured,
    modeId,
    priorityAxes,
    personaId,
    docType
  );

  const feedback = applyPersonaTone(feedbackBase, personaId);

  return { createdAt, modeId, scores, feedback, meta };
}

/* ============================================================
   normalize / unstructured
============================================================ */

function normalize(raw: string): string {
  return (raw ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function minCharsByDocType(docType: DocType): number {
  if (docType === "motivation") return 300;
  if (docType === "self_pr") return 160;
  return 160; // gakuchika
}

function isUnstructured(text: string, docType: DocType): boolean {
  // 0点は「骨格ゼロ」のみ（短文=即0にはしない）
  if (text.length < 12) return true;

  const punct = (text.match(/[。！？]/g) ?? []).length;
  const isVeryLongNoPunct = punct === 0 && text.length >= 60;
  if (isVeryLongNoPunct) return true;

  // docType別に最低限の核キュー
  const coreRe =
    docType === "motivation"
      ? /(志望|目指|したい|希望|理由|なぜなら|きっかけ|背景|貢献|活か|貴院|貴社|御社|理念|特徴)/
      : docType === "self_pr"
      ? /(強み|得意|活か|経験|取り組み|工夫|改善|具体|例えば|結果)/
      : /(取り組み|力を入れ|工夫|課題|改善|結果|学び|具体|例えば)/;

  if (!coreRe.test(text)) return true;
  return false;
}

/* ============================================================
   signals
============================================================ */

type Signals = {
  charCount: number;
  sentenceCount: number;
  paragraphCount: number;
  hasConclusionCue: boolean;
  hasReasonCue: boolean;
  hasExampleCue: boolean;
  hasContributionCue: boolean;
  hasFitCue: boolean;
  numberCount: number;
  hasQuantifier: boolean;
  hasActionVerbs: boolean;
  connectiveCount: number;
  contrastCount: number;
  causalCount: number;
  domainKeywordsHit: number;
};

function detectSignals(text: string, modeId: ModeId): Signals {
  const sentences = splitSentences(text);
  const paragraphs = text.split("\n").filter((l) => l.trim().length > 0);

  const hasConclusionCue =
    /志望します|志望いたします|志望する|目指します|したいと考え|希望します|強みは|私の強み|力を入れたことは/.test(
      text
    );

  const hasReasonCue =
    /なぜなら|理由は|背景は|きっかけ|きっかけは|のため|からです/.test(text);

  const hasExampleCue =
    /例えば|具体的に|たとえば|経験|取り組み|実習|行い|実施|改善した|工夫した/.test(
      text
    );

  const hasContributionCue = /貢献|役立て|活かし|価値|寄与|サポート|提供/.test(text);

  const hasFitCue = /貴院|貴社|御社|貴センター|理念|方針|特徴|強み|取り組み/.test(
    text
  );

  const numberCount = (text.match(/[0-9０-９]/g) ?? []).length;

  const hasQuantifier =
    /(毎週|毎日|週に|月に|回|名|人|件|％|パーセント|ヶ月|か月|年間|半年)/.test(
      text
    );

  const hasActionVerbs =
    /(改善|提案|実施|分析|検証|計画|工夫|整理|調整|連携|作成|運用)/.test(text);

  const connectiveCount =
    (text.match(
      /(また|さらに|一方で|しかし|そして|そのため|つまり|したがって|結果として)/g
    ) ?? []).length;

  const contrastCount = (text.match(/(しかし|一方で)/g) ?? []).length;

  const causalCount =
    (text.match(/(そのため|したがって|結果として|だから|ため)/g) ?? []).length;

  const domainKeywordsHit = countDomainKeywords(text, modeId);

  return {
    charCount: text.length,
    sentenceCount: sentences.length,
    paragraphCount: paragraphs.length,
    hasConclusionCue,
    hasReasonCue,
    hasExampleCue,
    hasContributionCue,
    hasFitCue,
    numberCount,
    hasQuantifier,
    hasActionVerbs,
    connectiveCount,
    contrastCount,
    causalCount,
    domainKeywordsHit,
  };
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[。！？])\s*/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function countDomainKeywords(text: string, modeId: ModeId): number {
  const dict: Record<string, RegExp> = {
    hospital_rt:
      /(放射線|撮影|検査|画像|CT|MRI|X線|被ばく|線量|安全管理|PACS|RIS|治療)/g,
    hospital_nurse:
      /(看護|ケア|患者|観察|説明|安全|安心|多職種|チーム医療|傾聴|感染)/g,
    checkup: /(健診|受診者|説明|案内|待ち時間|配慮|接遇|精度管理)/g,
    company_tech: /(開発|設計|検証|分析|改善|品質|要件|実装|データ|再現性)/g,
    company_sales:
      /(提案|顧客|課題|価値|関係構築|ヒアリング|導入|運用|調整|折衝)/g,
  };

  const key = modeId.startsWith("hospital_rt")
    ? "hospital_rt"
    : modeId.startsWith("hospital_nurse")
    ? "hospital_nurse"
    : modeId.startsWith("checkup_center")
    ? "checkup"
    : modeId.startsWith("company_tech")
    ? "company_tech"
    : modeId.startsWith("company_sales")
    ? "company_sales"
    : "";

  const re = key ? dict[key] : null;
  if (!re) return 0;

  const hits = text.match(re);
  return hits ? Math.min(hits.length, 10) : 0;
}

/* ============================================================
   scoring per axis
============================================================ */

function clampScore(x: number): ScoreValue {
  if (x <= 0) return 0;
  if (x >= 5) return 5;
  return x as ScoreValue;
}

function applyShortPenalty(scores: AxisScore[]): AxisScore[] {
  // 文字数不足は「少し下げる」：各軸 -1（下限1、未構造0はそのまま）
  return scores.map((sc) => {
    if (sc.score === 0) return sc;
    const next = Math.max(1, Number(sc.score) - 1);
    return { ...sc, score: clampScore(next) };
  });
}

function scoreAxis(
  axisId: AxisId,
  s: Signals,
  unstructured: boolean,
  docType: DocType
): AxisScore {
  if (unstructured) {
    return {
      axisId,
      score: 0,
      reason:
        "文章の骨格（結論・理由・具体）が未成立のため、まず構造づくりが必要です。",
    };
  }

  let score = 1;
  let reason = "";

  if (axisId === "clarity") {
    const parts = [
      s.hasConclusionCue,
      s.hasReasonCue,
      s.hasExampleCue,
      s.hasContributionCue || s.hasFitCue,
    ].filter(Boolean).length;

    score = 1 + parts; // 1〜5
    if (s.paragraphCount >= 2) score += 1;
    score = Math.min(score, 5);

    reason =
      score >= 4
        ? "結論→理由→具体の流れが見え、読み手が迷いにくいです。"
        : docType === "motivation"
        ? "結論（志望理由）→理由→具体の橋が弱く、途中で迷いやすいです。"
        : "結論→根拠→具体の橋が弱く、読み手が途中で迷いやすいです。";
  }

  if (axisId === "specificity") {
    score = 1;
    if (s.hasExampleCue) score += 1;
    if (s.hasActionVerbs) score += 1;
    if (s.hasQuantifier || s.numberCount >= 2) score += 1;
    if (s.numberCount >= 6) score += 1;
    score = Math.min(score, 5);

    reason =
      score >= 4
        ? "行動・工夫・量（回数/期間/数値）があり、再現できる具体性があります。"
        : "経験は書けていますが、条件/量/工夫が薄く“映像化”しにくいです。";
  }

  if (axisId === "logic") {
    score = 1;
    if (s.causalCount >= 1) score += 1;
    if (s.connectiveCount >= 2) score += 1;
    if (s.hasReasonCue) score += 1;
    if (s.contrastCount >= 1) score += 1;
    score = Math.min(score, 5);

    reason =
      score >= 4
        ? "主張→根拠→結果の因果が見え、飛躍が少ないです。"
        : "因果（だから/そのため/結果として）の橋が弱く、主張が浮いて見えます。";
  }

  if (axisId === "contribution") {
    score = 1;
    if (s.hasContributionCue) score += 2;
    if (s.hasExampleCue) score += 1;
    if (s.domainKeywordsHit >= 2) score += 1;
    score = Math.min(score, 5);

    reason =
      score >= 4
        ? "相手にとっての価値（どう役立つか）が具体化されています。"
        : "“自分が頑張った”で止まりやすく、相手メリットへの翻訳が不足しています。";
  }

  if (axisId === "fit") {
    score = 1;
    if (s.hasFitCue) score += 2;
    if (s.domainKeywordsHit >= 3) score += 1;
    if (s.hasConclusionCue && s.hasFitCue) score += 1;
    score = Math.min(score, 5);

    reason =
      score >= 4
        ? "志望先の特徴と自分の経験が結びつき、“なぜここか”が通っています。"
        : "志望先の特徴（理念/取り組み）への言及が薄く、“どこでも言える”印象が残ります。";
  }

  return { axisId, score: clampScore(score), reason };
}

/* ============================================================
   feedback (priority-aware) + quoted red pen
============================================================ */

function buildFeedbackBase(
  text: string,
  scores: AxisScore[],
  s: Signals,
  unstructured: boolean,
  modeId: ModeId,
  priorityAxes: AxisId[],
  personaId: PersonaId,
  docType: DocType
): Feedback {
  let good: string[] = [];
  let improve: string[] = [];
  let next: string[] = [];
  let redPenItems: RedPenItem[] = [];

  // 文字数不足は「警告UI」は出さないが、フィードバックに1行だけ添える
  const minChars = minCharsByDocType(docType);
  const short = minChars > 0 && text.length > 0 && text.length < minChars;

  if (unstructured) {
    improve.push(
      "まず1文で結論を書き、次に理由→具体→貢献/適合で肉付けしましょう。"
    );
    next.push(
      "テンプレ：『私は～の理由で貴◯◯を志望します。きっかけは～。具体的には～。その経験を活かして～に貢献します。』"
    );
    if (short) {
      next.unshift(`文字数が少なめです（目安：${minChars}字以上）。まず核を1往復増やしましょう。`);
    }

    const quote = firstSentenceOrEmpty(text);
    const span = findSpanRobust(text, quote);

    redPenItems = [
      {
        axisId: "clarity",
        priorityRank: 1,
        start: span.start,
        end: span.end,
        quote: trimQuote(quote),
        comment: "【骨格】結論→理由→具体の順に並べる（接続語を入れる）。",
      },
      {
        axisId: "specificity",
        priorityRank: 2,
        start: span.start,
        end: span.end,
        quote: trimQuote(quote),
        comment: "【具体】実習/取り組みの“1シーン”を入れて映像化する。",
      },
    ];

    return {
      good: [],
      improve: dedupe(improve).slice(0, 4),
      next: dedupe(next).slice(0, 5),
      redPenItems: dedupeRedPen(redPenItems).slice(0, 6),
    };
  }

  // ----------------------------
  // 良かったところ（最低2件安定）
  // ----------------------------
  const by = new Map(scores.map((x) => [x.axisId, x.score]));

  // ① まず4以上を優先
  if ((by.get("clarity") ?? 0) >= 4) good.push(clarityGoodByDocType(docType));
  if ((by.get("specificity") ?? 0) >= 4)
    good.push("行動が具体で、再現可能な情報（条件/量）が入っています。");
  if ((by.get("fit") ?? 0) >= 4)
    good.push("志望先の特徴と自分の経験が結びついています。");
  if ((by.get("contribution") ?? 0) >= 4)
    good.push(contributionGoodByDocType(docType));
  if ((by.get("logic") ?? 0) >= 4)
    good.push("主張→根拠→結果の因果が通っていて、納得感があります。");

  // ② 2件に足りなければ「3以上」も拾う
  if (good.length < 2) {
    if ((by.get("clarity") ?? 0) >= 3)
      good.push("要点が整理され、読み手が追いやすい構造です。");
    if (good.length < 2 && (by.get("specificity") ?? 0) >= 3)
      good.push("経験の具体性が入り、説得力の土台があります。");
    if (good.length < 2 && (by.get("logic") ?? 0) >= 3)
      good.push("因果の流れがあり、主張が浮いていません。");
    if (good.length < 2 && (by.get("contribution") ?? 0) >= 3)
      good.push("強みが相手側の価値に近づいています。");
    if (good.length < 2 && (by.get("fit") ?? 0) >= 3)
      good.push("志望先との接続が見えています。");
  }

  // ③ それでも足りなければ signals から補う（嘘はつかない）
  if (good.length < 2) {
    if (s.hasConclusionCue) good.push("結論が明示され、読み手が入口で迷いません。");
    if (good.length < 2 && s.hasExampleCue)
      good.push("具体例が入り、内容がイメージできます。");
    if (good.length < 2 && s.hasContributionCue)
      good.push("貢献の方向性が示されています。");
    if (good.length < 2 && s.hasFitCue)
      good.push("志望先への理解が表れています。");
    if (good.length < 2 && (s.numberCount ?? 0) > 0)
      good.push("数字が入り、具体性を高める要素があります。");
  }

  if (good.length < 2) {
    good.push("方向性は良いので、具体（1シーン）を足すと一段強くなります。");
  }

  // ----------------------------
  // 改善したいところ（4件）＋ 次の一手（5件）
  // ★A：弱軸トップ1だけ「具体化」の問いにする
  // ----------------------------
  const weakAxes = pickWeakAxes(scores, priorityAxes, 4);
  const top = weakAxes[0];

  if (top) {
    improve.push(improveTextByAxis(top.axisId, docType));
    next.push(concreteNextByAxis(top.axisId, docType));
  }

  for (const w of weakAxes.slice(1)) {
    improve.push(improveTextByAxis(w.axisId, docType));
    next.push(nextActionByAxisAndPersona(w.axisId, modeId, personaId, docType));
  }

  // 抽象→具体ギャップがあれば next に1つ足す（B：docType別の検出）
  const gaps = detectAbstractGaps(text, docType);
  if (gaps.length > 0) {
    const g = gaps[0];
    next.push(
      `抽象語『${g.word}』が出たら“どのように？”を1文で追加（場面＋行動＋判断/工夫）。`
    );
  }

  const modeHint = modeHintByMode(modeId);
  if (modeHint) next.push(modeHint);

  if (short) {
    next.unshift(`文字数が少なめです（目安：${minChars}字以上）。核（理由/具体/貢献）の1往復を追加しましょう。`);
  }

  // ★本文位置付き赤ペン（priorityAxes順）
  redPenItems = buildQuotedRedPenItems(text, s, modeId, priorityAxes, docType).slice(
    0,
    10
  );

  // 件数最終調整（仕様）
  good = dedupe(good).slice(0, 2);
  improve = dedupe(improve).slice(0, 4);
  next = dedupe(next).slice(0, 5);

  return {
    good,
    improve,
    next,
    redPenItems: dedupeRedPen(redPenItems).slice(0, 6),
  };
}

/* ============================================================
   weak axes ordering
============================================================ */

function pickWeakAxes(scores: AxisScore[], priorityAxes: AxisId[], k: number) {
  const byId = new Map(scores.map((x) => [x.axisId, x]));
  const ordered = priorityAxes
    .map((id) => byId.get(id))
    .filter(Boolean) as AxisScore[];

  const pos = new Map<AxisId, number>(priorityAxes.map((a, i) => [a, i]));
  const sorted = [...ordered].sort((a, b) => {
    if (a.score !== b.score) return Number(a.score) - Number(b.score);
    return (pos.get(a.axisId) ?? 999) - (pos.get(b.axisId) ?? 999);
  });

  return sorted.slice(0, k);
}

/* ============================================================
   text templates (docType-aware)
============================================================ */

function clarityGoodByDocType(docType: DocType): string {
  if (docType === "motivation")
    return "志望理由の核→根拠→具体の流れが見え、読み手が迷いにくいです。";
  if (docType === "self_pr")
    return "強み→根拠（経験）→成果が見え、説得の順序が整っています。";
  return "経験→工夫→結果の流れが見え、読み手が追いやすいです。";
}

function contributionGoodByDocType(docType: DocType): string {
  if (docType === "motivation")
    return "志望先に対して、どう役立てるか（貢献）が言語化できています。";
  if (docType === "self_pr")
    return "強みが相手価値に翻訳されており、配属後の貢献が想像できます。";
  return "経験が“次にどう活かせるか”につながっています。";
}

function improveTextByAxis(axisId: AxisId, docType: DocType) {
  if (axisId === "clarity")
    return docType === "motivation"
      ? "結論（志望理由）→理由→具体→貢献/適合の“橋渡し”を明示しましょう（接続語を1つ足すだけで改善します）。"
      : "結論→根拠→具体の“橋渡し”を明示しましょう（接続語を1つ足すだけで改善します）。";

  if (axisId === "specificity")
    return "数字/期間/頻度（例：週○回、○ヶ月、○名）を1つ入れるだけで具体性が跳ねます。";

  if (axisId === "logic")
    return "『だから/そのため/結果として』で因果の橋を作ると、主張が浮かなくなります。";

  if (axisId === "contribution")
    return docType === "motivation"
      ? "“自分がしたい”で止めず、“相手にどう役立つか”まで翻訳しましょう。"
      : "“自分が頑張った”で止めず、“相手にどう役立つか”まで翻訳しましょう。";

  return "『志望先の特徴（理念/取り組み）→だから自分が活きる』の1往復を入れましょう。";
}

function concreteNextByAxis(axisId: AxisId, docType: DocType): string {
  const docLabel =
    docType === "motivation" ? "志望動機" : docType === "self_pr" ? "自己PR" : "ガクチカ";

  switch (axisId) {
    case "clarity":
      return `【${docLabel}】冒頭の1文を「結論→理由（1つ）」に直してください（例：『私は◯◯の理由で貴院/貴社を志望します。』）。`;
    case "specificity":
      return `【${docLabel}】具体を1シーン追加：『いつ/どこで/誰と/何を/どのくらい』を1文で足してください（数字が入ると強い）。`;
    case "logic":
      return `【${docLabel}】因果を1本通す：『なぜそうした→何を工夫→結果どうなった（変化/学び）』を3点セットで1〜2文追加。`;
    case "contribution":
      return `【${docLabel}】相手メリットを1文追加：『その強みで入社後/配属後に、誰に何を提供し、どう良くしますか？』。`;
    case "fit":
      return `【${docLabel}】接続を1文追加：『貴院/貴社の◯◯（理念/特徴/事業）に共感→自分の経験◯◯が合う』を1文で書いてください。`;
    default:
      return `【${docLabel}】弱点の軸に対応する具体（1シーン/1文）を追加してください。`;
  }
}

function nextActionByAxisAndPersona(
  axisId: AxisId,
  modeId: ModeId,
  personaId: PersonaId,
  docType: DocType
) {
  const isHr = personaId.includes("_hr");
  const isStrictHead =
    personaId.includes("_head") && !personaId.includes("field_service");
  const isFieldService = personaId.includes("field_service");

  const docLabel =
    docType === "motivation"
      ? "志望動機"
      : docType === "self_pr"
      ? "自己PR"
      : "ガクチカ";

  const roleHint =
    modeId.startsWith("company_tech")
      ? "技術"
      : modeId.startsWith("company_sales")
      ? "営業"
      : "企業";

  // ----------------------------
  // 軸 × docType の基本テンプレ（企業向け）
  // ----------------------------
  let base = "";

  if (axisId === "clarity") {
    if (docType === "motivation") {
      base =
        "冒頭を『結論（志望）→理由（1つ）』に固定し、次に『具体（経験）→貢献（入社後）』へ。";
    } else if (docType === "self_pr") {
      base =
        "冒頭を『強み（1語）→それが活きた場面』に固定し、『工夫→成果』まで一筆書きに。";
    } else {
      base =
        "『背景（何をした）→課題→工夫→結果→学び』の順に並べ、段落で区切って読みやすく。";
    }
  }

  if (axisId === "specificity") {
    if (docType === "motivation") {
      base =
        "志望理由を“現場の具体”で支える：見学/実習/学びの1シーン＋数字（回数/期間）を1つ。";
    } else if (docType === "self_pr") {
      base =
        "強みの根拠を具体化：『いつ/どこで/何を/どのくらい』＋あなたの工夫を1つ。";
    } else {
      base =
        "ガクチカの具体化：『役割』『工夫』『数字（量/頻度/期間）』『成果（変化）』を最低1つずつ。";
    }
  }

  if (axisId === "logic") {
    if (docType === "motivation") {
      base =
        "因果の橋を1本：『なぜ惹かれた→何を理解した→だから自分はこう貢献できる』を接続語で。";
    } else if (docType === "self_pr") {
      base =
        "強みの因果を1本：『強み→具体行動→結果→再現条件（何を意識したか）』を明示。";
    } else {
      base =
        "課題→工夫→結果の因果を明示：『そのため/結果として』を使って飛躍をなくす。";
    }
  }

  if (axisId === "contribution") {
    if (docType === "motivation") {
      base =
        "入社後の価値に翻訳：『誰の/どんな手間や損失を/どう減らす（増やす）』を1文で。";
    } else if (docType === "self_pr") {
      base =
        "強みを“職務価値”へ翻訳：『強み→現場での使い所→チーム/顧客へのメリット』を1文追加。";
    } else {
      base =
        "学びを価値へ翻訳：『その経験で身につけたこと→次にどう役立てるか』を最後に1文。";
    }
  }

  if (axisId === "fit") {
    if (docType === "motivation") {
      base =
        "“なぜこの会社か”を一点深掘り：事業/技術/顧客の特徴を1つ→自分の経験と接続。";
    } else if (docType === "self_pr") {
      base =
        "“この環境で強みが活きる”を明示：職種の要求（技術/営業）を1つ→自分の強みと接続。";
    } else {
      base =
        "経験を志望先に接続：『この経験→御社の仕事での再現』を1文で書く（どの部署で活きるか）。";
    }
  }

  // ----------------------------
  // 役割（tech/sales/FS/HR）で一言だけ刺しどころを変える
  // ----------------------------
  const addRoleTail = (s: string) => {
    if (roleHint === "技術") {
      if (axisId === "specificity")
        return `${s}（技術：検証条件/評価指標まで言えると一段上）`;
      if (axisId === "logic")
        return `${s}（技術：仮説→検証→改善の筋を1例で）`;
      if (axisId === "contribution")
        return `${s}（技術：品質/効率/再現性のどれを上げるか）`;
      return `${s}（技術：具体と因果が命）`;
    }
    if (roleHint === "営業") {
      if (axisId === "contribution")
        return `${s}（営業：顧客課題→提案価値→成果を一筆書きで）`;
      if (axisId === "fit")
        return `${s}（営業：なぜこの市場/商材かを一点深掘り）`;
      if (axisId === "logic")
        return `${s}（営業：ヒアリング→提案→導入後の変化の筋）`;
      return `${s}（営業：価値の言語化が勝ち筋）`;
    }
    return s;
  };

  // ----------------------------
  // persona トーン（最小）
  // ----------------------------
  if (isHr) {
    if (axisId === "clarity")
      return addRoleTail(`${base}（人事：最初の3行で人物像が伝わると強い）`);
    if (axisId === "specificity")
      return addRoleTail(`${base}（人事：再現性＝誰が読んでも同じ理解になる情報）`);
    if (axisId === "fit")
      return addRoleTail(`${base}（人事：カルチャー/方針への接続があると安心）`);
    if (axisId === "contribution")
      return addRoleTail(`${base}（人事：配属後に“任せられる絵”が見えると刺さる）`);
    if (axisId === "logic")
      return addRoleTail(`${base}（人事：飛躍があると不安が残る）`);
    return addRoleTail(base);
  }

  if (isFieldService) {
    if (axisId === "clarity")
      return addRoleTail(`${base}（FS：現場は“伝わるか/回るか”が正義）`);
    if (axisId === "specificity")
      return addRoleTail(`${base}（FS：手順/条件/制約が見えると強い）`);
    if (axisId === "fit")
      return addRoleTail(`${base}（FS：導入後の運用を想像できる一文を足す）`);
    if (axisId === "contribution")
      return addRoleTail(`${base}（FS：手間が減る/事故が減るに翻訳）`);
    return addRoleTail(base);
  }

  if (isStrictHead) {
    if (axisId === "specificity")
      return addRoleTail(`${base}（部長：具体が薄いと“再現できない”で落ちます）`);
    if (axisId === "logic")
      return addRoleTail(`${base}（部長：因果が飛ぶと“任せられない”になります）`);
    if (axisId === "contribution")
      return addRoleTail(`${base}（部長：価値が曖昧だと“どこで使う？”になります）`);
    if (axisId === "fit")
      return addRoleTail(`${base}（部長：なぜうちかが薄いと即バレます）`);
    return addRoleTail(`${base}（部長：${docLabel}としての筋を通す）`);
  }

  return addRoleTail(base);
}

function modeHintByMode(modeId: ModeId): string | null {
  if (modeId.startsWith("hospital_rt")) {
    return "放射線部門なら『安全（線量/被ばく）』『検査/治療の質』『チーム連携』のどれか1点に寄せると強く出ます。";
  }
  if (modeId.startsWith("hospital_nurse")) {
    return "看護なら『患者の安心』『観察→判断→対応』『多職種連携』のどれか1点を具体で支えると刺さります。";
  }
  if (modeId.startsWith("checkup_center")) {
    return "健診なら『受診者への説明』『待ち時間/導線の配慮』『精度管理』のどれか1点に焦点化が有効です。";
  }
  if (modeId.startsWith("company_tech")) {
    return "技術系なら『課題→仮説→検証→改善（再現性）』の流れを1例で示すと強いです。";
  }
  if (modeId.startsWith("company_sales")) {
    return "営業系なら『顧客課題→提案価値→導入後の成果』のつなぎを明示すると“貢献”が立ちます。";
  }
  return null;
}

/* ============================================================
   abstract -> concrete detector (B)
============================================================ */

type AbstractGap = {
  word: string;
  sentence: string;
};

function detectAbstractGaps(text: string, docType: DocType): AbstractGap[] {
  const targetsByDoc: Record<DocType, string[]> = {
    motivation: [
      "理念",
      "共感",
      "魅力",
      "志望",
      "貢献",
      "活かす",
      "活かし",
      "大切さ",
      "姿勢",
      "意識",
    ],
    self_pr: [
      "強み",
      "責任感",
      "協調性",
      "主体性",
      "粘り強さ",
      "向上心",
      "学び",
      "意識",
      "姿勢",
    ],
    gakuchika: [
      "頑張った",
      "成長",
      "工夫",
      "課題",
      "改善",
      "学び",
      "意識",
      "大切さ",
    ],
  };

  const targets = targetsByDoc[docType] ?? [];

  const evidence = new RegExp(
    [
      "どのように",
      "具体的に",
      "例えば",
      "たとえば",
      "特に",
      "際",
      "[0-9０-９]",
      "週に",
      "月に",
      "回",
      "名",
      "人",
      "件",
      "％",
      "ヶ月",
      "か月",
      "年間",
      "半年",
      "実習",
      "見学",
      "患者",
      "受診者",
      "検査",
      "治療",
      "説明",
      "案内",
      "受付",
      "チーム",
      "連携",
      "現場",
      "しました",
      "しています",
      "行いました",
      "実施しました",
      "取り組みました",
      "心がけています",
      "徹底しました",
      "工夫しました",
      "改善しました",
      "提案しました",
      "分析しました",
      "検証しました",
      "作成しました",
      "調整しました",
      "を.+した",
      "を.+して",
      "そのため",
      "結果として",
      "したがって",
      "だから",
      "ため",
      "判断",
      "決め",
      "選び",
      "優先",
      "考え",
    ].join("|")
  );

  const sentences = splitSentences(text);
  const gaps: AbstractGap[] = [];

  for (const sen of sentences) {
    const sentence = sen.trim();
    if (!sentence) continue;

    const hasEvidence = evidence.test(sentence);

    for (const w of targets) {
      if (!sentence.includes(w)) continue;
      if (!hasEvidence) {
        gaps.push({ word: w, sentence });
      }
    }
  }

  const seen = new Set<string>();
  return gaps.filter((g) => {
    const k = `${g.word}|${g.sentence}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/* ============================================================
   quoted red pen (span start/end) + phrase underline
============================================================ */

function buildQuotedRedPenItems(
  text: string,
  s: Signals,
  modeId: ModeId,
  priorityAxes: AxisId[],
  docType: DocType
): RedPenItem[] {
  const sentences = splitSentences(text);
  const items: RedPenItem[] = [];

  const isTech = modeId.startsWith("company_tech");
  const isSales = modeId.startsWith("company_sales");

  const findSentence = (patterns: RegExp[]) =>
    sentences.find((x) => patterns.some((p) => p.test(x))) ?? sentences[0] ?? "";

  const push = (
    axisId: AxisId,
    rank: number,
    sentence: string,
    patterns: RegExp[],
    comment: string
  ) => {
    if (!sentence) return;

    const phrase = pickUnderlinePhrase(sentence, patterns, 28);
    const span = findSpanRobust(text, phrase);

    items.push({
      axisId,
      priorityRank: rank,
      start: span.start,
      end: span.end,
      quote: trimQuote(phrase),
      comment,
    });
  };

  priorityAxes.forEach((axisId, idx) => {
    const rank = idx + 1;

    /* =============================
       SPECIFICITY（具体）
    ============================= */
    if (axisId === "specificity") {
      if (isTech) {
        const sen = findSentence([
          /(仮説|検証|評価|分析|改善|設計|条件|指標)/,
        ]);
        push(
          axisId,
          rank,
          sen,
          [/(仮説|検証|評価|分析|改善|設計|条件|指標)/],
          "【具体】技術は“検証条件/評価指標/改善内容”まで書けると強い。"
        );
        return;
      }

      if (isSales) {
        const sen = findSentence([
          /(顧客|課題|提案|導入|成果|契約)/,
        ]);
        push(
          axisId,
          rank,
          sen,
          [/(顧客|課題|提案|導入|成果|契約)/],
          "【具体】営業は“顧客課題→提案→成果”が具体であるほど刺さる。"
        );
        return;
      }

      if (docType === "self_pr") {
        const sen = findSentence([
          /(強み|工夫|改善|実施|担当|役割)/,
        ]);
        push(
          axisId,
          rank,
          sen,
          [/(強み|工夫|改善|実施|担当|役割)/],
          "【具体】強みが発揮された“1場面”を明確に。"
        );
        return;
      }

      if (docType === "gakuchika") {
        const sen = findSentence([
          /(役割|工夫|課題|改善|成果)/,
        ]);
        push(
          axisId,
          rank,
          sen,
          [/(役割|工夫|課題|改善|成果)/],
          "【具体】役割と工夫、そして成果（数字）があると強い。"
        );
        return;
      }
    }

    /* =============================
       CONTRIBUTION（価値）
    ============================= */
    if (axisId === "contribution") {
      if (isTech) {
        const sen = findSentence([
          /(品質|効率|改善|再現性|安定|最適化)/,
        ]);
        push(
          axisId,
          rank,
          sen,
          [/(品質|効率|改善|再現性|安定|最適化)/],
          "【貢献】技術では“品質/効率/再現性”のどれを上げるか明確に。"
        );
        return;
      }

      if (isSales) {
        const sen = findSentence([
          /(価値|成果|売上|信頼|関係)/,
        ]);
        push(
          axisId,
          rank,
          sen,
          [/(価値|成果|売上|信頼|関係)/],
          "【貢献】営業は“顧客にどんな変化を起こすか”を明示。"
        );
        return;
      }
    }

    /* =============================
       FIT（適合）
    ============================= */
    if (axisId === "fit") {
      const sen = findSentence([
        /(理念|方針|特徴|事業|強み|御社|貴社)/,
      ]);

      push(
        axisId,
        rank,
        sen,
        [/(理念|方針|特徴|事業|強み|御社|貴社)/],
        "【適合】志望先の特徴と自分の経験を1文で接続。"
      );
      return;
    }

    /* =============================
       LOGIC（因果）
    ============================= */
    if (axisId === "logic") {
      const sen = findSentence([
        /(そのため|結果として|したがって|だから)/,
      ]);

      push(
        axisId,
        rank,
        sen,
        [/(そのため|結果として|したがって|だから)/],
        "【論理】因果の接続語で“飛躍”をなくす。"
      );
      return;
    }

    /* =============================
       CLARITY（構造）
    ============================= */
    if (axisId === "clarity") {
      const sen = sentences[0] ?? "";
      push(
        axisId,
        rank,
        sen,
        [/^.{0,20}/],
        "【構造】冒頭で結論が明示されているか確認。"
      );
    }
  });

  return items.slice(0, 6);
}

/* ============================================================
   span finder (robust)
============================================================ */

type Range = { start: number; end: number };

function findSpanRobust(text: string, snippet: string): Range {
  const s = (snippet ?? "").trim();
  if (!s) return { start: -1, end: -1 };

  const idx = text.indexOf(s);
  if (idx >= 0) return { start: idx, end: idx + s.length };

  const buildNoWs = (src: string) => {
    const chars: string[] = [];
    const map: number[] = [];
    for (let i = 0; i < src.length; i++) {
      const ch = src[i];
      if (/\s/.test(ch)) continue;
      chars.push(ch);
      map.push(i);
    }
    return { noWs: chars.join(""), map };
  };

  const T = buildNoWs(text);
  const S = buildNoWs(s);

  if (!S.noWs) return { start: -1, end: -1 };

  const idx2 = T.noWs.indexOf(S.noWs);
  if (idx2 < 0) return { start: -1, end: -1 };

  const startOrig = T.map[idx2];
  const endOrig = T.map[idx2 + S.noWs.length - 1] + 1;

  if (startOrig == null || endOrig == null || endOrig <= startOrig) {
    return { start: -1, end: -1 };
  }
  return { start: startOrig, end: endOrig };
}

function pickUnderlinePhrase(sentence: string, patterns: RegExp[], maxLen = 28) {
  const s = (sentence ?? "").trim();
  if (!s) return "";

  const q = s.match(/「([^」]{2,})」/);
  if (q?.[1]) {
    const inner = q[1].trim();
    return inner.length > maxLen ? inner.slice(0, maxLen) : inner;
  }

  for (const p of patterns) {
    const m = s.match(p);
    if (m) {
      const hit = (m[0] ?? "").trim();
      if (!hit) continue;
      return hit.length > maxLen ? hit.slice(0, maxLen) : hit;
    }
  }

  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

function resolveSpanWithFallback(
  text: string,
  phrase: string,
  fallbackSentence: string
): { phrase: string; span: Range } {
  const p = (phrase ?? "").trim();
  if (p) {
    const sp = findSpanRobust(text, p);
    if (sp.start >= 0 && sp.end > sp.start) return { phrase: p, span: sp };
  }

  const fs = (fallbackSentence ?? "").trim();
  const sp2 = findSpanRobust(text, fs);
  return { phrase: p || trimQuote(fs), span: sp2 };
}

function trimQuote(s: string) {
  const t = (s ?? "").replace(/\s+/g, " ").trim();
  return t.length > 70 ? t.slice(0, 70) + "…" : t;
}

function firstSentenceOrEmpty(text: string) {
  const s = splitSentences(text)[0] ?? "";
  return trimQuote(s);
}

/* ============================================================
   dedupe helpers
============================================================ */

function dedupe(arr: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of arr) {
    const k = x.trim();
    if (!k) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}

function dedupeRedPen(items: RedPenItem[]) {
  const seen = new Set<string>();
  const out: RedPenItem[] = [];
  for (const it of items) {
    const key = `${it.axisId}|${it.priorityRank}|${it.start}|${it.end}|${it.quote}|${it.comment}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
}

/* ============================================================
   persona tone
============================================================ */

function applyPersonaTone(fb: Feedback, personaId: PersonaId): Feedback {
  const tone = personaId.includes("_hr")
    ? "warm"
    : personaId.includes("field_service")
    ? "coach"
    : personaId.includes("_head")
    ? "strict"
    : "coach";

  const prefix = (s: string) => {
    if (tone === "strict") return `【現場視点】${s}`;
    if (tone === "warm") return `【人事視点】${s}`;
    return `【実行視点】${s}`;
  };

  const tweak = (s: string) => {
    if (tone === "strict") {
      return s
        .replace(/弱いです/g, "弱いです（現場では通りません）")
        .replace(/不足しています/g, "不足しています（根拠が必要です）");
    }
    if (tone === "warm") {
      return s
        .replace(/弱いです/g, "弱めです")
        .replace(/不足しています/g, "もう少し補えると安心です");
    }
    return s.replace(/しましょう/g, "やってみましょう").replace(/入れましょう/g, "入れてみましょう");
  };

  const mapArr = (arr: string[]) => arr.map((x) => tweak(prefix(x)));

  return {
    good: mapArr(fb.good),
    improve: mapArr(fb.improve),
    next: mapArr(fb.next),
    redPenItems: fb.redPenItems.map((it) => ({
      ...it,
      comment: tweak(prefix(it.comment)),
    })),
  };
}