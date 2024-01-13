await updateStops();
await updateLines();
await updateStopRoutes();
await updateLineRoutes();

async function updateStops(): Promise<void> {
  const response = await fetch(
    "http://datos.santander.es/api/rest/datasets/paradas_bus.json?items=3000&sort=asc",
  );

  const data = await response.json();
  const resources = data.resources;
  // deno-lint-ignore no-explicit-any
  const updatedDataList: { [key: number]: any[] } = {};

  for (const item of resources) {
    const stopId = parseInt(item["ayto:numero"]);
    const stopName = item["ayto:parada"];
    const latitude = parseFloat(item["wgs84_pos:lat"]);
    const longitude = parseFloat(item["wgs84_pos:long"]);

    updatedDataList[stopId] = [];
    updatedDataList[stopId].push(stopId);
    updatedDataList[stopId].push(latitude);
    updatedDataList[stopId].push(longitude);

    const fixedStopName = stopName
      .replace(" S/N", "")
      .replace(" s/n", "")
      .replace(" sin numero", "")
      .replace("( ", "(")
      .replace(" )", ")")
      .replace("deValdecilla", "de Valdecilla")
      .replace("LLano", "Llano")
      .replace("LLuja", "Lluja")
      .replace("Castilla71", "Castilla 71")
      .replace("Einstein.14", "Einstein 14")
      .replace("Tetuan .", "Tetuan")
      .replace("Gloria144", "Gloria 144")
      .replace("Davila.", "Davila")
      .replace("Deporte .", "Deporte")
      .replace("Adarzo.48", "Adarzo 48")
      .replace("Camnino .", "Camino")
      .replace("Cossio.", "Cossio")
      .replace("vega lamera", "Vega Lamera")
      .trim();

    updatedDataList[stopId].push(fixedStopName);
  }

  const updatedData = JSON.stringify(updatedDataList);
  await Deno.writeTextFile("versions/v4/data/stops.min.json", updatedData);
  await Deno.writeTextFile(
    "../tusestimaciones-web/src/json/stops.min.json",
    updatedData,
  );

  console.log("Stops updated");
}

async function updateLines(): Promise<void> {
  const response = await fetch(
    "http://datos.santander.es/api/rest/datasets/lineas_bus.json?items=3000&sort=asc",
  );

  const data = await response.json();
  const resources = data.resources;
  const outputData = [];

  for (const item of resources) {
    let lineLabel = item["ayto:numero"];
    lineLabel = lineLabel.replace("99", "LANZADERA");

    outputData.push(lineLabel);
  }

  const updatedData: string = JSON.stringify(outputData);
  await Deno.writeTextFile("versions/v4/data/lines.min.json", updatedData);

  console.log("Lines updated");
}

async function updateStopRoutes(): Promise<void> {
  const response = await fetch(
    "http://datos.santander.es/api/rest/datasets/lineas_bus_secuencia.json?items=3000&sort=asc",
  );

  const data = await response.json();
  const resources = data.resources;
  const updatedDataList: Record<string, Record<string, number[][]>> = {};

  for (const item of resources) {
    const lineLabel = item["dc:EtiquetaLinea"];
    const stopId = parseInt(item["ayto:NParada"]);
    const stopName = item["ayto:NombreParada"];
    let routeId = item["dc:identifier"];
    const point = parseInt(item["ayto:PuntoKM"]);

    routeId = routeId.split("-");
    routeId = routeId[1] + routeId[2] + routeId[3];

    if (!(lineLabel in updatedDataList)) {
      updatedDataList[lineLabel] = {};
    }

    if (!(routeId in updatedDataList[lineLabel])) {
      updatedDataList[lineLabel][routeId] = [];
    }

    updatedDataList[lineLabel][routeId].push([point, stopId, stopName]);
    updatedDataList[lineLabel][routeId].sort((a, b) => a[0] - b[0]);
  }

  // Remove order field
  for (const lineLabel in updatedDataList) {
    const line = updatedDataList[lineLabel];

    for (const routeId in line) {
      const route = updatedDataList[lineLabel][routeId];

      for (const stop of route) {
        stop.shift();
      }
    }
  }

  const updatedData: string = JSON.stringify(updatedDataList);
  await Deno.writeTextFile(
    "versions/v4/data/routes-stops.min.json",
    updatedData,
  );

  console.log("Stop routes updated");
}

async function updateLineRoutes(): Promise<void> {
  const response = await fetch(
    "http://datos.santander.es/api/rest/datasets/lineas_bus_secuencia.json?items=3000&sort=asc",
  );
  const data = await response.json();

  const resources = data.resources;
  const updatedDataList: Record<number, Record<string, string | string[]>> = {};

  for (const item of resources) {
    const lineLabel = item["dc:EtiquetaLinea"];
    const stopId = parseInt(item["ayto:NParada"]);

    let routeId = item["dc:identifier"];
    routeId = routeId.split("-");
    routeId = routeId[1] + routeId[2] + routeId[3];

    if (!(stopId in updatedDataList)) {
      updatedDataList[stopId] = {};
    }

    if (!(lineLabel in updatedDataList[stopId])) {
      updatedDataList[stopId][lineLabel] = [];
    }

    updatedDataList[stopId][lineLabel] = routeId;
  }

  const updatedData = JSON.stringify(updatedDataList);
  await Deno.writeTextFile(
    "versions/v4/data/routes-lines.min.json",
    updatedData,
  );

  console.log("Line routes updated");
}
