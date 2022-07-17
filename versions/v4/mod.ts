import EstimationsService from "./services/estimations_service.ts";
import RouteService from "./services/route_service.ts";

const availableEndpoints = {
  estimations: EstimationsService.getEstimations,
  route: RouteService.getRoute,
};

function checker(): void {
  EstimationsService.checkConfiguration();
}

async function handler(url: URL): Promise<Response> {
  const urlPattern = new URLPattern({ pathname: "/:version/:endpoint{/}?" });
  const urlPatternResult = urlPattern.exec(url);

  const version = urlPatternResult?.pathname.groups.version || "v?";
  const endpoint = urlPatternResult?.pathname.groups.endpoint || null;

  if (endpoint === null) {
    return Response.json({
      emoji: "🦖",
      endpoints: Object.keys(availableEndpoints),
    });
  }

  const endpointIndex = endpoint as keyof typeof availableEndpoints;

  if (endpointIndex in availableEndpoints) {
    const urlSearchParams = url.searchParams;
    return await availableEndpoints[endpointIndex](version, urlSearchParams);
  }

  console.error(`Unknown endpoint: ${endpoint}`);

  return Response.json(
    {
      emoji: "☄️",
      message: "Endpoint not found",
    },
    { status: 404 }
  );
}

export default {
  checker,
  handler,
};
