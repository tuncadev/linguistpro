import { NextRequest, NextResponse } from "next/server";
import { requireRoles } from "@/lib/auth/server-checks";

export async function POST(req: NextRequest) {
  const auth = await requireRoles(req, ["ADMIN"]);
  if (!auth.ok) {
    return auth.response;
  }

  return NextResponse.json({
    message: "Webhook API scaffold",
    status: "received",
    actorRole: auth.session.role,
  });
}
