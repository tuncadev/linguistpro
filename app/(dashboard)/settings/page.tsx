"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  fetchPersonalProfile,
  updatePersonalProfile,
} from "@/services/authApiService";
import { UserRole, type User } from "@/types";

const BASIC_AVATAR_PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'>" +
      "<rect width='120' height='120' rx='24' fill='#e2e8f0'/>" +
      "<circle cx='60' cy='44' r='20' fill='#94a3b8'/>" +
      "<path d='M25 98c4-18 18-30 35-30s31 12 35 30' fill='#94a3b8'/>" +
    "</svg>"
  );

function resolveDashboardPath(user: User | null): string {
  if (!user) {
    return "/login";
  }
  if (user.role === UserRole.ADMIN) {
    return "/admin/courses";
  }
  if (user.role === UserRole.TUTOR) {
    return "/tutor/my-courses";
  }
  return "/student/my-learning";
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Unable to read image file."));
    reader.readAsDataURL(file);
  });
}

function isDataImageUrl(value: string): boolean {
  return /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(value);
}

export default function SettingsPage() {
  const t = useTranslations("dashboard.settings");
  const tx = (key: string, fallback: string) => (t.has(key) ? t(key) : fallback);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarRemoved, setAvatarRemoved] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      setLoading(true);
      setError(null);
      const current = await fetchPersonalProfile();
      if (!isMounted) {
        return;
      }

      if (!current) {
        setError(tx("errors.loadFailed", "Unable to load personal settings."));
        setLoading(false);
        return;
      }

      setProfile(current);
      setNickname(current.name ?? "");
      setBio(current.bio ?? "");
      setAvatarUrl(current.avatarUrl ?? "");
      setAvatarRemoved(false);
      setLoading(false);
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const dashboardPath = useMemo(() => resolveDashboardPath(profile), [profile]);
  const currentAvatarValue = avatarUrl.trim();
  const uploadedAvatarSelected = isDataImageUrl(currentAvatarValue);
  const persistedAvatar = (profile?.avatarUrl ?? "").trim();
  const previewAvatar = avatarRemoved
    ? BASIC_AVATAR_PLACEHOLDER
    : currentAvatarValue || persistedAvatar || BASIC_AVATAR_PLACEHOLDER;

  const onAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError(tx("errors.invalidFileType", "Please select an image file."));
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError(tx("errors.fileTooLarge", "Avatar image must be 2MB or smaller."));
      return;
    }

    try {
      setError(null);
      const encoded = await readFileAsDataUrl(file);
      setAvatarUrl(encoded);
      setAvatarRemoved(false);
      setStatus(tx("status.uploadReady", "Avatar uploaded. Save changes to apply."));
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : tx("errors.uploadFailed", "Unable to read uploaded image.")
      );
    }
  };

  const onRemoveAvatar = () => {
    setAvatarUrl("");
    setAvatarRemoved(true);
    setStatus(tx("status.avatarRemoved", "Avatar removed. Save changes to apply."));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setStatus(null);

    try {
      const updated = await updatePersonalProfile({
        name: nickname.trim() || null,
        bio: bio.trim() || null,
        avatarUrl: avatarRemoved ? null : avatarUrl.trim() || null,
      });

      setProfile(updated);
      setNickname(updated.name ?? "");
      setBio(updated.bio ?? "");
      setAvatarUrl(updated.avatarUrl ?? "");
      setAvatarRemoved(false);
      setStatus(tx("status.saved", "Personal information updated."));
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : tx("errors.saveFailed", "Failed to save personal information.")
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="p-4 lg:p-6">
        <p className="text-sm text-slate-500">
          {tx("loading", "Loading personal information settings...")}
        </p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="p-4 lg:p-6">
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-red-600">
            {error ?? tx("errors.unauthorized", "You must be logged in to manage settings.")}
          </p>
          <Link href="/login" className="mt-4 inline-flex text-sm font-bold text-[#2d3e50] hover:underline">
            {tx("actions.goToLogin", "Go to login")}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="p-4 lg:p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-black text-slate-900">
                {tx("title", "Personal Information")}
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                {tx(
                  "subtitle",
                  "Update your nickname, avatar, and basic profile details."
                )}
              </p>
            </div>
            <Link
              href={dashboardPath}
              className="inline-flex items-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
            >
              {tx("actions.backToDashboard", "Back to dashboard")}
            </Link>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="shrink-0">
                <img
                  src={previewAvatar}
                  alt={tx("avatar.alt", "Profile avatar preview")}
                  className="h-24 w-24 rounded-2xl border border-slate-200 object-cover"
                />
              </div>
              <div className="flex-1 space-y-4">
                {uploadedAvatarSelected ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold text-slate-600">
                      {tx("fields.uploadedAvatarSelected", "Uploaded avatar selected")}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={onRemoveAvatar}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
                      >
                        {tx("actions.removeImage", "Remove image")}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAvatarUrl("");
                          setAvatarRemoved(false);
                        }}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
                      >
                        {tx("actions.useExternalLink", "Use external image link")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="grid gap-2 text-sm font-semibold text-slate-700">
                    {tx("fields.avatarLink", "Avatar link")}
                    <input
                      value={avatarUrl}
                      onChange={(event) => {
                        setAvatarUrl(event.target.value);
                        setAvatarRemoved(false);
                      }}
                      placeholder="https://example.com/avatar.jpg"
                      className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#f47361]"
                    />
                  </label>
                )}
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  {tx("fields.avatarUpload", "Upload avatar image")}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      void onAvatarUpload(event);
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                  />
                </label>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                {tx("fields.nickname", "Nickname")}
                <input
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  minLength={2}
                  maxLength={120}
                  required
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#f47361]"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                {tx("fields.email", "Email")}
                <input
                  value={profile.email}
                  disabled
                  readOnly
                  className="cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500"
                />
              </label>
            </div>

            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              {tx("fields.bio", "Bio")}
              <textarea
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                rows={4}
                maxLength={5000}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#f47361]"
              />
            </label>

            {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
            {status ? <p className="text-sm font-semibold text-emerald-700">{status}</p> : null}

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-sky-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? tx("actions.saving", "Saving...") : tx("actions.save", "Save Changes")}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
