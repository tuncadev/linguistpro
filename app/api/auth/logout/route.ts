import { NextResponse } from "next/server";
import {
  clearSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session";

export async function POST() {
  const res = NextResponse.json({ message: "Logged out" });
  res.cookies.set(SESSION_COOKIE_NAME, "", clearSessionCookieOptions());
  return res;
}

