import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { normalizeLocale } from "@/i18n/routing";
import { localizePath } from "@/i18n/locale-path";
import { courseInclude, serializeCourse } from "@/lib/courses/serialize";
import type { CourseWithRelations } from "@/lib/courses/serialize";
import { localizeCourseFromMessages } from "@/lib/courses/localization";
import { loadLocaleMessagesRaw } from "@/lib/i18n/translation-registry";
import { prisma } from "@/lib/prisma";

type CourseOrLanguagePageProps = {
  params: Promise<{ id: string }>;
};

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default async function CourseOrLanguagePage({ params }: CourseOrLanguagePageProps) {
  const locale = normalizeLocale(await getLocale());
  const localeMessages = await loadLocaleMessagesRaw(locale);
  const t = await getTranslations("pages");
  const { id } = await params;

  let course: CourseWithRelations | null = null;
  try {
    course = await prisma.course.findFirst({
      where: {
        id,
        status: "PUBLISHED",
      },
      include: courseInclude,
    });
  } catch (error) {
    console.error("course detail query failed", error);
    course = null;
  }

  if (course) {
    const localizedCourse = localizeCourseFromMessages(serializeCourse(course), localeMessages);

    return (
      <main className="mx-auto max-w-5xl px-6 py-12">
        <header className="mb-8 space-y-3">
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">
            {t("courses.title")}
          </p>
          <h1 className="text-4xl font-black text-slate-900">{localizedCourse.title}</h1>
          <p className="text-slate-600">{localizedCourse.description}</p>
        </header>

        <section className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <img
            src={localizedCourse.imageUrl || "https://picsum.photos/seed/course-fallback/1200/600"}
            alt={localizedCourse.title}
            className="h-72 w-full object-cover"
          />
          <div className="grid gap-3 p-6 sm:grid-cols-2">
            <p className="text-sm text-slate-600">
              <span className="font-bold text-slate-900">{localizedCourse.studentCount}</span> students
            </p>
            <p className="text-sm text-slate-600">
              Price: <span className="font-bold text-slate-900">${localizedCourse.price}</span>
            </p>
            <p className="text-sm text-slate-600">
              Rating: <span className="font-bold text-slate-900">{localizedCourse.rating.toFixed(1)}</span>
            </p>
            <p className="text-sm text-slate-600">
              Reviews: <span className="font-bold text-slate-900">{localizedCourse.reviews}</span>
            </p>
          </div>
        </section>

        <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-black text-slate-900">Learning Objectives</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
            {localizedCourse.learningObjectives.map((item, index) => (
              <li key={`${localizedCourse.id}-objective-${index}`}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-black text-slate-900">Enrollment Includes</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
            {localizedCourse.enrollmentIncludes.map((item, index) => (
              <li key={`${localizedCourse.id}-enrollment-${index}`}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-black text-slate-900">Curriculum</h2>
          <div className="space-y-4">
            {localizedCourse.syllabus.map((section) => (
              <article key={section.id} className="rounded-2xl border border-slate-200 p-4">
                <h3 className="text-base font-black text-slate-900">{section.title}</h3>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
                  {section.lessons.map((lesson) => (
                    <li key={lesson.id}>
                      {lesson.title} ({lesson.type.toLowerCase()})
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      </main>
    );
  }

  let publishedCourses: CourseWithRelations[] = [];
  try {
    publishedCourses = await prisma.course.findMany({
      where: { status: "PUBLISHED" },
      include: courseInclude,
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("language courses query failed", error);
    publishedCourses = [];
  }

  const localizedCourses = publishedCourses.map((item) =>
    localizeCourseFromMessages(serializeCourse(item), localeMessages)
  );

  const languageCourses = localizedCourses.filter((item) => {
    const languageNameSlug = slugify(item.language.name);
    const languageCodeSlug = slugify(item.language.code);
    const routeSlug = slugify(id);
    return routeSlug === languageNameSlug || routeSlug === languageCodeSlug;
  });

  if (languageCourses.length === 0) {
    notFound();
  }

  const languageName = languageCourses[0].language.name;

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <header className="mb-8">
        <p className="text-xs font-black uppercase tracking-wide text-slate-500">{t("courses.title")}</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">{languageName}</h1>
      </header>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {languageCourses.map((item) => (
          <article
            key={item.id}
            className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
          >
            <img
              src={item.imageUrl || "https://picsum.photos/seed/course-fallback/800/450"}
              alt={item.title}
              className="h-48 w-full object-cover"
            />
            <div className="space-y-3 p-5">
              <h2 className="line-clamp-2 text-lg font-black text-slate-900">{item.title}</h2>
              <p className="line-clamp-3 text-sm text-slate-600">{item.description}</p>
              <p className="text-xs font-semibold text-slate-500">{item.studentCount} students</p>
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-lg font-black text-slate-900">${item.price}</span>
                <Link
                  href={localizePath(`/courses/${item.id}`, locale)}
                  className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-black uppercase tracking-wide text-white hover:bg-sky-700"
                >
                  View Details
                </Link>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
