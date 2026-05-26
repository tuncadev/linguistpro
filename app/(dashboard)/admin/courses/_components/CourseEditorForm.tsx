"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { localizePath } from "@/i18n/locale-path";
import { normalizeLocale } from "@/i18n/routing";
import {
  createAdminCourse,
  updateAdminCourse,
} from "@/services/adminCourseCrudApiService";
import { fetchTaxonomies } from "@/services/taxonomyApiService";
import { fetchTutors } from "@/services/tutorApiService";
import { Course, Language, Level, User } from "@/types";

type LessonInput = {
  title: string;
  duration: string;
  type: "video" | "quiz" | "reading";
  content: string;
};

type SectionInput = {
  title: string;
  lessons: LessonInput[];
};

type CourseFormState = {
  title: string;
  description: string;
  price: string;
  imageUrl: string;
  languageId: string;
  levelId: string;
  tutorId: string;
  status: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "ARCHIVED";
  learningObjectives: string[];
  enrollmentIncludes: string[];
  tuitionLabel: string;
  discountLabel: string;
  courseDirectorLabel: string;
  syllabusSections: SectionInput[];
};

type CourseEditorFormProps = {
  mode: "create" | "edit";
  initialCourse?: Course | null;
};

const DEFAULT_LESSON: LessonInput = {
  title: "",
  duration: "10:00",
  type: "video",
  content: "",
};

const DEFAULT_SECTION: SectionInput = {
  title: "",
  lessons: [{ ...DEFAULT_LESSON }],
};

function normalizeStatus(status?: string): CourseFormState["status"] {
  const normalized = (status || "").toUpperCase();
  if (
    normalized === "DRAFT" ||
    normalized === "PENDING_REVIEW" ||
    normalized === "PUBLISHED" ||
    normalized === "ARCHIVED"
  ) {
    return normalized;
  }
  return "PUBLISHED";
}

function initializeForm(course?: Course | null): CourseFormState {
  if (!course) {
    return {
      title: "",
      description: "",
      price: "",
      imageUrl: "",
      languageId: "",
      levelId: "",
      tutorId: "",
      status: "PUBLISHED",
      learningObjectives: [""],
      enrollmentIncludes: [""],
      tuitionLabel: "Tuition Fee",
      discountLabel: "65% Off Enrollment",
      courseDirectorLabel: "Course Tutor",
      syllabusSections: [{ ...DEFAULT_SECTION }],
    };
  }

  return {
    title: course.title,
    description: course.description,
    price: String(course.price),
    imageUrl: course.imageUrl,
    languageId: course.languageId,
    levelId: course.levelId,
    tutorId: course.tutorId,
    status: normalizeStatus(course.status),
    learningObjectives:
      course.learningObjectives && course.learningObjectives.length > 0
        ? [...course.learningObjectives]
        : [""],
    enrollmentIncludes:
      course.enrollmentIncludes && course.enrollmentIncludes.length > 0
        ? [...course.enrollmentIncludes]
        : [""],
    tuitionLabel: course.tuitionLabel || "Tuition Fee",
    discountLabel: course.discountLabel || "65% Off Enrollment",
    courseDirectorLabel: course.courseDirectorLabel || "Course Tutor",
    syllabusSections:
      course.syllabus.length > 0
        ? course.syllabus.map((section) => ({
            title: section.title,
            lessons:
              section.lessons.length > 0
                ? section.lessons.map((lesson) => ({
                    title: lesson.title,
                    duration: lesson.duration || "10:00",
                    type: lesson.type,
                    content: lesson.content || "",
                  }))
                : [{ ...DEFAULT_LESSON }],
          }))
        : [{ ...DEFAULT_SECTION }],
  };
}

function trimNonEmpty(items: string[]): string[] {
  return items.map((item) => item.trim()).filter(Boolean);
}

export default function CourseEditorForm({ mode, initialCourse = null }: CourseEditorFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("dashboard.adminCourses");
  const tx = (key: string, fallback: string) => (t.has(key) ? t(key) : fallback);

  const [languages, setLanguages] = useState<Language[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [tutors, setTutors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState<CourseFormState>(() => initializeForm(initialCourse));

  useEffect(() => {
    setForm(initializeForm(initialCourse));
  }, [initialCourse]);

  useEffect(() => {
    let active = true;

    const loadDependencies = async () => {
      setLoading(true);
      const [taxonomies, tutorList] = await Promise.all([fetchTaxonomies(), fetchTutors()]);
      if (!active) {
        return;
      }

      if (taxonomies) {
        setLanguages(taxonomies.languages);
        setLevels(taxonomies.levels);
      }

      if (tutorList) {
        setTutors(tutorList);
      }

      setForm((current) => ({
        ...current,
        languageId: current.languageId || taxonomies?.languages[0]?.id || "",
        levelId: current.levelId || taxonomies?.levels[0]?.id || "",
        tutorId: current.tutorId || tutorList?.[0]?.id || "",
      }));

      setLoading(false);
    };

    void loadDependencies();

    return () => {
      active = false;
    };
  }, []);

  const allowedStatuses = useMemo(
    () =>
      mode === "create"
        ? (["DRAFT", "PUBLISHED"] as const)
        : (["DRAFT", "PENDING_REVIEW", "PUBLISHED", "ARCHIVED"] as const),
    [mode]
  );

  const setObjective = (index: number, value: string) => {
    setForm((current) => {
      const next = [...current.learningObjectives];
      next[index] = value;
      return { ...current, learningObjectives: next };
    });
  };

  const setEnrollmentInclude = (index: number, value: string) => {
    setForm((current) => {
      const next = [...current.enrollmentIncludes];
      next[index] = value;
      return { ...current, enrollmentIncludes: next };
    });
  };

  const setSectionTitle = (sectionIndex: number, title: string) => {
    setForm((current) => {
      const sections = [...current.syllabusSections];
      sections[sectionIndex] = { ...sections[sectionIndex], title };
      return { ...current, syllabusSections: sections };
    });
  };

  const setLessonField = (
    sectionIndex: number,
    lessonIndex: number,
    field: keyof LessonInput,
    value: string
  ) => {
    setForm((current) => {
      const sections = [...current.syllabusSections];
      const section = sections[sectionIndex];
      const lessons = [...section.lessons];
      lessons[lessonIndex] = {
        ...lessons[lessonIndex],
        [field]: value,
      } as LessonInput;
      sections[sectionIndex] = {
        ...section,
        lessons,
      };
      return {
        ...current,
        syllabusSections: sections,
      };
    });
  };

  const addSection = () => {
    setForm((current) => ({
      ...current,
      syllabusSections: [...current.syllabusSections, { ...DEFAULT_SECTION }],
    }));
  };

  const removeSection = (sectionIndex: number) => {
    setForm((current) => {
      if (current.syllabusSections.length <= 1) {
        return current;
      }
      const sections = current.syllabusSections.filter((_, index) => index !== sectionIndex);
      return { ...current, syllabusSections: sections };
    });
  };

  const addLesson = (sectionIndex: number) => {
    setForm((current) => {
      const sections = [...current.syllabusSections];
      const section = sections[sectionIndex];
      sections[sectionIndex] = {
        ...section,
        lessons: [...section.lessons, { ...DEFAULT_LESSON }],
      };
      return { ...current, syllabusSections: sections };
    });
  };

  const removeLesson = (sectionIndex: number, lessonIndex: number) => {
    setForm((current) => {
      const sections = [...current.syllabusSections];
      const section = sections[sectionIndex];
      if (section.lessons.length <= 1) {
        return current;
      }
      sections[sectionIndex] = {
        ...section,
        lessons: section.lessons.filter((_, index) => index !== lessonIndex),
      };
      return { ...current, syllabusSections: sections };
    });
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError(tx("errors.imageNotSupported", "Please upload a valid image file."));
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setError(tx("errors.imageTooLarge", "Image is too large. Max size is 4 MB."));
      return;
    }

    const asDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
      reader.onerror = () => reject(new Error("Image upload failed."));
      reader.readAsDataURL(file);
    });

    setForm((current) => ({ ...current, imageUrl: asDataUrl }));
    setError(null);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);

    const parsedPrice = Number(form.price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setError(tx("errors.invalidPrice", "Price must be a non-negative number."));
      setSaving(false);
      return;
    }

    const syllabusSections = form.syllabusSections
      .map((section) => ({
        title: section.title.trim(),
        lessons: section.lessons
          .map((lesson) => ({
            title: lesson.title.trim(),
            duration: lesson.duration.trim(),
            type: lesson.type,
            content: lesson.content.trim(),
          }))
          .filter((lesson) => lesson.title.length > 0),
      }))
      .filter((section) => section.title.length > 0);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      price: parsedPrice,
      imageUrl: form.imageUrl.trim() || undefined,
      languageId: form.languageId,
      levelId: form.levelId,
      tutorId: form.tutorId,
      status: form.status,
      learningObjectives: trimNonEmpty(form.learningObjectives),
      enrollmentIncludes: trimNonEmpty(form.enrollmentIncludes),
      tuitionLabel: form.tuitionLabel.trim() || undefined,
      discountLabel: form.discountLabel.trim() || undefined,
      courseDirectorLabel: form.courseDirectorLabel.trim() || undefined,
      syllabusSections: syllabusSections.length > 0 ? syllabusSections : undefined,
    };

    try {
      const saved =
        mode === "create"
          ? await createAdminCourse(payload)
          : await updateAdminCourse(initialCourse?.id || "", payload);

      if (!saved) {
        throw new Error(tx("errors.saveFailed", "Save failed."));
      }

      if (mode === "create") {
        router.push(localizePath("/admin/courses", normalizeLocale(locale)));
        router.refresh();
        return;
      }

      setNotice(tx("notices.updated", "Course updated."));
      router.refresh();
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : tx("errors.saveFailed", "Save failed.");
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <section className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-semibold text-slate-700">
          {tx("form.labels.title", "Course title")}
          <input
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#f47361]"
            required
          />
        </label>

        <label className="block text-sm font-semibold text-slate-700">
          {tx("form.labels.price", "Price")}
          <input
            value={form.price}
            onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#f47361]"
            placeholder="49.99"
            required
          />
        </label>
      </section>

      <label className="block text-sm font-semibold text-slate-700">
        {tx("form.labels.description", "Course description")}
        <textarea
          value={form.description}
          onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          rows={5}
          className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#f47361]"
          required
        />
      </label>

      <section className="grid gap-4 md:grid-cols-4">
        <label className="block text-sm font-semibold text-slate-700">
          {tx("form.labels.status", "Status")}
          <select
            value={form.status}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                status: event.target.value as CourseFormState["status"],
              }))
            }
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#f47361]"
          >
            {allowedStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-semibold text-slate-700">
          {tx("form.labels.language", "Language")}
          <select
            value={form.languageId}
            onChange={(event) => setForm((current) => ({ ...current, languageId: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#f47361]"
            required
            disabled={loading}
          >
            {languages.map((language) => (
              <option key={language.id} value={language.id}>
                {language.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-semibold text-slate-700">
          {tx("form.labels.level", "Level")}
          <select
            value={form.levelId}
            onChange={(event) => setForm((current) => ({ ...current, levelId: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#f47361]"
            required
            disabled={loading}
          >
            {levels.map((level) => (
              <option key={level.id} value={level.id}>
                {level.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-semibold text-slate-700">
          {tx("form.labels.tutor", "Tutor")}
          <select
            value={form.tutorId}
            onChange={(event) => setForm((current) => ({ ...current, tutorId: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#f47361]"
            required
            disabled={loading}
          >
            {tutors.map((tutor) => (
              <option key={tutor.id} value={tutor.id}>
                {tutor.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <h2 className="text-sm font-black uppercase tracking-wide text-slate-700">
          {tx("form.featuredImage", "Featured image")}
        </h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-slate-700">
            {tx("form.labels.imageUrl", "Image URL")}
            <input
              value={form.imageUrl.startsWith("data:image") ? "" : form.imageUrl}
              onChange={(event) => setForm((current) => ({ ...current, imageUrl: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#f47361]"
              placeholder="https://example.com/course-cover.jpg"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            {tx("form.labels.uploadImage", "Upload image")}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </label>
        </div>
        {form.imageUrl ? (
          <div className="mt-4">
            <img
              src={form.imageUrl}
              alt="Course preview"
              className="h-48 w-full rounded-2xl object-cover"
            />
            <button
              type="button"
              onClick={() => setForm((current) => ({ ...current, imageUrl: "" }))}
              className="mt-2 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50"
            >
              {tx("actions.removeImage", "Remove image")}
            </button>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-wide text-slate-700">
            {tx("form.learningObjectives", "Learning objectives")}
          </h2>
          <button
            type="button"
            onClick={() =>
              setForm((current) => ({
                ...current,
                learningObjectives: [...current.learningObjectives, ""],
              }))
            }
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            {tx("actions.addItem", "Add item")}
          </button>
        </div>
        <div className="space-y-2">
          {form.learningObjectives.map((item, index) => (
            <div key={`objective-${index}`} className="flex gap-2">
              <input
                value={item}
                onChange={(event) => setObjective(index, event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-[#f47361]"
              />
              <button
                type="button"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    learningObjectives:
                      current.learningObjectives.length <= 1
                        ? current.learningObjectives
                        : current.learningObjectives.filter((_, itemIndex) => itemIndex !== index),
                  }))
                }
                className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50"
              >
                {tx("actions.remove", "Remove")}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-wide text-slate-700">
            {tx("form.enrollmentIncludes", "Enrollment includes")}
          </h2>
          <button
            type="button"
            onClick={() =>
              setForm((current) => ({
                ...current,
                enrollmentIncludes: [...current.enrollmentIncludes, ""],
              }))
            }
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            {tx("actions.addItem", "Add item")}
          </button>
        </div>
        <div className="space-y-2">
          {form.enrollmentIncludes.map((item, index) => (
            <div key={`include-${index}`} className="flex gap-2">
              <input
                value={item}
                onChange={(event) => setEnrollmentInclude(index, event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-[#f47361]"
              />
              <button
                type="button"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    enrollmentIncludes:
                      current.enrollmentIncludes.length <= 1
                        ? current.enrollmentIncludes
                        : current.enrollmentIncludes.filter((_, itemIndex) => itemIndex !== index),
                  }))
                }
                className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50"
              >
                {tx("actions.remove", "Remove")}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-700">
          {tx("form.labels.presentation", "Presentation labels")}
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          <input
            value={form.tuitionLabel}
            onChange={(event) => setForm((current) => ({ ...current, tuitionLabel: event.target.value }))}
            placeholder={tx("form.placeholders.tuitionLabel", "Tuition label")}
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-[#f47361]"
          />
          <input
            value={form.discountLabel}
            onChange={(event) => setForm((current) => ({ ...current, discountLabel: event.target.value }))}
            placeholder={tx("form.placeholders.discountLabel", "Discount label")}
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-[#f47361]"
          />
          <input
            value={form.courseDirectorLabel}
            onChange={(event) =>
              setForm((current) => ({ ...current, courseDirectorLabel: event.target.value }))
            }
            placeholder={tx("form.placeholders.courseDirectorLabel", "Course director label")}
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-[#f47361]"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-wide text-slate-700">
            {tx("form.syllabusSections", "Curriculum modules")}
          </h2>
          <button
            type="button"
            onClick={addSection}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            {tx("actions.addSection", "Add module")}
          </button>
        </div>

        <div className="space-y-4">
          {form.syllabusSections.map((section, sectionIndex) => (
            <article key={`section-${sectionIndex}`} className="rounded-xl border border-slate-200 p-4">
              <div className="mb-3 flex items-center gap-2">
                <input
                  value={section.title}
                  onChange={(event) => setSectionTitle(sectionIndex, event.target.value)}
                  placeholder={tx("form.placeholders.moduleTitle", "Module title")}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-[#f47361]"
                />
                <button
                  type="button"
                  onClick={() => removeSection(sectionIndex)}
                  className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50"
                >
                  {tx("actions.remove", "Remove")}
                </button>
              </div>

              <div className="space-y-3">
                {section.lessons.map((lesson, lessonIndex) => (
                  <div
                    key={`section-${sectionIndex}-lesson-${lessonIndex}`}
                    className="grid gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 md:grid-cols-12"
                  >
                    <input
                      value={lesson.title}
                      onChange={(event) =>
                        setLessonField(sectionIndex, lessonIndex, "title", event.target.value)
                      }
                      placeholder={tx("form.placeholders.lessonTitle", "Lesson title")}
                      className="md:col-span-5 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#f47361]"
                    />
                    <input
                      value={lesson.duration}
                      onChange={(event) =>
                        setLessonField(sectionIndex, lessonIndex, "duration", event.target.value)
                      }
                      placeholder="10:00"
                      className="md:col-span-2 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#f47361]"
                    />
                    <select
                      value={lesson.type}
                      onChange={(event) =>
                        setLessonField(sectionIndex, lessonIndex, "type", event.target.value)
                      }
                      className="md:col-span-2 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#f47361]"
                    >
                      <option value="video">Video</option>
                      <option value="quiz">Quiz</option>
                      <option value="reading">Reading</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => removeLesson(sectionIndex, lessonIndex)}
                      className="md:col-span-3 rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"
                    >
                      {tx("actions.removeLesson", "Remove lesson")}
                    </button>
                    <textarea
                      value={lesson.content}
                      onChange={(event) =>
                        setLessonField(sectionIndex, lessonIndex, "content", event.target.value)
                      }
                      placeholder={tx("form.placeholders.lessonContent", "Lesson content summary")}
                      rows={2}
                      className="md:col-span-12 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#f47361]"
                    />
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => addLesson(sectionIndex)}
                className="mt-3 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                {tx("actions.addLesson", "Add lesson")}
              </button>
            </article>
          ))}
        </div>
      </section>

      {error ? <p className="text-sm font-bold text-rose-600">{error}</p> : null}
      {notice ? <p className="text-sm font-bold text-emerald-600">{notice}</p> : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving || loading}
          className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving
            ? tx("form.saving", "Saving...")
            : mode === "create"
            ? tx("form.createCourse", "Create Course")
            : tx("form.updateCourse", "Update Course")}
        </button>
      </div>
    </form>
  );
}
