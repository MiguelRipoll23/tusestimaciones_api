import { document, node, parse } from "../deps.ts";
import { LineEstimations } from "../versions/v4/interfaces/line_estimations_interface.ts";

// Constants
const ENV_ESTIMATIONS_WEB_SERVICE_URL = "ESTIMATIONS_WEB_SERVICE_URL";

// Variables
let estimationsWebServiceUrl: string | null | undefined = null;

function checkConfiguration() {
  estimationsWebServiceUrl = Deno.env.get(ENV_ESTIMATIONS_WEB_SERVICE_URL);

  if (estimationsWebServiceUrl === undefined) {
    throw new Error(
      "Missing configuration variable: " + ENV_ESTIMATIONS_WEB_SERVICE_URL
    );
  }

  console.info("Estimations Web Service URL: " + estimationsWebServiceUrl);
}

async function getEstimationsData(
  stopId: number,
  userLineLabel: string | null
): Promise<LineEstimations[]> {
  const lineLabel = userLineLabel ?? "*";
  const lineEstimations: LineEstimations[] = [];

  const body =
    '<?xml version="1.0" encoding="utf-8"?>' +
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

  if (
    estimationsWebServiceUrl === undefined ||
    estimationsWebServiceUrl === null
  ) {
    console.error(
      "Missing configuration variable: " + ENV_ESTIMATIONS_WEB_SERVICE_URL
    );
    return lineEstimations;
  }

  await fetch(estimationsWebServiceUrl, options)
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
    const soapItemNode = soapItems[i] as node;
    const lineLabelNode = soapItemNode["linea"] as string;
    const lineDestinationNode = soapItemNode["ruta"] as string;
    const lineEstimation1Node = soapItemNode["e1"] as node;
    const lineEstimation2Node = soapItemNode["e2"] as node;

    let lineLabel = "0";

    if (typeof lineLabelNode === "number") {
      lineLabel = (lineLabelNode as number).toString();
    } else if (typeof lineLabelNode === "string") {
      lineLabel = lineLabelNode;
    }

    const lineMinutes1 = lineEstimation1Node?.["minutos"] as number;
    const lineMinutes2 = lineEstimation2Node?.["minutos"] as number;

    const result: LineEstimations = [
      lineLabel,
      lineDestinationNode,
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

export default {
  checkConfiguration,
  getEstimationsData,
};
