// Versions
import v4 from "./versions/v4/v4.ts";

const versions = { v4 };

for (const version in versions) {
  const versionIndex = version as keyof typeof versions;
  versions[versionIndex].checkConfiguration();
}

async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const userAgent = request.headers.get("user-agent");
  const pathname = url.pathname;
  const searchParams = url.searchParams;

  console.debug(userAgent, pathname, searchParams.toString());

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

  console.warn("Not found: " + version);

  return Response.json(
    {
      message: "Not found",
    },
    { status: 404 },
  );
}

Deno.serve(handleRequest);
