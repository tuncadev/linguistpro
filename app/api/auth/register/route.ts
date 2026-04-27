import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import {
  createSessionToken,
  sessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid registration payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      return NextResponse.json({ error: "Email is already registered" }, { status: 409 });
    }

    const passwordHash = await hashPassword(parsed.data.password);

    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email,
        passwordHash,
        role: "STUDENT",
      },
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

    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const res = NextResponse.json(
      {
        message: "Registered successfully",
        user,
      },
      { status: 201 }
    );

    res.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
    return res;
  } catch (error) {
    console.error("register error", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
