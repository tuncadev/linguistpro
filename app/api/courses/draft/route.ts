import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRoles } from "@/lib/auth/server-checks";
import { generateCourseDraft } from "@/lib/ai/course-draft";
import { courseInclude, serializeCourse } from "@/lib/courses/serialize";
import { prisma } from "@/lib/prisma";

const createAiDraftSchema = z.object({
  topic: z.string().trim().min(2).max(160),
  languageId: z.string().trim().min(1),
  levelId: z.string().trim().min(1),
  imageUrl: z.string().trim().url().optional(),
  tutorId: z.string().trim().min(1).optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireRoles(req, ["TUTOR", "ADMIN"]);
  if (!auth.ok) {
    return auth.response;
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createAiDraftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid draft payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const payload = parsed.data;
  const tutorId = auth.session.role === "ADMIN" ? payload.tutorId ?? auth.session.id : auth.session.id;

  const [language, level, tutor] = await Promise.all([
    prisma.language.findUnique({ where: { id: payload.languageId } }),
    prisma.level.findUnique({ where: { id: payload.levelId } }),
    prisma.user.findUnique({ where: { id: tutorId } }),
  ]);

  if (!language) {
    return NextResponse.json({ error: "Language not found" }, { status: 400 });
  }
  if (!level) {
    return NextResponse.json({ error: "Level not found" }, { status: 400 });
  }
  if (!tutor) {
    return NextResponse.json({ error: "Tutor not found" }, { status: 400 });
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
}

