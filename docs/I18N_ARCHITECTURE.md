# LinguistPro i18n Architecture (ML-01)

Last updated: 2026-05-24
Owner: Engineering
Status: Approved for implementation

## Decisions

1. Supported locales:
- `uk` (default)
- `en`
- `es`
- `tr`
- `ru`

2. SEO routing strategy:
- Use locale-prefixed URLs for all localized pages: `/{locale}/...`.
- Redirect root `/` to `/uk`.
- Apply this strategy to public, dashboard, and admin pages.
- Emit locale-specific canonicals and `hreflang` alternates for all translated routes.

3. Admin localization:
- Admin pages are included in multilingual scope from phase one.

4. Translation source model:
- Support both machine bootstrap translations and human-reviewed translations.
- Machine translations are temporary and must be flagged for review.

5. Locale persistence:
- Guests: persist in locale cookie.
- Authenticated users: persist in both locale cookie and user profile preference.
- Effective locale resolution order:
  1. explicit URL locale segment
  2. authenticated user profile locale (if available)
  3. locale cookie
  4. default `uk`

6. i18n framework choice:
- Use `next-intl` as the primary localization framework.
- Keep translation messages in repository JSON files for deterministic builds and reviewable diffs.

## Technical Plan

1. Introduce locale-aware route segment under `app/[locale]/...` for Next.js runtime pages.
2. Keep a strict locale list constant and validation helper to reject unsupported locale values.
3. Implement middleware/proxy locale handling:
- normalize locale segment
- redirect `/` to `/uk`
- preserve query params on redirects
4. Add dictionary structure:
- `messages/{locale}/{namespace}.json`
- namespaced keys for `common`, `auth`, `dashboard`, `admin`, `courses`, `errors`
5. Add translation loader utility for server and client usage.
6. Add profile preference field:
- extend user model with preferred locale (planned in ML-02+ schema task)
7. Standardize locale-aware formatters (dates/numbers/currency) via shared utility.
8. Add CI checks:
- missing keys across locales
- orphan/unused keys report
- fallback leakage report (`uk` fallback used where key missing)

## SEO Requirements

1. Every localized page must provide:
- canonical URL with the same locale
- alternate `hreflang` links for all five locales
- `x-default` pointing to `/uk`
2. Sitemaps must include localized variants.
3. Locale switch should not use JS-only navigation patterns that block crawlability.

## Content Governance

1. Translation lifecycle states:
- `machine_draft`
- `human_reviewed`
- `approved`
2. Production promotion rule:
- core funnel pages (`/`, `/courses`, `/login`, `/register`, dashboard entry pages) require `approved` status per locale.
3. Fallback policy:
- fallback to `uk` only when key is missing, and log missing keys for remediation.

## Out of Scope for ML-01

1. Full code extraction of all strings.
2. DB migrations and API locale response adaptation.
3. Translation QA automation implementation.

These are covered by ML-02 through ML-16.
