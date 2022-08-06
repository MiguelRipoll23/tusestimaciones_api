import { StopEstimations } from "../interfaces/stop_estimations_interface.ts";
import { getLinesByStopId } from "../utils/stop_utils.ts";
import { getNextStopsForLineByStopIdAndLineLabel } from "../utils/line_utils.ts";
import { addAccessControlAllowOriginHeader } from "../utils/response_utils.ts";

import SoapAdapter from "../../../adapters/soap_adapter.ts";

const Adapter = SoapAdapter;

const MESSAGE_STOP_ID_REQUIRED = "stopId is required";
const MESSAGE_STOP_ID_INVALID = "stopId is invalid";
const MESSAGE_LINE_LABEL_REQUIRED = "lineLabel is required";

export function checkConfiguration(): void {
  Adapter.checkConfiguration();
}

export async function getEstimations(
  version: string,
  searchParams: URLSearchParams
): Promise<Response> {
  const userStopId = searchParams.get("stopId") ?? null;
  const userLineLabel = searchParams.get("lineLabel") ?? null;

  // Log
  console.info(
    `${version}.` +
      "estimations_service." +
      `getEstimations(stopId:${userStopId},lineLabel:${userLineLabel})`
  );

  return await validateRequest(userStopId, userLineLabel);
}

async function validateRequest(
  userStopId: string | null,
  userLineLabel: string | null
): Promise<Response> {
  const { invalid, validationMessage, stopId, lineLabel } = geValidationResult(
    userStopId,
    userLineLabel
  );

  if (invalid) {
    console.warn(`Invalid request: ${validationMessage}`);

    return Response.json(
      {
        emoji: "🙄",
        message: validationMessage,
      },
      { status: 400 }
    );
  }

  return await prepareResponse(stopId, lineLabel);
}

interface ValidationResult {
  invalid: boolean;
  validationMessage: string | null;
  stopId: number;
  lineLabel: string | null;
}

function geValidationResult(
  userStopId: string | null,
  userLineLabel: string | null
): ValidationResult {
  const result: ValidationResult = {
    invalid: true,
    validationMessage: null,
    stopId: 0,
    lineLabel: null,
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

  if (userLineLabel !== null) {
    if (userLineLabel.length === 0) {
      result.validationMessage = MESSAGE_LINE_LABEL_REQUIRED;
      return result;
    }

    result.lineLabel = userLineLabel;
  }

  result.invalid = false;

  return result;
}

async function prepareResponse(
  stopId: number,
  userLineLabel: string | null
): Promise<Response> {
  const response: StopEstimations = [[], []];

  // Data
  response[0] = await Adapter.getEstimationsData(stopId, userLineLabel);

  // Additional data
  if (response[0].length > 0) {
    if (userLineLabel === null) {
      // Add available lines for a stop
      response[1] = getLinesByStopId(stopId);
    } else {
      // Add available stops for a line
      response[1] = getNextStopsForLineByStopIdAndLineLabel(
        stopId,
        userLineLabel
      );
    }
  }

  const headers = new Headers();
  addAccessControlAllowOriginHeader(headers);

  return Response.json(response, { headers });
}

export default {
  checkConfiguration,
  getEstimations,
};
