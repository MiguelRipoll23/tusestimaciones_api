import { LineRoute } from "../interfaces/responses/line_route_interface.ts";
import { getRouteId, getStopsByRouteId } from "../utils/line_utils.ts";
import { getLinesByStopId } from "../utils/stop_utils.ts";
import {
  addAccessControlAllowOriginHeader,
  sendBadRequestResponse,
} from "../utils/response_utils.ts";
import { RouteRequest } from "../interfaces/requests/route_request_interface.ts";

const MESSAGE_STOP_ID_REQUIRED = "stopId is required";
const MESSAGE_STOP_ID_INVALID = "stopId is invalid";
const MESSAGE_LINE_LABEL_REQUIRED = "lineLabel is required";

export function getRoute(
  searchParams: URLSearchParams,
): Response {
  let request: RouteRequest | null;

  try {
    request = validateRequest(
      searchParams,
    );
  } catch (error) {
    return sendBadRequestResponse(error.message);
  }

  return processRequest(request);
}

function validateRequest(
  searchParams: URLSearchParams,
): RouteRequest {
  const userStopId = searchParams.get("stopId") ?? null;
  const userLineLabel = searchParams.get("lineLabel") ?? null;

  if (userStopId === null) {
    throw new Error(MESSAGE_STOP_ID_REQUIRED);
  }

  const stopId = parseInt(userStopId);

  if (isNaN(stopId)) {
    throw new Error(MESSAGE_STOP_ID_INVALID);
  }

  if (userLineLabel === null || userLineLabel.length === 0) {
    throw new Error(MESSAGE_LINE_LABEL_REQUIRED);
  }

  const lineLabel = userLineLabel;

  return { stopId, lineLabel };
}

function processRequest(request: RouteRequest): Response {
  const response: LineRoute[] = [];

  // Input
  const { stopId, lineLabel } = request;

  // Route ID
  const routeId = getRouteId(stopId, lineLabel);

  // Route stops
  const routeStops = getStopsByRouteId(lineLabel, routeId);

  // Line stops + available lines
  // for every stop
  for (const routeStop of routeStops) {
    const routeStopId = routeStop[0];
    const routeStopName = routeStop[1];

    const lineLabels = getLinesByStopId(routeStopId);
    const lineRoute: LineRoute = [routeStopId, routeStopName, lineLabels];

    response.push(lineRoute);
  }

  const headers = new Headers();
  addAccessControlAllowOriginHeader(headers);

  return Response.json(response, { headers });
}

export default {
  getRoute,
};
