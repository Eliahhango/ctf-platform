# CTF Platform Rebuild (Legal Clean-Room)

This scaffold is for rebuilding equivalent features without copying proprietary server code.

## Current Status
- SPA route fallbacks configured for static snapshot.
- API now includes:
  - JWT login/register/profile update
  - role-based admin guards
  - PostgreSQL-backed users, teams, posts, games, tokens
  - SQL migration bootstrap

## Next Implementation Steps
1. Add challenge container lifecycle service.
2. Implement invite/verify/recovery/email flows.
3. Implement scoring, challenge solves, and flag verification.
4. Build React admin/client pages on top of existing design system.

## Run
```bash
cd rebuild
npm install
cp apps/api/.env.example apps/api/.env
docker compose -f infra/docker-compose.yml up -d
npm --workspace @ctf/api run migrate
npm run dev:api
npm run dev:web
```
