import { StopRoute } from "../models/stop_route_interface.ts";

export type LineRoute = [...stopRoute: StopRoute, lineLabels: string[]];
