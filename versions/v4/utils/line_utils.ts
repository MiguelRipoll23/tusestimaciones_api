import { StopRoute } from "../interfaces/stop_route_interface.ts";
import routeLines from "./../data/routes-lines.min.json" with {
  type: "json",
};
import routeStops from "./../data/routes-stops.min.json" with {
  type: "json",
};

export function getRouteId(stopId: number, lineLabel: string): string | null {
  if (stopId in routeLines === false) {
    return null;
  }

  // Get all routes identifiers
  // for stopId
  const stopIdAsString = stopId.toString();
  const stopIdIndex = stopIdAsString as keyof typeof routeLines;
  const stopRoutes = routeLines[stopIdIndex];

  if (lineLabel in stopRoutes === false) {
    return null;
  }

  // Filter by line label
  const lineLabelIndex = lineLabel as keyof typeof stopRoutes;
  return stopRoutes[lineLabelIndex];
}

export function getStopsByRouteId(
  lineLabel: string,
  routeId: string | null,
): StopRoute[] {
  if (routeId === null) {
    return [];
  }

  if (lineLabel in routeStops === false) {
    return [];
  }

  // Get all stops routes
  // for a line label
  const lineLabelIndex = lineLabel as keyof typeof routeStops;
  const routesLine = routeStops[lineLabelIndex];

  if (routeId in routesLine === false) {
    return [];
  }

  // Filter by route ID
  const routeIdIndex = routeId as keyof typeof routesLine;
  return routesLine[routeIdIndex];
}

export function getNextStopsForLineByStopIdAndLineLabel(
  stopId: number,
  lineLabel: string,
) {
  const stopNames: string[] = [];

  // Route ID
  const routeId = getRouteId(stopId, lineLabel);

  // Route stops
  const routeStops = getStopsByRouteId(lineLabel, routeId);

  // Use current stop as index
  // to get the next 5 stops
  let found = false;

  for (const routeStop of routeStops) {
    const routeStopId = routeStop[0];

    if (found) {
      const routeStopName = routeStop[1];
      stopNames.push(routeStopName);

      if (stopNames.length === 5) {
        break;
      }
    } else if (routeStopId === stopId) {
      found = true;
    }
  }

  return stopNames;
}
