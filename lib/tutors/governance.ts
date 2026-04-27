import { Role, TutorApprovalStatus } from "@prisma/client";
import { forbidden, notFound } from "@/lib/http/api-error";
import { prisma } from "@/lib/prisma";

export async function requireApprovedTutor(tutorId: string) {
  const tutor = await prisma.user.findUnique({
    where: { id: tutorId },
    select: {
      id: true,
      role: true,
      tutorApprovalStatus: true,
    },
  });

  if (!tutor || tutor.role !== Role.TUTOR) {
    notFound("Tutor not found");
  }

  if (tutor.tutorApprovalStatus !== TutorApprovalStatus.APPROVED) {
    forbidden("Tutor profile is not approved for publishing workflow");
  }

  return tutor;
}
