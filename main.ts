import { serve } from "./deps.ts";

// Versions
import v4 from "./versions/v4/mod.ts";

const VERSION_PATTERN = /v\d+/;
const MESSAGE_VERSION_NOT_FOUND = "Version not found";
const MESSAGE_NOT_FOUND = "Not found";

const availableVersions = { v4 };

function checkConfiguration(): void {
  for (const version in availableVersions) {
    const versionIndex = version as keyof typeof availableVersions;
    availableVersions[versionIndex].checkConfiguration();
  }
}

async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const pathname = url.pathname;
  const searchParams = url.searchParams;

  const urlPattern = new URLPattern({ pathname: "/:version{/*}?" });
  const urlPatternResult = urlPattern.exec({ pathname });
  const version = urlPatternResult?.pathname.groups.version || null;

  if (version === null) {
    return Response.json({
      versions: Object.keys(availableVersions),
    });
  }

  if (VERSION_PATTERN.test(version)) {
    if (version in availableVersions) {
      const versionIndex = version as keyof typeof availableVersions;

      return await availableVersions[versionIndex].handleRequest(
        pathname,
        searchParams
      );
    } else {
      console.warn(`Unknown version: ${version}`);

      return Response.json(
        {
          message: MESSAGE_VERSION_NOT_FOUND,
        },
        { status: 404 }
      );
    }
  }

  return Response.json(
    {
      message: MESSAGE_NOT_FOUND,
    },
    { status: 404 }
  );
}

checkConfiguration();
serve(handleRequest);
