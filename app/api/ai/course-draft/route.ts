import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRoles } from "@/lib/auth/server-checks";
import { generateCourseDraft } from "@/lib/ai/course-draft";

const requestSchema = z.object({
  topic: z.string().trim().min(2).max(160),
  language: z.string().trim().min(2).max(80),
  level: z.string().trim().min(1).max(20),
});

export async function POST(req: NextRequest) {
  const auth = await requireRoles(req, ["TUTOR", "ADMIN"]);
  if (auth.ok === false) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const draft = await generateCourseDraft(
      parsed.data.topic,
      parsed.data.language,
      parsed.data.level
    );

    if (!draft) {
      return NextResponse.json({ error: "Failed to generate course draft" }, { status: 502 });
    }

    return NextResponse.json({
      draft,
      generatedByRole: auth.session.role,
    });
  } catch (error) {
    console.error("ai course-draft error", error);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}

