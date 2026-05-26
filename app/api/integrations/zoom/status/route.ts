import { NextRequest, NextResponse } from "next/server";
import { requireRoles } from "@/lib/auth/server-checks";
import {
  getZoomAccessTokenForUser,
  getZoomConnectionStatusForUser,
} from "@/lib/integrations/zoom/token-store";
import { withApiHandler } from "@/lib/http/with-api-handler";

export const GET = withApiHandler(async (req: NextRequest) => {
  const auth = await requireRoles(req, ["TUTOR", "ADMIN"]);
  if (auth.ok === false) {
    return auth.response;
  }

  const status = await getZoomConnectionStatusForUser(auth.session.id);
  return NextResponse.json({ data: status });
});

export const POST = withApiHandler(async (req: NextRequest) => {
  const auth = await requireRoles(req, ["TUTOR", "ADMIN"]);
  if (auth.ok === false) {
    return auth.response;
  }

  const accessToken = await getZoomAccessTokenForUser({
    userId: auth.session.id,
  });

  return NextResponse.json({
    data: {
      refreshed: true,
      hasAccessToken: Boolean(accessToken),
    },
  });
});
