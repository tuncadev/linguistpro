import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/http/with-api-handler";
import { prisma } from "@/lib/prisma";

const ROLE_ORDER: Role[] = [Role.ADMIN, Role.TUTOR, Role.STUDENT];

export const GET = withApiHandler(async () => {
  const users = await prisma.user.findMany({
    where: {
      role: {
        in: ROLE_ORDER,
      },
    },
    orderBy: { createdAt: "asc" },
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

  const firstByRole = new Map<Role, (typeof users)[number]>();
  for (const user of users) {
    if (!firstByRole.has(user.role)) {
      firstByRole.set(user.role, user);
    }
  }

  const data = ROLE_ORDER.map((role) => firstByRole.get(role))
    .filter((user): user is NonNullable<typeof user> => Boolean(user))
    .map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      rating: user.rating,
      studentCount: user.studentCount,
      coursesAuthored: user.coursesAuthored,
    }));

  return NextResponse.json({
    data,
    meta: {
      count: data.length,
    },
  });
});
