# ODU Learner Companion Documentation

This directory is the maintained documentation for the multi-tenant ODU Learner Companion platform.

## Documents

- [Business Guide](business-guide.md): product behavior, users, roles, and workflows.
- [Architecture](architecture.md): application boundaries, data model, authorization, and mobile compatibility.
- [Development](development.md): local setup, environment variables, database setup, and verification.
- [API Reference](api.md): path-scoped HTTP endpoints and response contracts.
- [Database Operations](database-operations.md): setup, entitlement backfill, quota requests, admin approval, inspection, and rollback SQL commands.
- [Product Roadmap](roadmap.md): completed foundation, next phases, and pending product decisions.

The canonical database schema is maintained in [DB-schema.sql](DB-schema.sql). For an existing database, apply only the additive migration section documented in [Database Operations](database-operations.md); do not recreate existing tables or run legacy single-room schemas.
