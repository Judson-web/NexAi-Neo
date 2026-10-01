# Kingshot Auto Redeemer

Kingshot Auto Redeemer is an independent community service for automating Kingshot gift-code redemption.

Register a Kingshot Player ID once and the service can discover active gift codes, process eligible codes automatically, remember redemption results, and avoid repeating work that has already been handled.

> **Independent service:** This project is not affiliated with or endorsed by Century Games.

## What it does

- **Automatic redemption** — registered players are processed automatically by the production worker system.
- **Backfill** — active codes that a player has not handled can be picked up after registration; backfill uses the same normal redemption flow rather than a separate one-time job.
- **Live code discovery** — public sources are collected, normalized, deduplicated, and filtered for known expired codes.
- **Persistent redemption history** — player/code results are stored so the same work is not repeatedly attempted.
- **Manual redemption** — users can submit a specific gift code when they want to redeem it themselves.
- **Durable worker pool** — registered players are deterministically distributed across three worker shards, with concurrent processing inside each worker.
- **Server-side redemption** — the actual game redemption request is made from the server, keeping signing material and privileged database credentials out of the browser.
- **Protected public endpoints** — registration and other public API surfaces use validation, rate limiting, and server-side checks.
- **Readable results** — game responses are mapped to statuses such as successful, already handled, expired, invalid, and rate limited.

## How automatic redemption works

1. A player registers their Kingshot Player ID.
2. The service associates the registration with the player's current kingdom.
3. The scheduler invokes the redemption coordinator every minute.
4. Active gift codes are assembled from the configured public sources and expiry history.
5. The coordinator distributes registered players across three durable worker slots.
6. Each worker processes its assigned players concurrently.
7. A player is only given eligible codes they have not already handled.
8. The result is persisted, preventing duplicate work on later runs.

The worker pool is designed around durable claims and leases rather than relying on a single long-running process. Player and code claims are also protected so overlapping requests do not intentionally process the same work twice.

## Code discovery

The feed combines configured public sources, including the Kingshot public gift-code API/page and community code listings. Codes are normalized and deduplicated before entering the active pool.

Known expired codes are filtered using persisted redemption outcomes and source expiry information. A code receiving a game-level expiry response can therefore be excluded from future automatic processing.

## Redemption behavior

The service talks to the Kingshot gift-code endpoint from the server. Common game responses are translated into internal statuses, including:

- SUCCESS — redemption completed.
- RECEIVED — already redeemed/received.
- SAME TYPE EXCHANGE — already handled for the relevant reward type.
- TIME_ERROR — code has expired.
- CDK_NOT_FOUND — code is invalid or unavailable.
- USAGE_LIMIT — the code has reached its usage limit.
- Rate-limit and login/player errors are also recorded when returned by the upstream service.

Redemption history is per player and per code. This is separate from the global expired-code filter.

## Production architecture

The application is deployed on Vercel with Supabase providing the persistent data layer.

The automatic redemption path currently uses:

- **3 durable worker shards**
- **6 concurrent player operations per worker**
- **18 theoretical simultaneous upstream attempts across the pool**
- deterministic player-to-worker sharding
- durable worker leases and completion records
- atomic player/code claims
- a minute-based production scheduler

The architecture is intentionally server-side: privileged Supabase operations and redemption signing credentials are never exposed to the public frontend.

## Site routes

- / — main Kingshot Auto Redeemer landing/auto-redemption experience
- /auto — Auto Redeem
- /manual — Manual Redeem
- /info — How the service works
- /terms — Terms
- /privacy — Privacy

## Development

Requirements:

- Node.js 22.x
- npm

Install dependencies and start the Vite development server:

    npm install
    npm run dev

Build for production:

    npm run build

Preview the production build locally:

    npm run preview

## Environment and deployment

Secrets are configured through the deployment environment and are not committed to the repository.

The application uses server-only credentials for privileged Supabase operations. Discord integrations and other upstream credentials are likewise expected to remain in the server/deployment environment.

Vercel is the production deployment platform.

## Security

Security-sensitive functionality is intentionally kept behind server-side API routes and Supabase functions. Public roles do not receive direct execution access to privileged worker/admin operations.

The repository also includes automated security regression checks, production smoke tests, and a worker watchdog in GitHub Actions.

Do not commit:

- Supabase service-role/secret keys
- Discord bot or webhook credentials
- Kingshot API/signing secrets
- admin passwords or session tokens
- other production credentials

## Project status

The production service currently runs the durable three-worker redemption architecture and supports automatic processing, backfill, persistent history, live code discovery, manual redemption, and the connected service information page.
