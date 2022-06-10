import { getEstimations } from "./services/estimations_service.ts";
import { getRoute } from "./services/route_service.ts";

const availableEndpoints = { estimations: getEstimations, route: getRoute };

export async function handler(
  paths: string[],
  urlSearchParams: URLSearchParams,
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
    { status: 404 },
  );
}

export default {
  handler,
};
