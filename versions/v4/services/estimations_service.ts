import { StopEstimations } from "../interfaces/responses/stop_estimations_interface.ts";
import { getLinesByStopId } from "../utils/stop_utils.ts";
import { getNextStopsForLineByStopIdAndLineLabel } from "../utils/line_utils.ts";
import {
  addAccessControlAllowOriginHeader,
  sendBadRequestResponse,
} from "../utils/response_utils.ts";
import SoapAdapter from "../../../adapters/soap_adapter.ts";
import { EstimationsRequest } from "../interfaces/requests/estimations_request_interface.ts";
import type {
  LineEstimations,
  ShortcutsLineEstimations,
} from "../interfaces/models/line_estimations_interface.ts";

const Adapter = SoapAdapter;

const MESSAGE_STOP_ID_REQUIRED = "stopId is required";
const MESSAGE_STOP_ID_INVALID = "stopId is invalid";
const MESSAGE_LINE_LABEL_REQUIRED = "lineLabel is required";

export function validateConfiguration(): void {
  Adapter.validateConfiguration();
}

export async function getEstimations(
  searchParams: URLSearchParams
): Promise<Response> {
  let request: EstimationsRequest | null;

  try {
    request = validateRequest(searchParams);
  } catch (error) {
    if (error instanceof Error) {
      return sendBadRequestResponse(error.message);
    } else {
      return sendBadRequestResponse("An unknown error has occurred");
    }
  }

  return await processRequest(request);
}

function validateRequest(searchParams: URLSearchParams): EstimationsRequest {
  const userStopId = searchParams.get("stopId") ?? null;
  const userLineLabel = searchParams.get("lineLabel") ?? null;
  const update = searchParams.get("update") === "true";
  const shortcuts = searchParams.get("shortcuts") === "true";

  if (userStopId === null) {
    throw new Error(MESSAGE_STOP_ID_REQUIRED);
  }

  const stopId = parseInt(userStopId);

  if (isNaN(stopId)) {
    throw new Error(MESSAGE_STOP_ID_INVALID);
  }

  if (userLineLabel !== null && userLineLabel.length === 0) {
    throw new Error(MESSAGE_LINE_LABEL_REQUIRED);
  }

  return {
    stopId,
    userLineLabel,
    update,
    shortcuts,
  };
}

async function processRequest(request: EstimationsRequest): Promise<Response> {
  // Input
  const { stopId, userLineLabel } = request;

  // Data
  const estimations = await Adapter.getEstimationsData(stopId, userLineLabel);

  const headers = new Headers();
  addAccessControlAllowOriginHeader(headers);

  if (request.shortcuts) {
    return Response.json(processShortcutsRequest(estimations), { headers });
  } else {
    return Response.json(processWebRequest(request, estimations), { headers });
  }
}

function processWebRequest(
  request: EstimationsRequest,
  estimations: LineEstimations[]
): StopEstimations {
  const response: StopEstimations = [estimations];

  if (request.update) {
    return response;
  }

  const { stopId, userLineLabel } = request;

  // Additional data (lines / next stops)
  if (estimations.length > 0) {
    if (userLineLabel === null) {
      // Add available lines for stop
      response[1] = getLinesByStopId(stopId);
    } else {
      // Add next stops for line
      response[1] = getNextStopsForLineByStopIdAndLineLabel(
        stopId,
        userLineLabel
      );
    }
  }

  return response;
}

function processShortcutsRequest(
  estimations: LineEstimations[]
): ShortcutsLineEstimations[] {
  const response: ShortcutsLineEstimations[] = [];

  estimations.forEach(([label, destination, minutes1, minutes2]) => {
    response.push({
      label,
      destination,
      minutes1,
      minutes2,
    });
  });

  return response;
}

export default {
  validateConfiguration,
  getEstimations,
};
