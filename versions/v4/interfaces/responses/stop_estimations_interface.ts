import { LineEstimations } from "../models/line_estimations_interface.ts";

export type StopEstimations = [
  lineEstimations: LineEstimations[],
  lineLabelsOrStopNames?: string[],
];
