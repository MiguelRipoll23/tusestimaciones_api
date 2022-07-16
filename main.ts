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
  const pathname = url.pathname;
  const searchParams = url.searchParams;

  const paths = pathname.split("/");
  const version = paths[1] || null;

  if (version === null) {
    return Response.json({
      emoji: "🦕",
      versions: Object.keys(availableVersions),
    });
  } else if (version in availableVersions) {
    const versionIndex = version as keyof typeof availableVersions;
    return await availableVersions[versionIndex].handler(paths, searchParams);
  }

  return Response.json(
    {
      emoji: "☄️",
      message: "Not found",
    },
    { status: 404 },
  );
}

checker();
serve(handler);
