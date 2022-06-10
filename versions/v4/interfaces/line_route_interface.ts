import { StopRoute } from "./stop_route_interface.ts";

export type LineRoute = [...stopRoute: StopRoute, lineLabels: string[]];
