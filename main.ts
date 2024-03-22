// Versions
import { sendNotFoundResponse } from "./versions/v4/utils/response_utils.ts";
import v4 from "./versions/v4/v4.ts";

const versions = { v4 };

for (const version in versions) {
  const versionIndex = version as keyof typeof versions;
  versions[versionIndex].validateConfiguration();
}

async function handleRequest(
  request: Request,
  serverHandlerInfo: Deno.ServeHandlerInfo,
): Promise<Response> {
  const url = new URL(request.url);
  const userAgent = request.headers.get("user-agent");
  const pathname = url.pathname;
  const searchParams = url.searchParams;

  const remoteAddress = serverHandlerInfo.remoteAddr;
  const ipAddress = remoteAddress.hostname;

  console.info(userAgent, pathname, searchParams.toString(), ipAddress);

  const urlPattern = new URLPattern({ pathname: "/:version{/*}?" });
  const urlPatternResult = urlPattern.exec({ pathname });
  const version = urlPatternResult?.pathname.groups.version || null;

  if (version === null) {
    return Response.json({
      versions: Object.keys(versions),
    });
  }

  if (version in versions) {
    const versionIndex = version as keyof typeof versions;

    return await versions[versionIndex].handleRequest(pathname, searchParams);
  }

  return sendNotFoundResponse(version);
}

Deno.serve(handleRequest);
