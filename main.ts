import { serve } from "https://deno.land/std@0.141.0/http/server.ts";

// Versions
import v4 from "./versions/v4/mod.ts";

const availableVersions = { v4 };

function checker(): void {
  for (const version in availableVersions) {
    const versionIndex = version as keyof typeof availableVersions;
    availableVersions[versionIndex].checker();
  }
}

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const urlPattern = new URLPattern({ pathname: '/:version{/*}?' });
  const urlPatternResult = urlPattern.exec(url);
  const version = urlPatternResult?.pathname.groups.version || null;

  if (version === null) {
    return Response.json({
      emoji: "🦕",
      versions: Object.keys(availableVersions),
    });
  } else if (version in availableVersions) {
    const versionIndex = version as keyof typeof availableVersions;
    return await availableVersions[versionIndex].handler(url);
  }

  console.error(`Unknown version: ${version}`);

  return Response.json(
    {
      emoji: "☄️",
      message: "Version not found",
    },
    { status: 404 }
  );
}

checker();
serve(handler);
