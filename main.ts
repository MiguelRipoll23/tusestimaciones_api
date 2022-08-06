import { serve } from "https://deno.land/std@0.141.0/http/server.ts";

// Versions
import v4 from "./versions/v4/mod.ts";

const VERSION_PATTERN = /v\d+/;
const MESSAGE_VERSION_NOT_FOUND = "Version not found";
const MESSAGE_NOT_FOUND = "Not found";

const availableVersions = { v4 };

function checker(): void {
  for (const version in availableVersions) {
    const versionIndex = version as keyof typeof availableVersions;
    availableVersions[versionIndex].checker();
  }
}

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const pathname = url.pathname;
  const searchParams = url.searchParams;

  const urlPattern = new URLPattern({ pathname: "/:version{/*}?" });
  const urlPatternResult = urlPattern.exec({ pathname });
  const version = urlPatternResult?.pathname.groups.version || null;

  if (version === null) {
    return Response.json({
      emoji: "🦕",
      versions: Object.keys(availableVersions),
    });
  }

  if (VERSION_PATTERN.test(version)) {
    if (version in availableVersions) {
      const versionIndex = version as keyof typeof availableVersions;

      return await availableVersions[versionIndex].handler(
        pathname,
        searchParams
      );
    } else {
      console.warn(`Unknown version: ${version}`);

      return Response.json(
        {
          emoji: "☄️",
          message: MESSAGE_VERSION_NOT_FOUND,
        },
        { status: 404 }
      );
    }
  }

  return Response.json(
    {
      emoji: "☄️",
      message: MESSAGE_NOT_FOUND,
    },
    { status: 404 }
  );
}

checker();
serve(handler);
