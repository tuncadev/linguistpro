# Next.js Route Map (Migration Scaffold)

Last updated: 2026-04-27
Status: Implemented as scaffold

This document defines the target App Router routes that replace the current Vite view-state navigation.

## Public Routes

1. `/` -> Home
2. `/about` -> About
3. `/courses` -> Course catalog
4. `/courses/[id]` -> Course details
5. `/tutors/[id]` -> Tutor profile

## Auth Routes

1. `/login` -> Sign in
2. `/register` -> Sign up

## Dashboard Routes (Protected)

1. `/student/my-learning`
2. `/student/certificates`
3. `/tutor/my-courses`
4. `/tutor/create`
5. `/tutor/analytics`
6. `/admin/courses`
7. `/admin/tutors`
8. `/admin/tutors/[id]`
9. `/admin/users`
10. `/admin/taxonomies`

## Lesson Route

1. `/learn/[courseId]/[lessonId]` -> Lesson player and resources

## API Routes (Current)

1. `/api/courses`
2. `/api/enroll`
3. `/api/webhooks`
4. `/api/tutors`
5. `/api/admin/tutors`
6. `/api/admin/tutors/integrity`
7. `/api/admin/tutors/[id]`
8. `/api/admin/tutors/[id]/approve`
9. `/api/auth/register`
10. `/api/auth/login`
11. `/api/auth/logout`
12. `/api/auth/session`
13. `/api/auth/request-verification`
14. `/api/auth/verify-email`
15. `/api/auth/forgot-password`
16. `/api/auth/reset-password`
17. `/api/student/onboarding`
18. `/api/student/welcome`
19. `/api/tutor/onboarding`

## Middleware Policy (Target)

1. Protect all `/student/*`, `/tutor/*`, `/admin/*`.
2. Enforce role checks:
   - `ADMIN`: `/admin/*`
   - `TUTOR` and `ADMIN`: `/tutor/*`
   - `STUDENT`, `TUTOR`, `ADMIN`: `/student/*` (if business rules permit)
3. Redirect unauthorized users to `/login` or `/unauthorized`.

## Mapping From Current Vite Views

1. `home` -> `/`
2. `about` -> `/about`
3. `catalog` -> `/courses`
4. `course-details` -> `/courses/[id]`
5. `tutor-profile` -> `/tutors/[id]`
6. `dashboard` (student) -> `/student/my-learning`
7. `dashboard` (tutor) -> `/tutor/my-courses`
8. `dashboard` (admin) -> `/admin/courses`
9. `lesson-view` -> `/learn/[courseId]/[lessonId]`
