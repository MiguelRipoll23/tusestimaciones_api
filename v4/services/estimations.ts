import { getLinesByStopId } from "../utils/stop-utils.ts";
import { getStopsByStopIdAndLineLabel } from "../utils/line-utils.ts";

import { document, node, parse } from "../../deps.ts";
import { StopEstimations } from "../interfaces/stop-estimations.ts";
import { LineEstimations } from "../interfaces/line-estimations.ts";

const ESTIMATIONS_WEB_SERVICE =
  "http://195.55.43.235:9001/services/dinamica.asmx";

export async function getEstimations(
  urlSearchParams: URLSearchParams,
): Promise<Response> {
  const userStopId = urlSearchParams.get("stopId") ?? null;
  const userLineLabel = urlSearchParams.get("lineLabel") ?? null;

  // Log
  console.info(
    `getEstimations(stopId:${userStopId},lineLabel:${userLineLabel})`,
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
  lineLabel: string | null;
}

function geValidationResult(
  userStopId: string | null,
  userLineLabel: string | null,
): ValidationResult {
  const result: ValidationResult = {
    invalid: true,
    validationMessage: null,
    stopId: 0,
    lineLabel: null,
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

  if (userLineLabel !== null) {
    if (userLineLabel.length === 0) {
      result.validationMessage = "lineLabel is required";
      return result;
    }

    result.lineLabel = userLineLabel;
  }

  result.invalid = false;

  return result;
}

async function prepareResponse(
  stopId: number,
  userLineLabel: string | null,
): Promise<Response> {
  const response: StopEstimations = [[], []];

  response[0] = await sendRequest(stopId, userLineLabel);

  // Only if estimations are available
  if (response[0].length > 0) {
    if (userLineLabel === null) {
      // Add available lines for a stop
      response[1] = getLinesByStopId(stopId);
    } else {
      // Add available stops for a line
      response[1] = getStopsByStopIdAndLineLabel(stopId, userLineLabel);
    }
  }

  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");

  return Response.json(response, { headers });
}

async function sendRequest(
  stopId: number,
  userLineLabel: string | null,
): Promise<LineEstimations[]> {
  const lineLabel = userLineLabel ?? "*";
  const lineEstimations: LineEstimations[] = [];

  const body = '<?xml version="1.0" encoding="utf-8"?>' +
    `<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
        <GetPasoParada xmlns="http://tempuri.org/">
          <linea>${lineLabel}</linea>
          <parada>${stopId}</parada>
          <status>0</status>
        </GetPasoParada>
      </soap:Body>
    </soap:Envelope>`;

  const options = {
    method: "post",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      SOAPAction: "http://tempuri.org/GetPasoParada",
    },
    body: body,
  };

  await fetch(ESTIMATIONS_WEB_SERVICE, options)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Status code (" + response.status + ")");
      }

      return response.text();
    })
    .then((text) => {
      return parse(text, { flatten: true });
    })
    .then((document) => {
      parseDocument(document, lineEstimations);
    })
    .catch((error) => {
      console.error(error);
    });

  return lineEstimations;
}

function parseDocument(document: document, lineEstimations: LineEstimations[]) {
  const soapEnvelopeNode = document["soap:Envelope"] as node;
  const soapBodyNode = soapEnvelopeNode?.["soap:Body"] as node;
  const soapResponseNode = soapBodyNode?.["GetPasoParadaResponse"] as node;
  const soapResultNode = soapResponseNode?.["GetPasoParadaResult"] as node;
  const soapItemsNode = soapResultNode?.["PasoParada"] as node;

  if (soapItemsNode === undefined) {
    return;
  }

  const soapItems: node[] = [];

  if (Array.isArray(soapItemsNode)) {
    soapItems.push(...soapItemsNode);
  } else {
    soapItems.push(soapItemsNode);
  }

  for (let i = soapItems.length - 1; i >= 0; i--) {
    const soapItem = soapItems[i] as node;
    const lineLabel = soapItem["linea"] as string;
    const lineDestination = soapItem["ruta"] as string;
    const lineEstimation1 = soapItem["e1"] as node;
    const lineMinutes1 = lineEstimation1?.["minutos"] as number;
    const lineEstimation2 = soapItem["e2"] as node;
    const lineMinutes2 = lineEstimation2?.["minutos"] as number;

    const result: LineEstimations = [
      lineLabel,
      lineDestination,
      lineMinutes1,
      lineMinutes2,
    ];

    lineEstimations.push(result);
  }

  // Order by remaining time
  lineEstimations = lineEstimations.sort((a, b) => {
    if (a[2] === b[2]) {
      return 0;
    } else if (a[2] === null) {
      return -1;
    } else if (b[2] === null) {
      return 1;
    } else if (a[2] > b[2]) {
      return 1;
    } else if (a[2] < b[2]) {
      return -1;
    }

    return -1;
  });
}
