import { LineRoute } from "../interfaces/line_route_interface.ts";
import { getRouteId, getStopsByRouteId } from "../utils/line_utils.ts";
import { getLinesByStopId } from "../utils/stop_utils.ts";
import { addAccessControlAllowOriginHeader } from "../utils/response_utils.ts";

const MESSAGE_STOP_ID_REQUIRED = "stopId is required";
const MESSAGE_STOP_ID_INVALID = "stopId is invalid";
const MESSAGE_LINE_LABEL_REQUIRED = "lineLabel is required";

export async function getRoute(
  version: string,
  searchParams: URLSearchParams,
): Promise<Response> {
  const userStopId = searchParams.get("stopId") ?? null;
  const userLineLabel = searchParams.get("lineLabel") ?? null;

  // Log
  console.info(
    `${version}.` +
      "route_service." +
      `getRoute(stopId:${userStopId},lineLabel:${userLineLabel})`,
  );

  return await validateRequest(userStopId, userLineLabel);
}

async function validateRequest(
  userStopId: string | null,
  userLineLabel: string | null,
): Promise<Response> {
  const { invalid, validationMessage, stopId, lineLabel } = geValidationResult(
    userStopId,
    userLineLabel,
  );

  if (invalid) {
    console.warn(`Invalid request: ${validationMessage}`);

    return Response.json(
      {
        message: validationMessage,
      },
      { status: 400 },
    );
  }

  return await prepareResponse(stopId, lineLabel);
}

interface ValidationResult {
  invalid: boolean;
  validationMessage: string | null;
  stopId: number;
  lineLabel: string;
}

function geValidationResult(
  userStopId: string | null,
  userLineLabel: string | null,
): ValidationResult {
  const result: ValidationResult = {
    invalid: true,
    validationMessage: null,
    stopId: 0,
    lineLabel: "",
  };

  if (userStopId === null) {
    result.validationMessage = MESSAGE_STOP_ID_REQUIRED;
    return result;
  }

  const stopId = parseInt(userStopId);

  if (isNaN(stopId)) {
    result.validationMessage = MESSAGE_STOP_ID_INVALID;
    return result;
  }

  result.stopId = stopId;

  if (userLineLabel === null) {
    result.validationMessage = MESSAGE_LINE_LABEL_REQUIRED;
    return result;
  }

  result.lineLabel = userLineLabel;

  // Validated
  result.invalid = false;

  return result;
}

function prepareResponse(stopId: number, lineLabel: string): Response {
  const response: LineRoute[] = [];

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
