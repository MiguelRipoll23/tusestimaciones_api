import routeLines from "./../data/routes-lines.min.json" assert {
  type: "json",
};
import routeStops from "./../data/routes-stops.min.json" assert {
  type: "json",
};

export function getRouteId(stopId: number, lineLabel: string): string | null {
  if (stopId in routeLines === false) {
    return null;
  }

  const stopIdAsString = stopId.toString();
  const stopIdIndex = stopIdAsString as keyof typeof routeLines;
  const stopRoutes = routeLines[stopIdIndex];

  if (lineLabel in stopRoutes === false) {
    return null;
  }

  const lineLabelIndex = lineLabel as keyof typeof stopRoutes;
  return stopRoutes[lineLabelIndex];
}

export function getRoutesByLineLabel(lineLabel: string) {
  if (lineLabel in routeStops === false) {
    return null;
  }

  const lineLabelIndex = lineLabel as keyof typeof routeStops;
  return routeStops[lineLabelIndex];
}

export function getStopsByRouteId(lineLabel: string, routeId: string | null) {
  if (routeId === null) {
    return [];
  }

  if (lineLabel in routeStops === false) {
    return [];
  }

  const lineLabelIndex = lineLabel as keyof typeof routeStops;
  const routesLine = routeStops[lineLabelIndex];

  if (routeId in routesLine === false) {
    return [];
  }

  const routeIdIndex = routeId as keyof typeof routesLine;
  return routesLine[routeIdIndex];
}

export function getStopsByStopIdAndLineLabel(
  stopId: number,
  lineLabel: string,
) {
  const results: string[] = [];
  const routeId = getRouteId(stopId, lineLabel);

  if (routeId === null) {
    return results;
  }

  const stops = getStopsByRouteId(lineLabel, routeId);

  if (stops === null) {
    return results;
  }

  let found = false;

  for (const route of stops) {
    if (found) {
      results.push(route[1]);

      if (results.length === 5) {
        break;
      }
    } else if (route[0] === stopId) {
      found = true;
    }
  }

  return results;
}
