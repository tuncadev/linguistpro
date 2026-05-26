import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buildZoomOAuthUrl } from "@/lib/integrations/zoom/oauth";
import { parseQuery } from "@/lib/http/validation";
import { withApiHandler } from "@/lib/http/with-api-handler";
import { requireRoles } from "@/lib/auth/server-checks";

const querySchema = z.object({
  state: z.string().trim().min(1).max(512).optional(),
});

export const GET = withApiHandler(async (req: NextRequest) => {
  const auth = await requireRoles(req, ["TUTOR", "ADMIN"]);
  if (auth.ok === false) {
    return auth.response;
  }

  const query = parseQuery(req, querySchema);
  return NextResponse.json({
    data: {
      authorizationUrl: buildZoomOAuthUrl(query.state),
    },
  });
});
