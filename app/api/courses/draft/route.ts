import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRoles } from "@/lib/auth/server-checks";
import { generateCourseDraft } from "@/lib/ai/course-draft";
import { courseInclude, serializeCourse } from "@/lib/courses/serialize";
import { badRequest } from "@/lib/http/api-error";
import { parseJsonBody } from "@/lib/http/validation";
import { withApiHandler } from "@/lib/http/with-api-handler";
import { prisma } from "@/lib/prisma";
import { requireApprovedTutor } from "@/lib/tutors/governance";

const createAiDraftSchema = z.object({
  topic: z.string().trim().min(2).max(160),
  languageId: z.string().trim().min(1),
  levelId: z.string().trim().min(1),
  imageUrl: z.string().trim().url().optional(),
  tutorId: z.string().trim().min(1).optional(),
});

export const POST = withApiHandler(async (req: NextRequest) => {
  const auth = await requireRoles(req, ["TUTOR", "ADMIN"]);
  if (auth.ok === false) {
    return auth.response;
  }

  const payload = await parseJsonBody(req, createAiDraftSchema);
  const isAdmin = auth.session.role === "ADMIN";
  let tutorId = auth.session.id;

  if (!isAdmin) {
    await requireApprovedTutor(auth.session.id);
  }

  if (isAdmin) {
    if (payload.tutorId) {
      tutorId = payload.tutorId;
    } else {
      const fallbackTutor = await prisma.user.findFirst({
        where: { role: Role.TUTOR },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });

      if (!fallbackTutor) {
        badRequest("No tutor available. Create a tutor before generating AI drafts.");
      }

      tutorId = fallbackTutor.id;
    }
  }

  const [language, level, tutor] = await Promise.all([
    prisma.language.findUnique({ where: { id: payload.languageId } }),
    prisma.level.findUnique({ where: { id: payload.levelId } }),
    prisma.user.findFirst({ where: { id: tutorId, role: Role.TUTOR } }),
  ]);

  if (!language) {
    badRequest("Language not found");
  }
  if (!level) {
    badRequest("Level not found");
  }
  if (!tutor) {
    badRequest("Tutor not found or user is not a tutor");
  }

  const generated = await generateCourseDraft(payload.topic, language.name, level.name);
  if (!generated) {
    return NextResponse.json({ error: "Failed to generate AI draft" }, { status: 502 });
  }

  const created = await prisma.course.create({
    data: {
      title: generated.title,
      description: generated.description,
      price: generated.price,
      imageUrl: payload.imageUrl,
      tutorId,
      languageId: payload.languageId,
      levelId: payload.levelId,
      status: "DRAFT",
      syllabusSections: generated.syllabus.length
        ? {
            create: generated.syllabus.map((title, index) => ({
              title,
              position: index + 1,
            })),
          }
        : undefined,
    },
    include: courseInclude,
  });

  return NextResponse.json(
    {
      data: serializeCourse(created),
      generatedFromTopic: payload.topic,
    },
    { status: 201 }
  );
});
