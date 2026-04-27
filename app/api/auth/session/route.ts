import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/request-session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
      bio: true,
      rating: true,
      studentCount: true,
      coursesAuthored: true,
    },
  });

  return NextResponse.json({
    authenticated: true,
    user: user ?? {
      id: session.id,
      name: session.email,
      email: session.email,
      role: session.role,
      avatarUrl: null,
      bio: null,
      rating: null,
      studentCount: null,
      coursesAuthored: null,
    },
  });
}
