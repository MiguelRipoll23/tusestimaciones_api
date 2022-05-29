import { LineRoute } from "../interfaces/line-route.ts";
import { StopRoute } from "../interfaces/stop-route.ts.ts";
import { getRouteId, getStopsByRouteId } from "../utils/line-utils.ts";
import { getLinesByStopId } from "../utils/stop-utils.ts";

export async function getRoute(
  urlSearchParams: URLSearchParams,
): Promise<Response> {
  const userStopId = urlSearchParams.get("stopId") ?? null;
  const userLineLabel = urlSearchParams.get("lineLabel") ?? null;

  // Log
  console.info(`getRoute(stopId:${userStopId},lineLabel:${userLineLabel})`);

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
    return Response.json(
      {
        emoji: "🙄",
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
    result.validationMessage = "stopId is required";
    return result;
  }

  const stopId = parseInt(userStopId);

  if (isNaN(stopId)) {
    result.validationMessage = "stopId is invalid";
    return result;
  }

  result.stopId = stopId;

  if (userLineLabel === null) {
    result.validationMessage = "lineLabel is required";
    return result;
  }

  result.lineLabel = userLineLabel;

  // Validated
  result.invalid = false;

  return result;
}

function prepareResponse(stopId: number, lineLabel: string): Response {
  const response: LineRoute[] = [];

  // Route
  const routeId = getRouteId(stopId, lineLabel);

  // Stops
  const stops: StopRoute[] = getStopsByRouteId(lineLabel, routeId);

  // Stop lines
  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i];
    const id = stop[0];
    const name = stop[1];

    const lineLabels = getLinesByStopId(id);
    const lineRoute: LineRoute = [id, name, lineLabels];

    response.push(lineRoute);
  }

  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");

  return Response.json(response, { headers });
}
