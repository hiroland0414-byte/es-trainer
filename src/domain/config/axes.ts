// src/domain/config/axes.ts
import { AxisId } from "@/domain/types/models";

export const AXES: Record<
  AxisId,
  { label: string; description: string }
> = {
  clarity: {
    label: "わかりやすさ",
    description:
      "結論→理由→具体→貢献/適合の順で、読み手が迷わない構造になっている",
  },
  specificity: {
    label: "具体性",
    description:
      "行動・工夫・数字/条件など、再現できる情報があり“映像が浮かぶ”",
  },
  logic: {
    label: "論理",
    description:
      "主張と根拠がつながり、飛躍や矛盾が少ない（因果が通っている）",
  },
  contribution: {
    label: "貢献",
    description:
      "相手（病院/健診/企業）にとっての価値が明確で、役割が想像できる",
  },
  fit: {
    label: "適合",
    description:
      "志望先の特徴と自分の経験・強みが結びついており、“なぜここか”が言える",
  },
};
