import { StopRoute } from "./stop-route.ts.ts";

export type LineRoute = [...stopRoute: StopRoute, lineLabels: string[]];
