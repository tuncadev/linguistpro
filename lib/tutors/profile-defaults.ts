import type { TutorPedagogicalModule, TutorStatModule } from "@/types";

export const DEFAULT_TUTOR_LOCATION = "Barcelona, Spain HQ";
export const DEFAULT_TUTOR_LANGUAGES = "Trilingual (ES, EN, FR)";

export const DEFAULT_TUTOR_PROFILE_HIGHLIGHTS = [
  "Accredited by National Board",
  "Linguistic Research Fellow",
  "Catalina Impact Award 2023",
  "Advanced Curriculum Designer",
];

export const DEFAULT_TUTOR_PROFILE_STATS: TutorStatModule[] = [
  { id: "stat-graduates", label: "Graduates", value: "15400" },
  { id: "stat-rating", label: "Rating", value: "4.9" },
];

export const DEFAULT_TUTOR_PEDAGOGICAL_MODULES: TutorPedagogicalModule[] = [
  {
    id: "module-visual-integration",
    title: "Visual Integration",
    description:
      "Leveraging the latest in cognitive visual learning to create memory anchors that last a lifetime.",
  },
  {
    id: "module-active-fluency",
    title: "Active Fluency",
    description:
      "Focusing on high-output conversation practice from day one, rather than passive absorption.",
  },
];
