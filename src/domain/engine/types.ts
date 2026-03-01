export type AxisKey = "clarity" | "specificity" | "logic" | "contribution" | "fit";
export type AxisScores = Record<AxisKey, number>;

export type RedpenItem = {
  type: "underline" | "comment";
  axis: AxisKey;
  text: string;
  priority: "high" | "mid" | "low";
};

export type ModeConfig = {
  modeId: string;
  personaId: string;
  docType: "motivation" | "self_pr" | "gakuchika";
  priorityAxes: AxisKey[];
};

export type EvaluateResult = {
  axisScores: AxisScores;
  redpenItems: RedpenItem[];
  meta?: Record<string, unknown>;
};