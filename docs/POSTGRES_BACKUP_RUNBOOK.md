# PostgreSQL Backup and Restore Runbook

Last updated: 2026-04-26

This runbook defines the minimum backup and restore policy for LinguistPro.

## Policy

- Backup frequency: daily (at least once every 24h).
- Backup format: PostgreSQL custom dump (`pg_dump --format=custom`).
- Retention: keep at least 14 days of backups.
- Integrity: generate SHA-256 checksum for each dump.
- Restore verification: run restore test at least weekly and after schema changes.

## Required Environment Variables

- `DATABASE_URL`: source database for backup.
- `RESTORE_TEST_DATABASE_URL`: isolated database URL used only for restore tests.
- `BACKUP_DIR` (optional): backup directory path. Default: `ops/backups`.
- `RETENTION_DAYS` (optional): retention days. Default: `14`.

## Commands

Create backup:

```bash
npm run db:backup
```

Restore test using latest backup:

```bash
npm run db:restore:test
```

Restore test using specific file:

```bash
npm run db:restore:test -- ./ops/backups/linguistpro_YYYYMMDDTHHMMSSZ.dump
```

Dry-run mode:

```bash
DRY_RUN=1 npm run db:backup
DRY_RUN=1 npm run db:restore:test -- ./ops/backups/linguistpro_YYYYMMDDTHHMMSSZ.dump
```

## Operational Notes

- Do not use production database URL as `RESTORE_TEST_DATABASE_URL`.
- Restore script resets `public` schema in the restore-test database.
- Verify backup artifacts are excluded from git (`ops/backups/*`).
- Persist restore-test evidence in deployment notes (date, backup filename, result).
