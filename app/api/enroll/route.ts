import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    message: "Enroll API scaffold",
    status: "accepted",
  });
}

