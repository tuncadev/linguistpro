import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRoles } from "@/lib/auth/server-checks";
import { parseQuery } from "@/lib/http/validation";
import { withApiHandler } from "@/lib/http/with-api-handler";
import { getMetricsSnapshot } from "@/lib/observability/metrics";

const metricsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

export const GET = withApiHandler(async (req: NextRequest) => {
  const auth = await requireRoles(req, ["ADMIN"]);
  if (auth.ok === false) {
    return auth.response;
  }

  const query = parseQuery(req, metricsQuerySchema);
  return NextResponse.json({
    data: getMetricsSnapshot(query.limit ?? 50),
  });
});
