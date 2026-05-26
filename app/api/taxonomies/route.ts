import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/http/with-api-handler";
import { prisma } from "@/lib/prisma";

export const GET = withApiHandler(async () => {
  const [languages, levels] = await Promise.all([
    prisma.language.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        code: true,
      },
    }),
    prisma.level.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
      },
    }),
  ]);

  return NextResponse.json({
    data: {
      languages,
      levels,
    },
    meta: {
      languageCount: languages.length,
      levelCount: levels.length,
    },
  });
});

