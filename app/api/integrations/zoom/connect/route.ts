import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRoles } from "@/lib/auth/server-checks";
import { exchangeZoomAuthCode } from "@/lib/integrations/zoom/oauth";
import { upsertZoomConnectionFromToken } from "@/lib/integrations/zoom/token-store";
import { parseJsonBody } from "@/lib/http/validation";
import { withApiHandler } from "@/lib/http/with-api-handler";

const connectSchema = z.object({
  code: z.string().trim().min(1),
});

export const POST = withApiHandler(async (req: NextRequest) => {
  const auth = await requireRoles(req, ["TUTOR", "ADMIN"]);
  if (auth.ok === false) {
    return auth.response;
  }

  const payload = await parseJsonBody(req, connectSchema);
  const token = await exchangeZoomAuthCode(payload.code);
  const connection = await upsertZoomConnectionFromToken({
    userId: auth.session.id,
    token,
  });

  return NextResponse.json({
    data: {
      connected: true,
      connection: {
        ...connection,
        expiresAt: connection.expiresAt.toISOString(),
        connectedAt: connection.connectedAt.toISOString(),
        lastRefreshedAt: connection.lastRefreshedAt?.toISOString() ?? null,
        revokedAt: connection.revokedAt?.toISOString() ?? null,
        createdAt: connection.createdAt.toISOString(),
        updatedAt: connection.updatedAt.toISOString(),
      },
    },
  });
});
