import lines from "./../data/lines.min.json" assert { type: "json" };
import routeLines from "./../data/routes-lines.min.json" assert {
  type: "json",
};

export function getLinesByStopId(stopId: number) {
  if (stopId === 0) {
    return lines;
  }

  const stopIdAsString = stopId.toString();

  if (stopIdAsString in routeLines === false) {
    return [];
  }

  const stopIdIndex = stopIdAsString as keyof typeof routeLines;

  return Object.keys(routeLines[stopIdIndex]);
}
