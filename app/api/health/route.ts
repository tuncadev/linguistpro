import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/http/with-api-handler";

export const GET = withApiHandler(async () => {
  return NextResponse.json({
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    },
  });
});
