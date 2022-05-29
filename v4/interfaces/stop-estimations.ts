import { LineEstimations } from "./line-estimations.ts";

export type StopEstimations = [
  lineEstimations: LineEstimations[],
  lineLabelsOrStopNames: string[],
];
