import EstimationsService from "./services/estimations_service.ts";
import RouteService from "./services/route_service.ts";

const MESSAGE_ENDPOINT_NOT_FOUND = "Endpoint not found";

const availableEndpoints = {
  estimations: EstimationsService.getEstimations,
  route: RouteService.getRoute,
};

function checkConfiguration(): void {
  EstimationsService.checkConfiguration();
}

async function handleRequest(
  pathname: string,
  searchParams: URLSearchParams,
): Promise<Response> {
  const urlPattern = new URLPattern({ pathname: "/:version/:endpoint{/}?" });
  const urlPatternResult = urlPattern.exec({ pathname });
  const endpoint = urlPatternResult?.pathname.groups.endpoint || null;

  if (endpoint === null) {
    return Response.json({
      endpoints: Object.keys(availableEndpoints),
    });
  }

  const endpointIndex = endpoint as keyof typeof availableEndpoints;

  if (endpointIndex in availableEndpoints) {
    return await availableEndpoints[endpointIndex](searchParams);
  }

  console.error(`Unknown endpoint: ${endpoint}`);

  return Response.json(
    {
      message: MESSAGE_ENDPOINT_NOT_FOUND,
    },
    { status: 404 },
  );
}

export default {
  checkConfiguration,
  handleRequest,
};
