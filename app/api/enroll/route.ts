import { NextRequest, NextResponse } from "next/server";
import { requireRoles } from "@/lib/auth/server-checks";

export async function POST(req: NextRequest) {
  const auth = await requireRoles(req, ["STUDENT"]);
  if (!auth.ok) {
    return auth.response;
  }

  return NextResponse.json({
    message: "Enroll API scaffold",
    status: "accepted",
    actorRole: auth.session.role,
  });
}
