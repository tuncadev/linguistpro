# LinguistPro File-Editable i18n Architecture

Status: approved baseline for `I18N-FILE-*` execution cards  
Date: 2026-05-24

## Goal

Enable two editing modes for **all user-visible text**:

1. Frontend admin edit mode (inline edit button) that writes text to locale files.
2. Direct file editing in repository translation files.

Both modes must target the same canonical source-of-truth files.

## Canonical Locales

- `uk` (default)
- `en`
- `es`
- `tr`
- `ru`

## Translation File Model

Primary files:

- `messages/uk.json`
- `messages/en.json`
- `messages/es.json`
- `messages/tr.json`
- `messages/ru.json`

All files must keep identical key structures.

## Key Naming Standard

Use stable, path-like keys:

- `common.*` for shared chrome.
- `auth.*` / `authPage.*` for auth screens.
- `pages.<route>.*` for route-level copy.
- `components.<componentName>.*` for reusable component copy.
- `dashboard.<roleOrPage>.*` for dashboard sections.
- `content.courses.<courseId>.*` for editable course localized text.
- `content.tutors.<tutorId>.*` for editable tutor localized text.

Examples:

- `components.hero.primaryCta`
- `pages.support.channelsTitle`
- `content.courses.course_001.title`
- `content.tutors.tutor_ana.bio`

## Fallback Chain

Read order for any key:

1. requested locale (for example `en`)
2. `uk` default locale
3. hard failure marker (missing key error in edit mode + QA check failure)

No silent fallback to raw hardcoded strings in components.

## Frontend Edit Mode Contract

Only admin users can edit. For each editable text node:

1. render edit control in admin edit mode
2. open inline editor/modal for selected key
3. submit `{ locale, key, value }` to admin write API
4. API writes to corresponding `messages/<locale>.json`
5. client refreshes key value in UI

## API Write Contract

Admin translation write API requirements:

- authentication required
- admin role required
- payload schema validation (`locale`, `key`, `value`)
- key must exist unless explicit `allowCreateKey=true` operation
- atomic file write
- backup snapshot before write
- audit log event for each mutation

## File Safety Rules

- JSON parse before and after write.
- Keep deterministic formatting (2-space indentation, trailing newline).
- Create backups under:
  - `ops/i18n/backups/<timestamp>/<locale>.json`
- Provide rollback capability by restoring snapshot.

## Course/Tutor Editable Text Strategy

Course and tutor copy must be file-backed for locale editing behavior.

Canonical mapping:

- Course UI text from `content.courses.<courseId>.*`
- Tutor UI text from `content.tutors.<tutorId>.*`

DB non-text operational fields (status, relations, metrics, ids) remain in DB.

## QA Acceptance Criteria

Architecture accepted when:

1. Key naming and locale parity rules are documented.
2. Frontend edit flow writes locale file and reflects UI update.
3. Direct manual file edits are rendered by runtime.
4. Missing-key and malformed-file cases fail checks clearly.
