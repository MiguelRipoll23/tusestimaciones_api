export type LineEstimations = [
  label: string,
  destination: string,
  minutes1: number | null,
  minutes2: number | null,
];

export interface ShortcutsLineEstimations {
  label: string;
  destination: string;
  minutes1: number | null;
  minutes2: number | null;
}
