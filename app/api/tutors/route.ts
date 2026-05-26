import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseQuery } from "@/lib/http/validation";
import { withApiHandler } from "@/lib/http/with-api-handler";
import { prisma } from "@/lib/prisma";
import { ensureDefaultTutorAndRepairCourses } from "@/lib/tutors/ensure-default-tutor";
import { publicTutorSelect, serializeTutor } from "@/lib/tutors/serialize";
import { resolveLocaleFromRequest } from "@/lib/i18n/api-messages";
import { loadLocaleMessagesRaw } from "@/lib/i18n/translation-registry";
import { localizeTutorFromMessages } from "@/lib/tutors/localization";

const querySchema = z.object({
  q: z.string().trim().max(160).optional(),
  take: z.coerce.number().int().min(1).max(100).optional(),
  skip: z.coerce.number().int().min(0).optional(),
});

export const GET = withApiHandler(async (req: NextRequest) => {
  const query = parseQuery(req, querySchema);
  const locale = resolveLocaleFromRequest(req);
  const localeMessages = await loadLocaleMessagesRaw(locale);
  await ensureDefaultTutorAndRepairCourses();

  const tutors = await prisma.user.findMany({
    where: {
      role: Role.TUTOR,
      OR: query.q
        ? [
            { name: { contains: query.q, mode: "insensitive" } },
            { bio: { contains: query.q, mode: "insensitive" } },
          ]
        : undefined,
    },
    orderBy: { createdAt: "asc" },
    take: query.take ?? 50,
    skip: query.skip ?? 0,
    select: publicTutorSelect,
  });

  return NextResponse.json({
    data: tutors.map((tutor) =>
      localizeTutorFromMessages(serializeTutor(tutor), localeMessages)
    ),
    meta: {
      count: tutors.length,
      take: query.take ?? 50,
      skip: query.skip ?? 0,
    },
  });
});
