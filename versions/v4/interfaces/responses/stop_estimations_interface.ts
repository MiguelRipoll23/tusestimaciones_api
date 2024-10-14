import { LineEstimations } from "../models/line_estimations_interface.ts";

export type StopEstimations = [
  lineEstimations: LineEstimations[],
  lineLabelsOrStopNames?: string[],
];

export interface ShortcutsStopEstimations {
  [key: string]: ShortcutsLineEstimations;
}

export interface ShortcutsLineEstimations {
  label: string;
  destination: string;
  minutes1: number | null;
  minutes2: number | null;
}
