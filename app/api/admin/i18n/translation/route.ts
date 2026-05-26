import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRoles } from "@/lib/auth/server-checks";
import { getTranslationKeyValue, updateTranslationKey } from "@/lib/i18n/translation-file-writer";

const writeSchema = z.object({
  locale: z.enum(["uk", "en", "es", "tr", "ru"]),
  key: z.string().trim().min(1),
  value: z.unknown(),
  allowCreateKey: z.boolean().optional().default(false),
});

export async function GET(req: NextRequest) {
  const auth = await requireRoles(req, ["ADMIN"]);
  if (auth.ok === false) {
    return auth.response;
  }

  const locale = req.nextUrl.searchParams.get("locale") ?? "uk";
  const key = req.nextUrl.searchParams.get("key");

  if (!key?.trim()) {
    return NextResponse.json({ error: "Query parameter 'key' is required" }, { status: 400 });
  }

  try {
    const result = await getTranslationKeyValue({ locale, key });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to read translation key" },
      { status: 400 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireRoles(req, ["ADMIN"]);
  if (auth.ok === false) {
    return auth.response;
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = writeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const updated = await updateTranslationKey(parsed.data);
    return NextResponse.json({
      message: "Translation updated",
      ...updated,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update translation";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
