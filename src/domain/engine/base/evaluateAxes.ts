import type { AxisScores, ModeConfig } from "../types";

export function evaluateAxes(_text: string, _mode: ModeConfig): AxisScores {
  return {
    clarity: 3,
    specificity: 3,
    logic: 3,
    contribution: 3,
    fit: 3,
  };
}