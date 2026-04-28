import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { canAccessPath } from "../../lib/auth/rbac";

type Role = "STUDENT" | "TUTOR" | "ADMIN";

function toRoleSet(raw: string): Set<Role> {
  const matches = raw.match(/"(STUDENT|TUTOR|ADMIN)"/g) ?? [];
  return new Set(matches.map((token) => token.replaceAll("\"", "") as Role));
}

function extractRequireRolesArrays(content: string): Set<Role>[] {
  const matches = Array.from(content.matchAll(/requireRoles\(\s*req\s*,\s*\[([^\]]+)\]\s*\)/g));
  return matches.map((match) => toRoleSet(match[1] ?? ""));
}

function collectRouteFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const routeFiles: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      routeFiles.push(...collectRouteFiles(fullPath));
      continue;
    }
    if (entry.isFile() && entry.name === "route.ts") {
      routeFiles.push(fullPath);
    }
  }

  return routeFiles;
}

function assertRoleGuardInRouteTree(rootDir: string, expectedRoles: Set<Role>) {
  const routeFiles = collectRouteFiles(rootDir);
  expect(routeFiles.length).toBeGreaterThan(0);

  for (const routeFile of routeFiles) {
    const content = fs.readFileSync(routeFile, "utf8");
    const guards = extractRequireRolesArrays(content);
    expect(
      guards.some((guard) => guard.size === expectedRoles.size && [...guard].every((role) => expectedRoles.has(role)))
    ).toBe(true);
  }
}

describe("rbac protected app route matrix", () => {
  it("enforces role access for dashboard path prefixes", () => {
    expect(canAccessPath(null, "/admin/courses")).toBe(false);
    expect(canAccessPath("STUDENT", "/admin/courses")).toBe(false);
    expect(canAccessPath("TUTOR", "/admin/courses")).toBe(false);
    expect(canAccessPath("ADMIN", "/admin/courses")).toBe(true);

    expect(canAccessPath(null, "/tutor/my-courses")).toBe(false);
    expect(canAccessPath("STUDENT", "/tutor/my-courses")).toBe(false);
    expect(canAccessPath("TUTOR", "/tutor/my-courses")).toBe(true);
    expect(canAccessPath("ADMIN", "/tutor/my-courses")).toBe(true);

    expect(canAccessPath(null, "/student/my-learning")).toBe(false);
    expect(canAccessPath("STUDENT", "/student/my-learning")).toBe(true);
    expect(canAccessPath("TUTOR", "/student/my-learning")).toBe(true);
    expect(canAccessPath("ADMIN", "/student/my-learning")).toBe(true);
  });
});

describe("rbac protected API route matrix", () => {
  const projectRoot = path.resolve(__dirname, "..", "..");

  it("guards every /api/admin route with ADMIN-only role check", () => {
    assertRoleGuardInRouteTree(path.join(projectRoot, "app", "api", "admin"), new Set<Role>(["ADMIN"]));
  });

  it("guards every /api/student route with STUDENT + ADMIN role check", () => {
    assertRoleGuardInRouteTree(path.join(projectRoot, "app", "api", "student"), new Set<Role>(["STUDENT", "ADMIN"]));
  });

  it("guards every /api/tutor route with TUTOR + ADMIN role check", () => {
    assertRoleGuardInRouteTree(path.join(projectRoot, "app", "api", "tutor"), new Set<Role>(["TUTOR", "ADMIN"]));
  });

  it("keeps cross-scope protected endpoints aligned with role policy", () => {
    const filesWithExpectedGuards: Array<{ file: string; guards: Set<Role>[] }> = [
      {
        file: path.join(projectRoot, "app", "api", "ai", "course-draft", "route.ts"),
        guards: [new Set<Role>(["TUTOR", "ADMIN"])],
      },
      {
        file: path.join(projectRoot, "app", "api", "courses", "route.ts"),
        guards: [new Set<Role>(["TUTOR", "ADMIN"])],
      },
      {
        file: path.join(projectRoot, "app", "api", "courses", "[id]", "route.ts"),
        guards: [new Set<Role>(["TUTOR", "ADMIN"]), new Set<Role>(["TUTOR", "ADMIN"])],
      },
      {
        file: path.join(projectRoot, "app", "api", "courses", "[id]", "submit", "route.ts"),
        guards: [new Set<Role>(["TUTOR", "ADMIN"])],
      },
      {
        file: path.join(projectRoot, "app", "api", "enroll", "route.ts"),
        guards: [new Set<Role>(["STUDENT", "TUTOR", "ADMIN"]), new Set<Role>(["STUDENT", "ADMIN"])],
      },
      {
        file: path.join(projectRoot, "app", "api", "learning", "access", "route.ts"),
        guards: [new Set<Role>(["STUDENT", "TUTOR", "ADMIN"])],
      },
      {
        file: path.join(projectRoot, "app", "api", "metrics", "route.ts"),
        guards: [new Set<Role>(["ADMIN"])],
      },
      {
        file: path.join(projectRoot, "app", "api", "webhooks", "route.ts"),
        guards: [new Set<Role>(["ADMIN"])],
      },
    ];

    for (const item of filesWithExpectedGuards) {
      const content = fs.readFileSync(item.file, "utf8");
      const actualGuards = extractRequireRolesArrays(content);

      for (const expected of item.guards) {
        expect(
          actualGuards.some(
            (guard) => guard.size === expected.size && [...guard].every((role) => expected.has(role))
          )
        ).toBe(true);
      }
    }
  });
});
