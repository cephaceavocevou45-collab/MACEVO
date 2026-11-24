# MACEVO data ownership and database transition

## Canonical entities

- `ScientificProject` is the canonical research workspace, owned by one authenticated user.
- `Report` remains the existing academic document/profile representation and is linked to its project through an optional foreign key. Existing report IDs and fields are preserved.
- New reports submitted through the authenticated report API create a project and report in one database transaction. The report API remains available for compatibility while the frontend moves toward project APIs.
- A report may be attached only to a project owned by the authenticated user.
- Historical reports are deliberately not converted into projects automatically. The local database contains 144 reports but only one scientific project, and there are no exact title/owner matches. Automatic conversion would create many new workspaces without user intent. They remain unchanged and unlinked until a controlled migration or user action is designed.

## Field ownership

Document identity, format, author display, jury, supervisor names, academic year, template, cover/logo and rendered document content remain on `Report` while the current report editor uses that API.

Research identity and workflow belong to `ScientificProject`: owner, project type, academic level, discipline, country, institution, faculty, department, problem, questions, objectives, hypotheses, methodology, institutional and supervisor instructions, plan and plan validation state.

Project-scoped memory is stored as `ProjectMemory` and remains isolated by both owner and project. Only validated or active memories are included in project chat context. The plan generation endpoint delegates to MACEVO_IA, validates its JSON structure, and saves successful plans as `needs_review`. A separate owner-authenticated endpoint records explicit plan approval and its timestamp. Invalid provider output is not persisted.

For compatibility, the report API initializes the linked project from the report metadata and synchronizes document edits to that project. New project-centric APIs should write the project directly; future removal of this compatibility synchronization requires the editor to use the project API first.

## Database responsibilities

The main Django backend is the source of truth for users, projects, reports, conversations, documents, research data, versions and exports. Its database is configurable through the single shared `backend/.env`: set `DATABASE_URL` to PostgreSQL and `ENVIRONMENT=production`. In local development, an empty `DATABASE_URL` keeps the existing SQLite database.

MACEVO_IA remains an inference service. Its current SQLite database has overlapping legacy conversation tables, so it must not point at the main database: both Django projects use the same `assistant_conversation` table name with incompatible schemas. Project context and memory will be moved behind the main backend contract before those legacy IA tables are retired.

## Existing local data inventory

Read-only inventory performed on 2026-10-04:

| Database | Size | Relevant records |
| --- | ---: | --- |
| `backend/db.sqlite3` | 7,999,488 bytes | 10 users, 144 reports, 1 scientific project, 23 conversations, 217 messages |
| `backend/MACEVO_IA/db.sqlite3` | 294,912 bytes | 53 IA conversations, 101 IA messages, 3 memories, 0 local auth users |

The SQLite files are retained. Main-backend additive migrations for research fields, report/project linkage, conversation/project linkage and project memory have been applied locally after temporary backups were created in `%TEMP%` (`macevo-main-db-before-foundations-20261004.sqlite3`, `macevo-main-db-before-conversation-link-20261004.sqlite3`, `macevo-main-db-before-project-memory-20261004.sqlite3`). No automatic cross-database import, historical report conversion or data deletion has been performed. The current migrations are consistent with the model state (`makemigrations --check --dry-run`: no changes detected).

## PostgreSQL migration procedure

1. Configure `DATABASE_URL` in the shared backend environment file or deployment environment. Never commit its value.
2. Install backend requirements, including the PostgreSQL driver.
3. Take a database backup and record its checksum.
4. Run Django migration checks and apply main-backend migrations to the PostgreSQL target.
5. Transfer existing main-backend records using a reviewed fixture/export process that preserves primary keys and foreign-key order. Do not merge the MACEVO_IA conversation tables into the main `assistant_*` tables.
6. Compare table counts and foreign-key integrity before switching application traffic.
7. Keep both SQLite databases as rollback/archive copies until the PostgreSQL data is verified.

The current development environment has not supplied a PostgreSQL URL or driver, so PostgreSQL runtime configuration is prepared but no PostgreSQL migration has run. Production settings fail closed if `ENVIRONMENT=production` is selected without `DATABASE_URL`. The actual production database migration and row-count verification remain deployment work.
