import { NextRequest, NextResponse } from "next/server";
import { requireRoles } from "@/lib/auth/server-checks";

export async function GET() {
  return NextResponse.json({
    message: "Courses API scaffold",
    status: "ok",
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireRoles(req, ["TUTOR", "ADMIN"]);
  if (!auth.ok) {
    return auth.response;
  }

  return NextResponse.json(
    {
      message: "Course create API scaffold",
      status: "accepted",
      actorRole: auth.session.role,
    },
    { status: 201 }
  );
}
