import { LineEstimations } from "./line_estimations_interface.ts";

export type StopEstimations = [
  lineEstimations: LineEstimations[],
  lineLabelsOrStopNames: string[]
];
