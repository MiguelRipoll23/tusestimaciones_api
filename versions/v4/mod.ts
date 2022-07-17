import EstimationsService from "./services/estimations_service.ts";
import RouteService from "./services/route_service.ts";

const availableEndpoints = {
  estimations: EstimationsService.getEstimations,
  route: RouteService.getRoute,
};

function checker(): void {
  EstimationsService.checkConfiguration();
}

async function handler(
  paths: string[],
  urlSearchParams: URLSearchParams
): Promise<Response> {
  const endpoint = paths[2] ?? null;

  if (endpoint === null) {
    return Response.json({
      emoji: "🦖",
      endpoints: Object.keys(availableEndpoints),
    });
  }

  const endpointIndex = endpoint as keyof typeof availableEndpoints;

  if (endpointIndex in availableEndpoints) {
    return await availableEndpoints[endpointIndex](urlSearchParams);
  }

  return Response.json(
    {
      emoji: "☄️",
      message: "Not found",
    },
    { status: 404 }
  );
}

export default {
  checker,
  handler,
};
