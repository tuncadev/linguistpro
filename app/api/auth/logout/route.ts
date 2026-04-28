import { NextRequest, NextResponse } from "next/server";
import {
  clearSessionCookieOptions,
  isHttpsRequest,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ message: "Logged out" });
  res.cookies.set(SESSION_COOKIE_NAME, "", clearSessionCookieOptions(isHttpsRequest(req)));
  return res;
}
