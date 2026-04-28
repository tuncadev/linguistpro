import { NextRequest, NextResponse } from "next/server";
import { requireRoles } from "@/lib/auth/server-checks";
import { withApiHandler } from "@/lib/http/with-api-handler";
import { fetchTutorIntegritySnapshot } from "@/lib/tutors/integrity";

export const GET = withApiHandler(async (req: NextRequest) => {
  const auth = await requireRoles(req, ["ADMIN"]);
  if (auth.ok === false) {
    return auth.response;
  }

  const snapshot = await fetchTutorIntegritySnapshot();
  return NextResponse.json({ data: snapshot });
});
