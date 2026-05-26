import { NextRequest, NextResponse } from "next/server";
import type { AppRole } from "@/lib/auth/rbac";
import { getSessionFromRequest } from "@/lib/auth/request-session";
import type { SessionUser } from "@/lib/auth/session";
import { apiMessage } from "@/lib/i18n/api-messages";

type AuthCheckSuccess = {
  ok: true;
  session: SessionUser;
};

type AuthCheckFailure = {
  ok: false;
  response: NextResponse;
};

export type AuthCheckResult = AuthCheckSuccess | AuthCheckFailure;

export async function requireAuthenticated(req: NextRequest): Promise<AuthCheckResult> {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: apiMessage(req, "errors.unauthorized") }, { status: 401 }),
    };
  }

  return { ok: true, session };
}

export async function requireRoles(
  req: NextRequest,
  allowedRoles: AppRole[]
): Promise<AuthCheckResult> {
  const auth = await requireAuthenticated(req);
  if (!auth.ok) {
    return auth;
  }

  if (!allowedRoles.includes(auth.session.role)) {
    return {
      ok: false,
      response: NextResponse.json({ error: apiMessage(req, "errors.forbidden") }, { status: 403 }),
    };
  }

  return auth;
}
