# User Lists Feature

Enable users to save third places to personal lists with ratings, manual ranking, and community sharing. Email-based authentication (magic link + OTP code), Reddit-style usernames for public identity, full GDPR compliance, and comprehensive test coverage.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Decisions](#architecture-decisions)
3. [Database Schema](#database-schema)
4. [API Routes](#api-routes)
5. [UI Components](#ui-components)
6. [Navigation Changes](#navigation-changes)
7. [Implementation Checklist](#implementation-checklist)
8. [Manual Configuration Steps](#manual-configuration-steps)
9. [Testing Strategy](#testing-strategy)
10. [Privacy & Compliance](#privacy--compliance)
11. [Cost Estimates](#cost-estimates)

---

## Executive Summary

### What We're Building

- **Personal Lists**: 3 default lists (Favorites, To Visit, Visited) + up to 5 custom lists per user
- **Ratings & Rankings**: 1–5 star ratings per place with manual drag-and-drop reordering
- **Community Features**: Users can publish any list publicly with Reddit-style usernames; curators can create featured lists; `/community` page for discovery
- **Authentication**: Email-based (magic link + OTP code) — no passwords, no OAuth complexity
- **Content Safety**: Notes are private-only; ratings shown on public lists with disclaimer; profanity filter on list names/descriptions
- **Privacy**: Full GDPR/CCPA compliance with account deletion, data export, and privacy policy

### Key Technology Choices

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Authentication** | [Better Auth](https://www.better-auth.com/) (magic link + email OTP) | No rotating secrets, no provider portals, works on localhost, zero maintenance |
| **Email Service** | [Azure Communication Services](https://learn.microsoft.com/en-us/azure/communication-services/overview) | Free tier (100 emails/day), stays within existing Azure ecosystem and $150/month credits |
| **Database** | [Azure Database for PostgreSQL Flexible Server](https://learn.microsoft.com/en-us/azure/postgresql/) (Burstable B1ms) | ~$13–15/month, native Better Auth adapter, SQL queries for analytics, scales to thousands of users |
| **Drag & Drop** | [@dnd-kit/sortable](https://dndkit.com/) | Manual list reordering with accessible drag-and-drop |
| **Content Filter** | [leo-profanity](https://www.npmjs.com/package/leo-profanity) | Lightweight profanity filter for list names/descriptions at publish time |
| **Legal Policies** | [Termly](https://termly.io/) Paid Plan | Privacy Policy, Cookie Policy, Terms & Conditions. Auto-updates with law changes, cookie consent banner included. |

### Why Magic Link + Email Code Instead of OAuth?

We originally planned OAuth (Google, Microsoft, Apple) but switched to magic link + email code for significant simplification:

| Concern | OAuth | Magic Link + Email Code |
|---------|-------|------------------------|
| **Rotating secrets** | Apple: every 6 months. Microsoft: expires periodically. | None. Zero rotating secrets. |
| **Provider portals** | 3 portals to maintain (Google Cloud Console, Azure App Registrations, Apple Developer) | 1 email service (Azure Communication Services) |
| **Dev environment** | Apple doesn't support localhost. Redirect URIs per environment. | Works on localhost out of the box |
| **Breakage risk** | Expired secret = auth silently broken for all users | Email service down = temporary, retryable |
| **Environment variables** | ~10 auth-related env vars | 3 (Better Auth secret + ACS connection string + from address) |
| **Annual cost** | $99/year Apple Developer Program | $0 (Azure free tier) |
| **PII stored** | Email + name + avatar URL + OAuth tokens | Email only |

OAuth remains a future roadmap option if social sign-in becomes desirable.

### Why PostgreSQL Over Azure Table Storage?

We originally planned Azure Table Storage (~$0.03/month) for its simplicity and cost. We switched to PostgreSQL after evaluating the long-term needs of a community platform:

| Concern | Azure Table Storage | PostgreSQL |
|---------|--------------------|-----------|
| **Analytics queries** ("how many users signed up this month?") | Full table scan, filter client-side | `SELECT COUNT(*) WHERE created_at > '2026-03-01'` |
| **Marketing emails** ("users who visited place X") | Scan every user's every list | `SELECT email FROM users JOIN list_entries ON ... WHERE place_id = 'X'` |
| **Community metrics** ("most popular places") | Cross-partition scan — impossible at scale | `SELECT place_id, COUNT(*) FROM list_entries GROUP BY place_id` |
| **Better Auth adapter** | Custom adapter (build and maintain yourself) | [Built-in PostgreSQL adapter](https://better-auth.com/docs/adapters/postgresql) via Kysely (zero custom code) |
| **Data integrity** | Application-enforced | Database-enforced (foreign keys, UNIQUE, CHECK constraints) |
| **Cascade deletes** | 6 manual delete operations across tables | `ON DELETE CASCADE` — one statement |
| **Username uniqueness** | Manual partition index | `UNIQUE` constraint on column |

The cost difference is ~$13/month (well within $150 Azure credits). The capability difference is enormous — especially for running a community platform where you need to query across users, send targeted emails, and generate metrics.

**PostgreSQL is the most popular database in the world** ([StackOverflow 2024](https://survey.stackoverflow.co/2024/technology/#most-popular-technologies-database-prof)), battle-tested for 38 years, and used by Instagram, Discord, and Supabase. It's the "tried and true" choice.

### Current Codebase Status (as of March 2026)

| Component | Version | Notes |
|-----------|---------|-------|
| **[Next.js](https://nextjs.org/)** | 16.x | Latest stable |
| **[React](https://react.dev/)** | 19.x | React 19 with [React Compiler](https://react.dev/learn/react-compiler) |
| **[Tailwind CSS](https://tailwindcss.com/)** | 4.x | [CSS-first configuration](https://tailwindcss.com/blog/tailwindcss-v4) |
| **[Vitest](https://vitest.dev/)** | 4.x | Unit testing |
| **[Playwright](https://playwright.dev/)** | 1.57+ | E2E testing |
| **[AI SDK](https://sdk.vercel.ai/)** | 5.x | Vercel AI SDK for RAG chat |

**What Exists:**

- ✅ Core site fully functional (Home, Map, Chat, Contribute, About, Places)
- ✅ AI Chat with RAG ([Azure Cosmos DB](https://learn.microsoft.com/en-us/azure/cosmos-db/introduction) + [Azure OpenAI](https://learn.microsoft.com/en-us/azure/ai-services/openai/overview))
- ✅ Full test infrastructure (Vitest + Playwright)
- ✅ [Airtable](https://airtable.com/) data services with [ISR](https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration)
- ✅ Filter system with context
- ✅ Modal system with context
- ✅ [`better-auth`](https://www.npmjs.com/package/better-auth) package installed (not yet configured)
- ✅ [`@azure/cosmos`](https://www.npmjs.com/package/@azure/cosmos) package installed (used for RAG)

**What Doesn't Exist Yet:**

- ❌ `lib/constants.ts` — needs to be created
- ❌ `lib/auth.ts` — Better Auth not configured
- ❌ `lib/db.ts` — PostgreSQL database client not created
- ❌ Auth API routes (`/api/auth/[...all]`)
- ❌ Auth context/provider
- ❌ Lists API routes and context/provider
- ❌ Any user-facing auth UI (AuthDialog, UserMenu, etc.)
- ❌ Policy pages (`/privacy`, `/cookies`, `/terms`)
- ❌ Cookie consent banner (Termly)
- ❌ Lists page (`/lists`), Community page (`/community`)
- ❌ [`pg`](https://www.npmjs.com/package/pg) package — needs to be installed (PostgreSQL client for Better Auth + app queries)

**Current `lib/` Structure:**

```txt
lib/
├── ai/                        # AI/RAG functionality (complete)
│   ├── airtable-generated-data.ts
│   ├── config.ts
│   ├── cosmos.ts
│   ├── embedding.ts
│   ├── entity-detection.ts
│   ├── index.ts
│   ├── prompts.ts
│   └── rag.ts
├── data-services.ts           # Airtable/CSV data fetching
├── filters.ts                 # Filter definitions & predicates
├── fonts.ts                   # Font configuration
├── parsing.ts                 # Parsing utilities
├── place-type-config.ts       # Place type configuration
├── types.ts                   # TypeScript types
└── utils.ts                   # Utility functions
```

---

## Architecture Decisions

### Authentication: Magic Link + Email OTP

**Decision**: Email-based authentication using [Better Auth's magic link](https://www.better-auth.com/docs/plugins/magic-link) and [email OTP](https://www.better-auth.com/docs/plugins/email-otp) plugins. No passwords, no OAuth providers.

**How It Works:**

1. User enters email address
2. System sends both a magic link and a 6-digit OTP code
3. User either clicks the link in their email OR enters the code on-screen
4. Session is created with a long-lived `httpOnly` cookie

**Why Both Magic Link AND Code?**

- Magic link may not work if user opens email on a different device/browser
- Email code is a reliable fallback — works regardless of device
- Users choose whichever is more convenient

**Session Duration:**

Sessions are configured to effectively never expire. Users stay logged in unless:

- They explicitly sign out
- They clear browser cookies/data
- They switch to a new device (new device = new magic link authentication)

Better Auth session configuration:

```typescript
session: {
  expiresIn: 60 * 60 * 24 * 365 * 10, // 10 years (effectively never)
  updateAge: 60 * 60 * 24,             // Refresh session token daily
}
```

**Rationale:**

- No rotating secrets — zero maintenance burden
- No provider portals to manage
- Works on localhost without special configuration
- Reduces PII to email only (no name, avatar, or OAuth tokens)
- Email is already the universal identifier — everyone has one

**Future Roadmap:** OAuth (Google, Microsoft, Apple) can be added later as an additional sign-in option alongside magic link, not a replacement.

### Storage: [Azure Database for PostgreSQL Flexible Server](https://learn.microsoft.com/en-us/azure/postgresql/)

**Decision**: Use Azure Database for PostgreSQL Flexible Server (Burstable B1ms tier) for all user data.

**Rationale**:

- Managed PostgreSQL — Microsoft handles patching, backups, high availability
- Burstable B1ms (1 vCore, 2 GB RAM, 32 GB storage) handles thousands of users
- ~$13–15/month, well within $150/month Azure credits
- [Built-in Better Auth adapter](https://better-auth.com/docs/adapters/postgresql) — zero custom code for auth tables
- SQL queries for analytics, marketing segmentation, community metrics
- Foreign keys enforce data integrity; `ON DELETE CASCADE` handles account deletion
- Built-in [pgBouncer connection pooling](https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/concepts-pgbouncer) for thousands of concurrent connections
- Standard PostgreSQL — 38 years battle-tested, largest extension ecosystem, #1 database by developer preference

**Better Auth Integration** (from [official PostgreSQL adapter docs](https://better-auth.com/docs/adapters/postgresql)):

```typescript
import { betterAuth } from "better-auth";
import { Pool } from "pg";

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
});
```

Better Auth uses [Kysely](https://kysely.dev/) under the hood for PostgreSQL. The `pg` package (node-postgres) is the only dependency. Better Auth's CLI (`npx auth@latest migrate`) auto-creates all auth tables (user, session, account, verification) directly in PostgreSQL.

**Scaling Path**: If traffic grows beyond B1ms capacity, scale to B2s (~$26/month) or General Purpose (~$100/month) with zero code changes — just a slider in Azure Portal.

### Email Service: [Azure Communication Services](https://learn.microsoft.com/en-us/azure/communication-services/concepts/email/email-overview)

**Decision**: Use [Azure Communication Services (ACS) Email](https://learn.microsoft.com/en-us/azure/communication-services/concepts/email/email-overview) for sending magic links and OTP codes.

**Rationale**:

- Free tier: 100 emails/day (more than enough for expected sign-ups)
- Beyond free tier: ~$0.00025 per email (negligible)
- Stays within existing Azure ecosystem and $150/month Azure credits
- No new vendor relationship required

### Publishing: Community Feed via SQL Query

**Decision**: Published lists are queried directly from the `user_lists` table using `WHERE is_public = true ORDER BY published_at DESC`. No separate index table needed — PostgreSQL handles this with a simple index. Community feed available at `/community` for all users (logged in or not).

**Rationale**:

- PostgreSQL can efficiently query across all users' lists with proper indexes (unlike Table Storage which required cross-partition scans)
- No dual-write complexity — publishing just flips `is_public = true` on the existing list row
- Pagination via cursor-based `WHERE published_at < ?` with `LIMIT`
- `/community` page always visible in navigation to encourage discovery

**Shareable URL Format:** `/community/lists/{listId}` — no user identifier in the URL for privacy.

### Usernames: Reddit-Style Public Identity

**Decision**: Reddit-style usernames for public identity on published lists. Optional until publishing. Changeable anytime.

**Username Rules** (matching Reddit conventions):
- 3–20 characters
- Alphanumeric characters and underscores only: `[a-zA-Z0-9_]`
- No spaces
- Case-insensitive uniqueness (store lowercase for comparison, display as entered)
- Changeable anytime (it's cosmetic, not the identity key — `userId` tracks identity internally)

**UX Flow:**
- **Settings page** (`/settings`): Username field, clearly labeled optional. Helper text: "Choose a display name — like a Reddit username. Can be your name, a nickname, or something fun. This will be shown on any lists you publish publicly."
- **First publish attempt**: If `username` is null, a dialog prompts the user to choose one before proceeding. Not a separate page — a modal that validates uniqueness inline (debounced API call as they type), then continues the publish flow.
- **Published lists**: Display username as author. Example: "A list by **coffee_crawler_clt**"

**Uniqueness Check:** The `username` column on the `user` table has a `UNIQUE` constraint on `LOWER(username)`. Availability checks are a simple `SELECT` query — no manual index partition needed.

### Ratings & Rankings

**Decision**: 1–5 star ratings with manual drag-and-drop reordering via [@dnd-kit/sortable](https://dndkit.com/).

**Rating Scale**: 1–5 numeric stars with labels (Skip it / It's okay / Solid / Great / Outstanding). Ratings are optional — `null` means unrated.

**Sort Options** available on any list view:

| Sort | How It Works |
|------|-------------|
| **Custom order** (default) | By `position` field. Drag-and-drop to reorder. |
| **By rating** | High → low. Unrated places sorted to bottom. |
| **Recently added** | By `addedAt` descending. |
| **Alphabetical** | By place name. |

**Drag-and-Drop Library**: [@dnd-kit/sortable](https://dndkit.com/). Initial position of newly added places = end of list (current max position + 1). Reorder uses sequential integers with SQL transactions (see [Database Schema](#database-schema) for details).

### Content Moderation

**Decision**: Notes are private-only. Ratings shown on public lists with disclaimer. Profanity filter on list names/descriptions at publish time.

**Rationale**: Free-text notes could contain offensive content. Stripping them from public views eliminates the moderation problem entirely. Star ratings (1–5) are numeric and can't be offensive. A disclaimer protects the site from being associated with user opinions.

**Implementation:**
- At publish time, run list name and description through [leo-profanity](https://www.npmjs.com/package/leo-profanity) (npm package, no API calls)
- If profanity detected, block publish with inline validation message
- Public list views show ratings + disclaimer banner, never notes
- Private notes remain visible only to the list owner

### Offline Resilience: Deferred

**Decision**: Cut from v1. If an API call fails, show an error toast and let the user retry manually.

**Rationale**: Optimistic updates with a localStorage-backed retry queue, conflict resolution, and sync-on-login adds significant complexity for a feature that hasn't launched yet. Ship without it; add only if users report actual issues with flaky connections.

**Future Roadmap**: If needed, implement optimistic UI updates with a retry queue. The normalized `listEntries` table (one row per place) makes conflict resolution simpler than the original JSON blob approach — individual row operations don't conflict with each other.

### Backend Repository: No Changes Required

**Decision**: The `third-places-data` Azure Functions backend does not need any code changes for user lists. All list-related API routes live as Next.js API routes in the `charlotte-third-places` repository.

**Rationale**: User list operations are simple CRUD on PostgreSQL, well within what Next.js API routes handle. The Azure Functions backend specializes in data enrichment (Google Maps, Outscraper, Airtable sync) which is unrelated to user lists.

**Azure PostgreSQL is an infrastructure dependency only**: The Flexible Server is created in Azure Portal (Manual Step 2), and the connection string is consumed by the Next.js app via the `DATABASE_URL` environment variable.

### Admin Console

**Decision**: Admin functionality uses the same magic link auth as regular users. The admin email (`segun@charlottethirdplaces.com`) is identified by an `is_admin` flag on the `user` table — no separate password system.

**Why No Admin Password:**

- A password for one user is a whole new auth flow to build, test, and maintain
- If the email inbox is compromised, the attacker could reset any password anyway
- Magic link is one-time-use, expires in 10 minutes — more secure than a static password
- One auth flow for everyone, not two

**Admin Identification:**

- `is_admin` column on `user` table (Better Auth `additionalFields`, defaults to `false`)
- Sign in via magic link to `segun@charlottethirdplaces.com` like any user
- An idempotent seed script (run on every deploy) sets `is_admin = true` for the admin email
- Every admin API route checks `session.user.isAdmin === true` before proceeding
- Non-admin users who navigate to `/admin` get redirected to home

**Admin Pages:**

| Page | Route | What You Can Do |
|------|-------|----------------|
| **Dashboard** | `/admin` | User count, list count, published list count, most saved places, recent sign-ups |
| **Users** | `/admin/users` | Search users by email/username. View user details (lists, ratings). Ban/unban user. Delete user account. |
| **Published Lists** | `/admin/lists` | View all published lists. Unpublish any list. Delete any list. Feature/unfeature a list. |

**Ban vs Delete:**
- **Ban** (`is_banned = true`): User can't sign in, published lists hidden from community, data preserved (reversible). For "this person is being problematic but I might want to undo this."
- **Delete**: Cascade deletes everything (`ON DELETE CASCADE`). Irreversible. For "this person needs to be gone."

**Navigation:** The admin console is not in public navigation. Accessed by URL only (`/admin`). When `isAdmin` is true, the UserMenu dropdown adds an "Admin" link. Non-admin users never see it.

### Schema Management: Migration-Based CI/CD

**Decision**: All schema changes are deployed automatically via [node-pg-migrate](https://github.com/salsita/node-pg-migrate) + GitHub Actions. No manual SQL commands after the initial Azure resource creation.

**How It Works:**

1. **Better Auth tables** — `npx auth@latest migrate` creates/updates `user`, `session`, `account`, `verification` tables and adds custom columns (`username`, `is_admin`, `is_banned`). Already idempotent — skips existing tables, adds missing columns.

2. **Application tables** — `npx node-pg-migrate up` runs numbered SQL migration files from `migrations/`. A `pgmigrations` table tracks which files have been applied. Already idempotent — only runs new migrations.

3. **Admin seed** — `npx tsx scripts/seed-admin.ts` checks if `segun@charlottethirdplaces.com` has `is_admin = true`. If not, sets it. If user hasn't signed up yet, does nothing. Idempotent by design.

**GitHub Action:** Runs on push to `main` when migration files, seed script, or auth config change. All three steps execute in sequence. No manual intervention needed.

**Workflow for Future Schema Changes:**
1. Create a new migration file: `migrations/002_add_whatever.sql`
2. Commit and push to `main`
3. GitHub Action detects the new file → `node-pg-migrate up` applies it
4. Done. No portal, no psql, no manual anything.

**Local Development:** Same commands work locally: `npx auth@latest migrate && npx node-pg-migrate up && npx tsx scripts/seed-admin.ts`. Run once on setup, then only when adding new migrations.

### Curator Lists: Airtable + ISR

**Decision**: Curator lists managed in [Airtable](https://airtable.com/) using a [linked-record model](https://support.airtable.com/docs/supported-field-types-in-airtable-overview#link), cached via [ISR](https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration), revalidated on publish.

**Airtable Structure**:

Two tables with a many-to-many relationship via Airtable linked records:

1. **Charlotte Third Places** (existing table) — Single source of truth for all place data
   - Contains `Google Maps Place Id`, `Curator's Comments`, all place metadata
   - New field: `Curator Lists` (linked to Curator Lists table, multiple)

2. **Curator Lists** (new table) — List-level metadata
   - `List Name` (Single line text)
   - `List Description` (Long text)
   - `Published` (Checkbox) — Only published lists shown on website
   - `Places` (Linked to Charlotte Third Places, multiple)

A place can belong to many curator lists and a curator list can contain many places. No duplicated place records since membership is represented only by Airtable links.

**Rationale**:

- Airtable already used for place data — no new infrastructure
- Linked records = no data duplication, single source of truth
- ISR provides fast reads with on-demand invalidation
- Existing `/api/revalidate` endpoint can be reused
- No additional Azure tables needed for curator lists

**Local Development**:

- Unlike place data (which uses local CSV in dev), curator lists always fetch from real Airtable API
- Airtable Team plan provides 100,000 API calls/month — sufficient for development
- No need for local CSV fallback for curator lists

---

## Database Schema

### PostgreSQL Tables

All tables live in a single [Azure Database for PostgreSQL Flexible Server](https://learn.microsoft.com/en-us/azure/postgresql/) instance. Better Auth manages its own tables (`user`, `session`, `account`, `verification`); the application manages the rest (`user_list`, `list_entry`).

#### Authentication Tables (Better Auth Managed)

Better Auth auto-creates and manages these tables via `npx auth@latest migrate`. The `user` table is extended with a custom `username` field using Better Auth's [`additionalFields`](https://better-auth.com/docs/concepts/database#extending-core-schema) configuration.

```sql
-- Better Auth core tables (auto-created by `npx auth@latest migrate`)
-- Shown here for reference. Do NOT create these manually.

CREATE TABLE "user" (
  id         TEXT PRIMARY KEY,         -- UUID generated by Better Auth
  name       TEXT NOT NULL,            -- Display name (we set this to email prefix on signup)
  email      TEXT NOT NULL UNIQUE,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  image      TEXT,                     -- Unused (we don't collect avatars)
  username   TEXT,                     -- Custom field: Reddit-style username (nullable until set)
  is_admin   BOOLEAN NOT NULL DEFAULT FALSE,  -- Custom field: admin flag (set via seed script)
  is_banned  BOOLEAN NOT NULL DEFAULT FALSE,  -- Custom field: banned users can't sign in
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Case-insensitive uniqueness on username (allows NULL — only enforced when set)
CREATE UNIQUE INDEX idx_user_username_lower ON "user" (LOWER(username)) WHERE username IS NOT NULL;

CREATE TABLE session (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  token      TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE account (
  id                       TEXT PRIMARY KEY,
  user_id                  TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  account_id               TEXT NOT NULL,
  provider_id              TEXT NOT NULL,           -- "magic-link" or "email-otp"
  access_token             TEXT,
  refresh_token            TEXT,
  access_token_expires_at  TIMESTAMPTZ,
  refresh_token_expires_at TIMESTAMPTZ,
  scope                    TEXT,
  id_token                 TEXT,
  password                 TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE verification (
  id         TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,            -- Email address
  value      TEXT NOT NULL,            -- Magic link token or OTP code
  expires_at TIMESTAMPTZ NOT NULL,     -- 10 minutes from creation
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Note:** The `account` table is required by Better Auth's core schema even for magic link authentication — it stores the magic-link provider relationship. Better Auth creates it automatically.

**Custom `username` Field Configuration:**

```typescript
// lib/auth.ts — Better Auth server config
export const auth = betterAuth({
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  user: {
    additionalFields: {
      username: {
        type: "string",
        required: false,
        defaultValue: null,
        input: false, // don't allow setting on signup — set via /api/user/username
      },
      isAdmin: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false, // never settable via API — only via seed script
      },
      isBanned: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false, // only settable via admin API
      },
    },
  },
  // ... magic link + OTP plugins
});
```

**Admin Seed Script** (`scripts/seed-admin.ts`):

```typescript
import { Pool } from "pg";

const ADMIN_EMAIL = "segun@charlottethirdplaces.com";

async function seedAdmin() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const result = await pool.query(
    `UPDATE "user" SET is_admin = true WHERE email = $1 AND is_admin = false`,
    [ADMIN_EMAIL]
  );
  if (result.rowCount > 0) {
    console.log(`Admin flag set for ${ADMIN_EMAIL}`);
  } else {
    console.log(`No action needed (user already admin or hasn't signed up yet)`);
  }
  await pool.end();
}

seedAdmin().catch(console.error);
```

Run it 1000 times — same result. If the admin hasn't signed up yet, it updates 0 rows and exits cleanly.

#### Application Tables (Created via SQL Migration)

These tables are created manually via a SQL migration file (not managed by Better Auth).

```sql
-- User Lists (list metadata — one row per list)
CREATE TABLE user_list (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  slug            TEXT NOT NULL,           -- "favorites", "to-visit", "visited", or "custom_{uuid}"
  name            TEXT NOT NULL,           -- e.g., "Favorites", "Best Coffee Spots"
  description     TEXT NOT NULL DEFAULT '',
  is_default_list BOOLEAN NOT NULL DEFAULT FALSE,
  is_public       BOOLEAN NOT NULL DEFAULT FALSE,
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, slug)                   -- Each user has one list per slug
);

-- Indexes for common queries
CREATE INDEX idx_user_list_user_id ON user_list(user_id);
CREATE INDEX idx_user_list_public ON user_list(is_public, published_at DESC) WHERE is_public = TRUE;

-- List Entries (one row per place-in-list)
CREATE TABLE list_entry (
  id       TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id  TEXT NOT NULL REFERENCES user_list(id) ON DELETE CASCADE,
  place_id TEXT NOT NULL,                  -- Google Maps Place ID
  notes    TEXT NOT NULL DEFAULT '',       -- Private notes (never shown publicly)
  rating   SMALLINT CHECK (rating >= 1 AND rating <= 5),  -- 1-5 stars, NULL = unrated
  position INTEGER NOT NULL,              -- Sequential integer for manual ordering
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (list_id, place_id)              -- No duplicate places in same list
);

-- Indexes for common queries
CREATE INDEX idx_list_entry_list_id ON list_entry(list_id);
CREATE INDEX idx_list_entry_place_id ON list_entry(place_id);  -- For "most saved places" queries
```

**Why This Schema Works for a Community Platform:**

| Query | SQL |
|-------|-----|
| "How many users signed up this month?" | `SELECT COUNT(*) FROM "user" WHERE created_at > '2026-03-01'` |
| "Most saved places across all users" | `SELECT place_id, COUNT(*) FROM list_entry GROUP BY place_id ORDER BY COUNT(*) DESC` |
| "Average rating for a place" | `SELECT AVG(rating) FROM list_entry WHERE place_id = $1 AND rating IS NOT NULL` |
| "Community feed (newest published)" | `SELECT * FROM user_list ul JOIN "user" u ON ul.user_id = u.id WHERE ul.is_public = TRUE ORDER BY ul.published_at DESC LIMIT 20` |
| "Users who visited place X" (for email campaign) | `SELECT u.email FROM "user" u JOIN user_list ul ON u.id = ul.user_id JOIN list_entry le ON ul.id = le.list_id WHERE ul.slug = 'visited' AND le.place_id = $1` |
| "Cascade delete a user" | `DELETE FROM "user" WHERE id = $1` — foreign keys handle everything |

**Reorder Strategy: Sequential Integers with SQL Transactions**

Positions are simple sequential integers: `1, 2, 3, ..., N`. On drag-and-drop reorder:

1. User drags item from position 5 to position 2
2. Compute new positions in memory (array splice)
3. Execute in a single SQL transaction:

```sql
BEGIN;
UPDATE list_entry SET position = 2 WHERE id = $1;
UPDATE list_entry SET position = 3 WHERE id = $2;
UPDATE list_entry SET position = 4 WHERE id = $3;
UPDATE list_entry SET position = 5 WHERE id = $4;
COMMIT;
```

PostgreSQL transactions are ACID — all updates succeed atomically or none do. No edge cases.

**List Limits** (enforced in API routes via constants in `lib/constants.ts`):

- `MAX_CUSTOM_LISTS = 5` — custom lists per user (3 defaults don't count)
- `MAX_PLACES_PER_LIST = 100` — places per list
- `MAX_NOTE_LENGTH = 500` — characters per note
- `RATING_MIN = 1` — minimum star rating
- `RATING_MAX = 5` — maximum star rating

**Rating Labels:**

| Stars | Label |
|-------|-------|
| 1 | Skip it |
| 2 | It's okay |
| 3 | Solid |
| 4 | Great |
| 5 | Outstanding |

Ratings are optional — a place in a list can have no rating (NULL). The labels are displayed in the UI alongside the stars for clarity but are not stored.

**Public List Content Rules:**

When a list is published (`is_public = true`), the public view shows:
- List name and description (owner-written, profanity-filtered at publish time)
- Username of the author (e.g., "by coffee_crawler_clt") — fetched via `JOIN` on `user` table
- All places with their curated data (photos, address, attributes — controlled by site curator)
- The user's star ratings (1–5) for each rated place
- **Notes are stripped entirely** — never shown publicly (the `SELECT` for public views simply omits the `notes` column)
- **Disclaimer banner**: "Ratings reflect this community member's personal experience, not an official Charlotte Third Places rating."

**Privacy Note**: Published lists display the **username** and **list name** — never the author's email. The `user_id` is used only for internal JOINs.

---

## API Routes

### Authentication Routes (Better Auth handles these)

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/[...all]` | ALL | Better Auth catch-all handler (magic link, OTP, session management) |

### Lists Routes

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/lists` | GET | Required | Get all lists for current user (metadata only) |
| `/api/lists` | POST | Required | Create custom list |
| `/api/lists/[listId]` | GET | Required | Get single list with entries and full place data |
| `/api/lists/[listId]` | PATCH | Required | Update list metadata (name, description) |
| `/api/lists/[listId]` | DELETE | Required | Delete custom list (not defaults) |
| `/api/lists/[listId]/places` | POST | Required | Add place to list (with optional rating, notes) |
| `/api/lists/[listId]/places/[placeId]` | PATCH | Required | Update entry (notes, rating) |
| `/api/lists/[listId]/places/[placeId]` | DELETE | Required | Remove place from list |
| `/api/lists/[listId]/reorder` | POST | Required | Batch update positions after drag-and-drop |
| `/api/lists/[listId]/publish` | POST | Required | Publish list to community (requires username) |
| `/api/lists/[listId]/unpublish` | POST | Required | Remove list from community |

### Community Routes

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/community/lists` | GET | None | Get published lists feed (paginated, newest first) |
| `/api/community/lists/[listId]` | GET | None | Get full public list by ID (ratings visible, notes stripped) |

### User Routes

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/user/username` | POST | Required | Set username (first time) |
| `/api/user/username` | PATCH | Required | Change username |
| `/api/user/username/check` | GET | None | Check username availability (`?username=foo`) |
| `/api/user/export` | GET | Required | Download all user data as JSON |
| `/api/user` | DELETE | Required | Delete account and all data |

### Curator Routes (Admin Only)

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/curator/lists` | GET | None | Get curator lists (from Airtable, ISR cached) |

### Admin Routes (Admin Only)

Every admin route checks `session.user.isAdmin === true` and returns 403 if not.

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/admin/stats` | GET | Admin | Dashboard metrics (user count, list count, published count, most saved places, recent sign-ups) |
| `/api/admin/users` | GET | Admin | Paginated user list with search by email/username |
| `/api/admin/users/[userId]` | GET | Admin | User detail (lists, entries, publish history) |
| `/api/admin/users/[userId]` | DELETE | Admin | Delete user account (cascade) |
| `/api/admin/users/[userId]/ban` | POST | Admin | Ban user (`is_banned = true`) |
| `/api/admin/users/[userId]/unban` | POST | Admin | Unban user (`is_banned = false`) |
| `/api/admin/lists` | GET | Admin | All published lists with moderation info |
| `/api/admin/lists/[listId]` | DELETE | Admin | Delete any list |
| `/api/admin/lists/[listId]/unpublish` | POST | Admin | Force-unpublish any list |

---

## UI Components

### New Components to Create

| Component | Location | Description |
|-----------|----------|-------------|
| `SaveButton.tsx` | `components/` | Bookmark icon button, opens list picker |
| `VisitedToggle.tsx` | `components/` | Checkmark toggle on place cards and list view — adds/removes from Visited list |
| `StarRating.tsx` | `components/` | 1–5 star input with hover labels (Skip it / It's okay / Solid / Great / Outstanding) |
| `ListPicker.tsx` | `components/` | Drawer (mobile) / Sheet (desktop) with checkboxes for selecting lists |
| `SortableListEntries.tsx` | `components/` | Drag-and-drop sortable list of places using @dnd-kit/sortable |
| `ListsPageClient.tsx` | `app/lists/` | Main lists page with tabs per list, sort options, drag-and-drop |
| `CommunityPageClient.tsx` | `app/community/` | Community feed showing published lists |
| `ListCard.tsx` | `components/` | Card showing list preview (name, author username, place count, thumbnails) |
| `PublishListDialog.tsx` | `components/` | Confirmation dialog for publishing (triggers username prompt if not set) |
| `UsernameDialog.tsx` | `components/` | Modal for setting/changing Reddit-style username with inline availability check |
| `CreateListDialog.tsx` | `components/` | Form to create custom list |
| `AuthDialog.tsx` | `components/` | Sign in prompt — email input, then magic link/code entry |
| `UserMenu.tsx` | `components/` | Username/email display dropdown with settings, sign out |

### New Pages to Create

| Page | Route | Description |
|------|-------|-------------|
| `app/community/page.tsx` | `/community` | Community feed — all published lists, newest first |
| `app/community/lists/[listId]/page.tsx` | `/community/lists/{listId}` | Public list view (ratings visible, notes stripped, disclaimer) |
| `app/settings/page.tsx` | `/settings` | Account settings (username, export data, delete account) |
| `app/admin/page.tsx` | `/admin` | Admin dashboard (user count, list count, metrics) — admin only |
| `app/admin/users/page.tsx` | `/admin/users` | Admin user management (search, ban, delete) — admin only |
| `app/admin/lists/page.tsx` | `/admin/lists` | Admin list moderation (unpublish, delete) — admin only |
| `app/privacy/page.tsx` | `/privacy` | Privacy Policy (Termly embed) |
| `app/cookies/page.tsx` | `/cookies` | Cookie Policy (Termly embed) |
| `app/terms/page.tsx` | `/terms` | Terms and Conditions (Termly embed) |

### Existing Components to Modify

| Component | Changes |
|-----------|---------|
| `PlaceCard.tsx` | Add SaveButton; add VisitedToggle (checkmark overlay, visible when logged in) |
| `PlaceModal.tsx` | Add SaveButton in header; add VisitedToggle |
| `PlacePageClient.tsx` | Add SaveButton; add VisitedToggle |
| `MainNavigation.tsx` | Add "Community" always; add "Lists" when authenticated |
| `MobileNavigation.tsx` | Logged out: replace About with Community. Logged in: Home, Map, Chat, Lists, Community |
| `SiteHeader.tsx` | Add UserMenu when authenticated |
| `SiteFooter.tsx` | Add "About", "Contribute" (logged-in mobile fallback), "Privacy", "Cookies", "Terms" links |
| `Icons.tsx` | Add Bookmark, BookmarkCheck, Star, StarFilled, Check, GripVertical icons |

### shadcn/ui Components to Install

```bash
npx shadcn@latest add checkbox input-otp
```

Already available: [Drawer](https://ui.shadcn.com/docs/components/drawer), [Sheet](https://ui.shadcn.com/docs/components/sheet), [Tabs](https://ui.shadcn.com/docs/components/tabs), [Dialog](https://ui.shadcn.com/docs/components/dialog), [Button](https://ui.shadcn.com/docs/components/button), [Avatar](https://ui.shadcn.com/docs/components/avatar)

### npm Packages to Install

```bash
npm install pg @azure/communication-email @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities leo-profanity node-pg-migrate
```

> Note: `better-auth` is already installed. The `pg` package is the Node.js PostgreSQL client used by Better Auth's built-in [Kysely adapter](https://better-auth.com/docs/adapters/postgresql) and by application queries. `node-pg-migrate` handles idempotent schema migrations.

### Authentication UX Flow

```
┌─────────────────────────────────────┐
│         Sign In to Save Lists       │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  Enter your email             │  │
│  └───────────────────────────────┘  │
│                                     │
│  [ Continue ]                       │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│         Check Your Email            │
│                                     │
│  We sent a sign-in link and code    │
│  to your email.                     │
│                                     │
│  Click the link in your email       │
│  — or —                             │
│  Enter the 6-digit code below:      │
│                                     │
│  ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐          │
│  │ │ │ │ │ │ │ │ │ │ │ │          │
│  └─┘ └─┘ └─┘ └─┘ └─┘ └─┘          │
│                                     │
│  [ Verify Code ]                    │
│                                     │
│  Didn't receive it? [Resend]        │
└─────────────────────────────────────┘
```

---

## Navigation Changes

### Desktop (MainNavigation.tsx)

**Logged Out:**

```
Home | Map | Chat | Contribute | Community | About
```

**Logged In:**

```
Home | Map | Chat | Contribute | Lists | Community | About    [User Menu]
```

### Mobile (MobileNavigation.tsx)

**Logged Out:**

```
🏠 Home | 🗺️ Map | 💬 Chat | ➕ Contribute | 🌐 Community
```

About moves to SiteFooter (standard pattern for mobile — footer always accessible).

**Logged In:**

```
🏠 Home | 🗺️ Map | 💬 Chat | 📚 Lists | 🌐 Community
```

Contribute moves to UserMenu dropdown + SiteFooter when logged in. Lists and Community take priority in mobile nav because they're the primary engagement surfaces for authenticated users.

### Mobile Header (SiteHeader.tsx)

**Logged In:**

- Add user icon on right side (first letter of username, or generic icon if no username set)
- Tap opens UserMenu with: My Lists, Community, Contribute, Settings, About, Sign Out
- If `isAdmin`: also shows "Admin" link to `/admin`

### SiteFooter Links

Footer always includes: About, Contribute, Privacy, Cookies, Terms, and "Consent Preferences" (conditionally shown based on `NEXT_PUBLIC_ENABLE_COOKIE_CONSENT`).

---

## Implementation Checklist

Ordered list of implementation tasks. Complete in sequence; some tasks depend on prior ones.

### Authentication Setup

- [ ] Install dependencies:
  ```bash
  npm install pg @azure/communication-email @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities leo-profanity node-pg-migrate
  npx shadcn@latest add checkbox input-otp
  ```
  > Note: `better-auth` is already installed. `pg` is the PostgreSQL client. `node-pg-migrate` handles schema migrations.
- [ ] Create `lib/constants.ts` with list limits, rating config, username rules, feature flags, session config
- [ ] Create Azure Communication Services resource (see Manual Steps)
- [ ] Create Azure Database for PostgreSQL Flexible Server (see Manual Steps)
- [ ] Create `lib/db.ts` — PostgreSQL connection pool (shared `Pool` instance from `pg`)
- [ ] Create `lib/auth.ts` — Better Auth server config with PostgreSQL adapter, magic link + email OTP plugins, `username` additionalField
- [ ] Run `npx auth@latest migrate` to auto-create Better Auth tables (user, session, account, verification)
- [ ] Run application SQL migration to create `user_list` and `list_entry` tables
- [ ] Create `lib/auth-client.ts` — Better Auth client-side utilities
- [ ] Create `lib/email.ts` — Azure Communication Services email sender
- [ ] Create `app/api/auth/[...all]/route.ts` (Better Auth catch-all handler)
- [ ] Create AuthContext and AuthProvider
- [ ] Build AuthDialog component (email input → code entry)
- [ ] Build UsernameDialog component (Reddit-style username picker with inline validation)
- [ ] Add UserMenu to SiteHeader

### Core Lists Functionality

- [ ] Create `lib/db.ts` PostgreSQL connection pool
- [ ] Create `lib/lists-service.ts` for API calls (CRUD for lists and entries via SQL)
- [ ] Build API routes:
  - `/api/lists` (GET, POST)
  - `/api/lists/[listId]` (GET, PATCH, DELETE)
  - `/api/lists/[listId]/places` (POST)
  - `/api/lists/[listId]/places/[placeId]` (PATCH, DELETE)
  - `/api/lists/[listId]/reorder` (POST — batch position update)
- [ ] Create ListsContext and ListsProvider
- [ ] Build SaveButton and ListPicker components
- [ ] Build VisitedToggle component (checkmark overlay for place cards)
- [ ] Build StarRating component (1–5 stars with hover labels)
- [ ] Add SaveButton and VisitedToggle to PlaceCard, PlaceModal, PlacePageClient

### Lists Page

- [ ] Create `/app/lists/page.tsx` with tabs
- [ ] Build ListsPageClient with:
  - Tab per list (Favorites, To Visit, Visited, custom lists)
  - Sort options (Custom order, By rating, Recently added, Alphabetical)
  - Drag-and-drop reordering via SortableListEntries + @dnd-kit
  - StarRating inline editing
  - Notes editing
  - Remove from list action
  - Empty state per list
- [ ] Update navigation:
  - MainNavigation: Add "Community" always, "Lists" when logged in
  - MobileNavigation: Logged out → replace About with Community. Logged in → Home, Map, Chat, Lists, Community
  - SiteFooter: Add About, Contribute, Privacy, Cookies, Terms

### Username & User Routes

- [ ] Build username API routes:
  - `/api/user/username` (POST set, PATCH change)
  - `/api/user/username/check` (GET availability)
- [ ] Integrate UsernameDialog into publish flow (prompt if username is null)
- [ ] Add username field to Settings page

### Community Features

- [ ] Build publish/unpublish API routes (with profanity filter on name/description)
- [ ] Create PublishListDialog component (triggers UsernameDialog if no username)
- [ ] Add publish toggle to list settings
- [ ] Build community feed:
  - `/app/community/page.tsx` (paginated, newest first)
  - `/app/community/lists/[listId]/page.tsx` (public list view with ratings, no notes, disclaimer)
  - `/api/community/lists` endpoint
  - `/api/community/lists/[listId]` endpoint
  - ListCard component
- [ ] Set up curator lists:
  - Create `lib/curator-lists-service.ts`
  - Add `getCuratorLists()` function that:
    - Fetches from `Curator Lists` table with `filterByFormula: '{Published} = TRUE()'`
    - Resolves linked `Places` field to full place data
    - Uses `Boolean(value)` pattern for checkbox parsing (matches `Featured` field handling)
  - Create `/api/curator/lists` route with ISR caching
  - Note: Always hits real Airtable API (no local CSV fallback needed)

### Account Management

- [ ] Build data export:
  - `/api/user/export` endpoint
  - Download as JSON (lists, entries, ratings, notes, username)
- [ ] Build account deletion:
  - `/api/user` DELETE endpoint
  - `DELETE FROM "user" WHERE id = $1` — foreign keys cascade to all related tables
  - Confirmation dialog
- [ ] Build Settings page (`/settings`) with:
  - Username field (set/change)
  - Export data button
  - Delete account button
  - Privacy link

### Termly Policy Pages & Cookie Consent

- [ ] Add `NEXT_PUBLIC_ENABLE_COOKIE_CONSENT=true` to `.env` files
- [ ] Add cookie consent constants to `lib/constants.ts`
- [ ] Add Termly consent banner script to `layout.tsx` (before GoogleTagManager)
- [ ] Create `/app/privacy/page.tsx` with Privacy Policy embed
- [ ] Create `/app/cookies/page.tsx` with Cookie Policy embed
- [ ] Create `/app/terms/page.tsx` with Terms and Conditions embed
- [ ] Add footer links: Privacy, Cookies, Terms
- [ ] Add "Consent Preferences" button to footer (conditionally shown)
- [ ] Add Privacy link to UserMenu dropdown

### Admin Console

- [ ] Add `is_admin` and `is_banned` to Better Auth `additionalFields` in `lib/auth.ts`
- [ ] Create `scripts/seed-admin.ts` (idempotent: sets `is_admin = true` for `segun@charlottethirdplaces.com`)
- [ ] Add banned-user check to auth flow (block session creation if `is_banned = true`)
- [ ] Build admin API routes:
  - `/api/admin/stats` (GET — dashboard metrics)
  - `/api/admin/users` (GET — paginated user search)
  - `/api/admin/users/[userId]` (GET detail, DELETE account)
  - `/api/admin/users/[userId]/ban` (POST) and `/unban` (POST)
  - `/api/admin/lists` (GET — all published lists)
  - `/api/admin/lists/[listId]` (DELETE) and `/unpublish` (POST)
- [ ] Build admin pages:
  - `/app/admin/page.tsx` (dashboard with metrics)
  - `/app/admin/users/page.tsx` (user management table)
  - `/app/admin/lists/page.tsx` (published list moderation)
- [ ] Add admin guard: redirect non-admin users from `/admin/*` pages
- [ ] Add "Admin" link in UserMenu (only visible when `isAdmin`)

### Schema Management CI/CD

- [ ] Create `migrations/001_create_list_tables.sql` with `user_list` and `list_entry` DDL
- [ ] Create `scripts/seed-admin.ts` (idempotent admin seed)
- [ ] Create `.github/workflows/db-migrate.yml` GitHub Action:
  - Step 1: `npx auth@latest migrate` (Better Auth tables)
  - Step 2: `npx node-pg-migrate up` (application tables)
  - Step 3: `npx tsx scripts/seed-admin.ts` (admin seed)
  - Triggers on push to `main` when `migrations/**`, `scripts/seed-admin.ts`, or `lib/auth.ts` change
- [ ] Add `DATABASE_URL` and `BETTER_AUTH_SECRET` to GitHub repository secrets
- [ ] Verify: push a migration, confirm GitHub Action applies it

### Error Handling & Polish

- [ ] Add error toasts for failed API calls (save, rate, reorder)
- [ ] Add loading states for all async operations
- [ ] Add empty states for lists with no places
- [ ] Final testing and bug fixes

---

## Manual Configuration Steps

### 1. Create Azure Communication Services Resource ⏳ TODO

1. Go to [Azure Portal](https://portal.azure.com/)
2. Create a new **Communication Services** resource
   - Resource group: use existing `rg-third-places-data`
   - Name: `acs-third-places` (or similar)
3. After creation, go to **Email** → **Domains**
4. Set up a verified sender domain or use the Azure-managed `*.azurecomm.net` domain for development
5. For production, configure a custom domain (e.g., `noreply@charlottethirdplaces.com`)
6. Go to **Keys** → Copy the **Connection string**
7. Save as `AZURE_ACS_CONNECTION_STRING` in `.env`

### 2. Create Azure Database for PostgreSQL Flexible Server ⏳ TODO

1. Go to [Azure Portal](https://portal.azure.com/)
2. Search for **Azure Database for PostgreSQL Flexible Server** and click **Create**
3. Configure:
   - **Resource group**: use existing `rg-third-places-data`
   - **Server name**: `pg-third-places` (or similar)
   - **Region**: Same as other resources (e.g., East US)
   - **PostgreSQL version**: Latest stable (16+)
   - **Compute tier**: **Burstable B1ms** (1 vCore, 2 GB RAM) — ~$13–15/month
   - **Storage**: 32 GB (minimum, auto-grows)
   - **Authentication**: PostgreSQL authentication (username + password)
4. Set admin username and password (save securely — needed for connection string)
5. Under **Networking**:
   - Allow public access with firewall rules
   - Add your development IP address
   - Check **Allow public access from any Azure service** (for Vercel serverless functions)
6. Click **Review + Create** → **Create**
7. After creation, go to **Connect** and note the connection string format:
   ```
   postgresql://{admin_user}:{password}@{server_name}.postgres.database.azure.com:5432/{database_name}?sslmode=require
   ```
8. Create a database named `thirdplaces`:
   - Use the **Connect** blade in Azure Portal to open Cloud Shell, or connect via `psql`:
   ```bash
   psql "postgresql://admin@pg-third-places.postgres.database.azure.com:5432/postgres?sslmode=require"
   CREATE DATABASE thirdplaces;
   ```
9. Save the full connection string as `DATABASE_URL` in `.env`:
   ```
   DATABASE_URL=postgresql://admin:{password}@pg-third-places.postgres.database.azure.com:5432/thirdplaces?sslmode=require
   ```

### 3. Run Database Migrations ⏳ TODO

Migrations are automated via GitHub Actions on push to `main`. For initial setup or local development, run manually:

1. With `DATABASE_URL` set in `.env`, run Better Auth migration to create auth tables:
   ```bash
   npx auth@latest migrate
   ```
   This auto-creates: `user`, `session`, `account`, `verification` tables with proper columns, plus custom columns (`username`, `is_admin`, `is_banned`).

2. Run the application migration to create list tables:
   ```bash
   npx node-pg-migrate up
   ```
   This creates: `user_list`, `list_entry` tables with foreign keys and indexes.
   (The migration SQL is in `migrations/001_create_list_tables.sql`, defined in the [Database Schema](#database-schema) section.)

3. Seed the admin user:
   ```bash
   npx tsx scripts/seed-admin.ts
   ```
   Sets `is_admin = true` for `segun@charlottethirdplaces.com` if they've signed up. Idempotent — safe to run repeatedly.

**After initial setup:** All three steps run automatically via the `db-migrate.yml` GitHub Action on every push to `main` that touches migration files, auth config, or the seed script. No manual SQL commands needed going forward.

### 4. Add Environment Variables Locally ⏳ TODO

Add the following environment variables to your local `.env` file (which is git-ignored and never committed):

| Variable | Where to Get It |
|----------|----------------|
| `BETTER_AUTH_SECRET` | Generate a random 32+ character string |
| `BETTER_AUTH_URL` | Set to `http://localhost:3000` for local development |
| `DATABASE_URL` | From Step 2 (PostgreSQL connection string with `?sslmode=require`) |
| `AZURE_ACS_CONNECTION_STRING` | From Step 1 (Azure Communication Services → Keys) |
| `AZURE_ACS_SENDER_ADDRESS` | The verified sender email from Step 1 |

### 5. Add Environment Variables to Vercel ⏳ TODO

1. Go to [Vercel Dashboard](https://vercel.com/) → Charlotte Third Places project
2. Navigate to **Settings → Environment Variables**
3. Add the same five environment variables from Step 4, with these production differences:
   - `BETTER_AUTH_URL` → set to `https://www.charlottethirdplaces.com`
   - `DATABASE_URL` → same PostgreSQL connection string (Azure PostgreSQL is accessible from Vercel via public endpoint + SSL)
   - `AZURE_ACS_SENDER_ADDRESS` → use the production sender email (e.g., a custom domain address)

4. For **Preview** environment, use same values but:
   - `BETTER_AUTH_URL` should be left blank (Better Auth auto-detects from request)

### 6. Airtable Curator Lists Setup ✅ COMPLETE

> **Status:** Already complete. The Curator Lists table exists in Airtable.

**Existing Structure:**

1. **Charlotte Third Places** table has a linked field: `Curator Lists` (links to multiple curator lists)

2. **Curator Lists** table contains:
   - `List Name` (Single line text)
   - `List Description` (Long text)
   - `Published` (Checkbox) — Filter by this to show only published lists
   - `Places` (Linked to Charlotte Third Places, multiple)

**Checkbox Field Parsing (Important):**

Airtable checkbox fields return `true` when checked, but `undefined`/`null` when unchecked (not `false`). Use `Boolean(value)` to safely convert. This matches the existing pattern used for the `Featured` checkbox field in `data-services.ts`.

### 7. Set Up Airtable Automation for Cache Invalidation ⏳ TODO

1. In Airtable, go to **Automations**
2. Create automation:
   - Trigger: **When record matches conditions** → `Curator Lists` where `Published` changes
   - Action: **Send webhook** → your revalidation endpoint URL (the same one used for existing ISR invalidation)

### 8. Set Up Termly Policies ✅ COMPLETE

> **Status:** Completed January 13, 2026

**Termly Plan:** Paid plan (auto-updates with law changes)

**Termly Account:** [Termly Dashboard](https://app.termly.io/)

**Policies Configured:**

| Policy | Status | Termly Hosted URL |
|--------|--------|-------------------|
| Privacy Policy | ✅ Published | [View Policy](https://app.termly.io/policy-viewer/policy.html?policyUUID=4af666ad-5f20-42ae-96d3-0b587717c6f6) |
| Cookie Policy | ✅ Published | [View Policy](https://app.termly.io/policy-viewer/policy.html?policyUUID=1416a187-4ce6-4e4b-abdd-39c1cb4f7671) |
| Terms and Conditions | ✅ Published | [View Policy](https://app.termly.io/policy-viewer/policy.html?policyUUID=354be667-fbde-479e-a4b9-1a3b261ef0ed) |

**Note**: Termly policies need to be updated to reflect the switch from OAuth to magic link authentication. Update the "data collected" section to indicate only email is collected (no name, avatar, or OAuth tokens).

**What Each Policy Covers:**

1. **Privacy Policy** (`/privacy`)
   - Personal data collected (email from magic link sign-in)
   - Derivative data from analytics (IP-derived location, device info, usage data)
   - How data is used and stored
   - Third-party processors (Azure, Vercel)
   - User rights (GDPR/CCPA)
   - Data retention and deletion

2. **Cookie Policy** (`/cookies`)
   - What cookies are used (functional, analytics, session)
   - Google Tag Manager cookies
   - Vercel Analytics cookies
   - Better Auth session cookie (`httpOnly`, long-lived)
   - Theme preference (localStorage)
   - How to manage cookie preferences

3. **Terms and Conditions** (`/terms`)
   - Acceptable use policy
   - User-generated content (list names, notes)
   - Intellectual property
   - Limitation of liability
   - Account termination rights
   - Governing law

### 9. Add Termly Policy Pages & Cookie Consent ⏳ TODO

**Three Policy Pages Required:**

| Page | Route | Termly Policy UUID |
|------|-------|--------------------|
| `app/privacy/page.tsx` | `/privacy` | `4af666ad-5f20-42ae-96d3-0b587717c6f6` |
| `app/cookies/page.tsx` | `/cookies` | `1416a187-4ce6-4e4b-abdd-39c1cb4f7671` |
| `app/terms/page.tsx` | `/terms` | `354be667-fbde-479e-a4b9-1a3b261ef0ed` |

#### Cookie Consent Banner

**⚠️ Next.js 15+ Compatibility Issue:**

Termly's official Next.js integration does **not work with Next.js 15+**. Per [Termly's support article](https://help.termly.io/support/solutions/articles/60000688994-how-do-i-install-termly-on-my-next-js-website-), their React package uses the `pages/` directory structure which is incompatible with Next.js App Router.

**Solution:** Use the plain HTML/script approach with Next.js [`<Script>` component](https://nextjs.org/docs/app/api-reference/components/script).

**Termly Consent Banner ID:** `6d8a214b-c280-4e7b-90b7-1863059212ca`

**Code From Termly Dashboard:**

1. **Consent Banner Script** (must be FIRST script to load):

   ```html
   <script
     type="text/javascript"
     src="https://app.termly.io/resource-blocker/6d8a214b-c280-4e7b-90b7-1863059212ca?autoBlock=on"
   ></script>
   ```

2. **Consent Preferences Link** (required for GDPR — allows users to change preferences):

   ```html
   <a href="#" class="termly-display-preferences">Consent Preferences</a>
   ```

**What `autoBlock=on` Does:**

- Automatically detects and blocks cookies/tracking scripts until user consents
- Scans for known tracking scripts (Google Analytics, Meta Pixel, etc.)
- GoogleTagManager and other trackers won't fire until consent is given

**Critical: Script Load Order:**

The Termly script **MUST** load before any tracking scripts ([Google Tag Manager](https://tagmanager.google.com/), [Vercel Analytics](https://vercel.com/docs/analytics), etc.) to properly block them until consent is given. In `layout.tsx`, it must be the **first** `<Script>` tag. Use [`strategy="beforeInteractive"`](https://nextjs.org/docs/app/api-reference/components/script#beforeinteractive) in Next.js.

#### Configurable Feature Flag

Cookie consent banners are primarily required for EU/GDPR compliance. This feature is configurable via environment variable and ships **enabled by default**.

```env
# Enable/disable Termly cookie consent banner
# Set to "false" to disable (e.g., for non-EU audiences)
# Default: enabled (true)
NEXT_PUBLIC_ENABLE_COOKIE_CONSENT=true
```

The consent preferences button in the footer is also conditionally rendered based on this flag.

**Termly IDs & UUIDs:**

| Resource | ID/UUID |
|----------|---------|
| Consent Banner | `6d8a214b-c280-4e7b-90b7-1863059212ca` |
| Privacy Policy | `4af666ad-5f20-42ae-96d3-0b587717c6f6` |
| Cookie Policy | `1416a187-4ce6-4e4b-abdd-39c1cb4f7671` |
| Terms and Conditions | `354be667-fbde-479e-a4b9-1a3b261ef0ed` |

### 10. Set Admin User ✅ AUTOMATED

> **Status:** Handled automatically by `scripts/seed-admin.ts`, which runs on every deploy via GitHub Action.

The seed script sets `is_admin = true` for `segun@charlottethirdplaces.com`. If the admin hasn't signed in yet (user row doesn't exist), the script does nothing and succeeds — it'll set the flag on the next deploy after sign-in.

For manual execution: `npx tsx scripts/seed-admin.ts`

### 11. Update Termly Policies for Magic Link ⏳ TODO

Update the Termly policies to reflect the authentication change:

- Remove references to Google, Microsoft, Apple as OAuth providers
- Update "data collected" to say only email (not name/avatar)
- Add Azure Communication Services as a data processor (for sending emails)
- Remove Google and Apple from third-party processors list

---

## Testing Strategy

### Test Folder Structure

```
charlotte-third-places/
  __tests__/
    components/
      SaveButton.test.tsx
      VisitedToggle.test.tsx
      StarRating.test.tsx
      ListPicker.test.tsx
      SortableListEntries.test.tsx
      ListsPage.test.tsx
      CommunityPage.test.tsx
      Navigation.test.tsx
      UserMenu.test.tsx
      AuthDialog.test.tsx
      UsernameDialog.test.tsx
    contexts/
      AuthContext.test.tsx
      ListsContext.test.tsx
    lib/
      lists-service.test.ts
      db.test.ts
  e2e/
    auth-flow.spec.ts
    save-place.spec.ts
    lists-page.spec.ts
    rating-and-ranking.spec.ts
    community-feed.spec.ts
    account-deletion.spec.ts
```

### Unit Tests

| Test File | Coverage |
|-----------|----------|
| `SaveButton.test.tsx` | Renders bookmark icon, opens drawer/sheet, shows login prompt when unauthenticated, displays filled icon when place is saved |
| `VisitedToggle.test.tsx` | Renders unchecked when not visited, toggles on click, updates Visited list, hidden when logged out |
| `StarRating.test.tsx` | Renders empty stars, click sets rating, hover shows label, null rating displays as unrated |
| `ListPicker.test.tsx` | Checkbox toggles work, notes input accepts text, save/cancel actions, loading states |
| `SortableListEntries.test.tsx` | Drag-and-drop reorder fires position updates, respects sort mode |
| `ListsPage.test.tsx` | Tabs render for each list, sort options work, places display correctly, empty states, delete from list |
| `CommunityPage.test.tsx` | Published lists display, ratings visible, notes not visible, disclaimer shown, username displayed |
| `Navigation.test.tsx` | Shows correct nav items based on auth state, Community always visible, Lists only when logged in |
| `UserMenu.test.tsx` | Username displays, dropdown opens, sign out works |
| `AuthDialog.test.tsx` | Email input validation, OTP code entry, loading states, error handling |
| `UsernameDialog.test.tsx` | Validation (3-20 chars, alphanumeric + underscore), availability check, debounced API call |
| `AuthContext.test.tsx` | Auth state management, login/logout flows, session persistence |
| `ListsContext.test.tsx` | Lists CRUD operations, error states, rating updates, reorder |
| `lists-service.test.ts` | API calls, error handling |
| `db.test.ts` | PostgreSQL connection pool, query execution, transaction handling, error handling |

### E2E Tests (Playwright)

| Test File | Coverage |
|-----------|----------|
| `auth-flow.spec.ts` | Magic link/OTP login, session persistence across pages, logout clears session |
| `save-place.spec.ts` | Save to Favorites, mark as visited via toggle, appears in /lists, update note, remove from list |
| `lists-page.spec.ts` | Navigate tabs, create custom list, delete custom list, rename list, switch sort modes |
| `rating-and-ranking.spec.ts` | Rate a place (1–5 stars), change rating, clear rating, drag-and-drop reorder, sort by rating |
| `community-feed.spec.ts` | Set username, publish list, appears in community with username displayed, ratings visible, notes hidden, unpublish removes it |
| `account-deletion.spec.ts` | Delete account, all data removed, can't sign in |

### API Route Tests

| Route | Test Cases |
|-------|------------|
| `GET /api/lists` | Returns empty array for new user, returns all lists, rejects unauthenticated |
| `POST /api/lists` | Creates custom list, enforces 5 list limit, validates name length |
| `POST /api/lists/[listId]/places` | Adds place with position, prevents duplicates, enforces 100 place limit, accepts optional rating |
| `PATCH /api/lists/[listId]/places/[placeId]` | Updates notes, updates rating (1-5 or null), validates note length |
| `POST /api/lists/[listId]/reorder` | Batch updates positions, validates all entries belong to list |
| `DELETE /api/lists/[listId]` | Deletes custom list + all entries, cannot delete default list |
| `POST /api/lists/[listId]/publish` | Requires username, runs profanity filter, adds to publishedLists, updates isPublic |
| `GET /api/community/lists` | Returns paginated results, sorted newest first, includes username |
| `GET /api/community/lists/[listId]` | Returns ratings, strips notes, includes disclaimer context |
| `POST /api/user/username` | Validates format (3-20, [a-zA-Z0-9_]), enforces uniqueness via UNIQUE constraint, case-insensitive |
| `PATCH /api/user/username` | Updates username, old username freed for reuse |
| `DELETE /api/user` | `DELETE FROM "user" WHERE id = $1` — foreign keys cascade to sessions, lists, entries |
| `GET /api/admin/stats` | Returns metrics, rejects non-admin |
| `GET /api/admin/users` | Paginated user list, search by email/username, rejects non-admin |
| `POST /api/admin/users/[userId]/ban` | Sets `is_banned = true`, hides published lists, rejects non-admin |
| `DELETE /api/admin/users/[userId]` | Cascade deletes user, rejects non-admin |

### Mocking Strategy

| Dependency | Mock Approach |
|------------|---------------|
| PostgreSQL | Mock `pg.Pool` with in-memory store or use [pg-mem](https://github.com/oguimbal/pg-mem) for in-memory PostgreSQL |
| Better Auth | Mock `auth.api.getSession()` to return test user |
| Azure Communication Services | Mock email sending, verify correct recipient/content |
| @dnd-kit | Use testing utilities to simulate drag events |
| localStorage | Use jsdom's built-in localStorage |
| Network | Use [MSW (Mock Service Worker)](https://mswjs.io/) for API mocking in E2E |

### Critical Path Tests

These tests must pass before every deploy:

1. ✅ Unauthenticated user can browse places (no auth required for core site)
2. ✅ Email sign-in flow completes successfully
3. ✅ Session persists across page navigation
4. ✅ Authenticated user can save place to Favorites
5. ✅ Authenticated user can mark place as visited via toggle
6. ✅ Authenticated user can rate a place (1–5 stars)
7. ✅ Authenticated user can reorder places via drag-and-drop
8. ✅ Saved place appears in /lists with correct rating and notes
9. ✅ User can remove place from list
10. ✅ User can set Reddit-style username
11. ✅ User can publish list (ratings visible, notes stripped, disclaimer shown)
12. ✅ Published list appears in /community with username attribution
13. ✅ Unpublished list removed from /community
14. ✅ User can export all data as JSON
15. ✅ Account deletion removes all user data
16. ✅ Admin can view dashboard metrics
17. ✅ Admin can ban/unban a user
18. ✅ Admin can force-unpublish or delete any list
19. ✅ Non-admin users get 403 on admin routes and redirect from /admin pages

---

## Privacy & Compliance

### Data We Store

| Data | Purpose | Retention |
|------|---------|-----------|
| Email | Authentication, unique identifier | Until account deletion |
| Username | Public identity on published lists | Until account deletion |
| Session token | Maintaining login state | Until sign-out or account deletion |
| Saved places | Core feature (list entries with position) | Until account deletion |
| Ratings | User's 1–5 star ratings per place | Until account deletion |
| Notes | Private user-created content on saved places | Until account deletion |

### Data We Don't Store

- ❌ Passwords (magic link only)
- ❌ Real names (not collected — only Reddit-style username)
- ❌ Profile pictures (not collected)
- ❌ OAuth tokens (no OAuth)
- ❌ Payment information
- ❌ Location data
- ❌ Browsing history

### User Rights ([GDPR](https://gdpr.eu/)/[CCPA](https://oag.ca.gov/privacy/ccpa))

| Right | Implementation |
|-------|----------------|
| **Access** | "Download My Data" exports all data as JSON |
| **Deletion** | "Delete Account" removes all data immediately |
| **Portability** | JSON export is machine-readable |
| **Rectification** | Users can edit their lists and notes |
| **Objection** | Users can unpublish any list |

### Third-Party Processors

| Processor | Purpose | DPA |
|-----------|---------|-----|
| [Microsoft Azure](https://azure.microsoft.com/) | Data storage + email delivery (ACS) | [Azure DPA](https://www.microsoft.com/licensing/docs/view/Microsoft-Products-and-Services-Data-Protection-Addendum-DPA) |
| [Vercel](https://vercel.com/) | Hosting + analytics | [Vercel DPA](https://vercel.com/legal/dpa) |

---

## Cost Estimates

### Monthly Costs

| Service | Estimated Cost | Notes |
|---------|---------------|-------|
| Azure PostgreSQL Flexible Server (B1ms) | ~$13–15 | Burstable 1 vCore, 2 GB RAM, 32 GB storage |
| Azure Communication Services | $0 | Free tier: 100 emails/day |
| Vercel | $0 | Hobby plan sufficient |
| Termly | ~$10/month | Paid plan — auto-updates, cookie consent banner |
| **Total** | **~$23–25/month** | |

### At Scale (1,000 users)

| Service | Estimated Cost |
|---------|---------------|
| Azure PostgreSQL Flexible Server (B1ms) | ~$13–15/month (same tier handles this easily) |
| Azure Communication Services | ~$0.25/month (beyond free tier) |
| Vercel | $0–20/month (depends on traffic) |
| Termly | ~$10/month |
| **Total** | **$23–45/month** |

### At Scale (10,000 users)

| Service | Estimated Cost |
|---------|---------------|
| Azure PostgreSQL Flexible Server (B2s) | ~$26/month (scale up if needed) |
| Azure Communication Services | ~$2.50/month |
| Vercel | $20/month (Pro plan) |
| Termly | $10/month |
| **Total** | **~$58/month** |

All costs covered by existing $150/month Azure credits.

---

## Appendix: Environment Variables

### Required

The following environment variables are needed in both local `.env` and Vercel:

| Variable | Description |
|----------|-------------|
| `BETTER_AUTH_SECRET` | Random 32+ character string for signing session tokens |
| `BETTER_AUTH_URL` | Site URL — production domain or `http://localhost:3000` for dev |
| `DATABASE_URL` | PostgreSQL connection string (from Azure Portal → PostgreSQL Flexible Server → Connect) |
| `AZURE_ACS_CONNECTION_STRING` | From Azure Portal → Communication Services → Keys |
| `AZURE_ACS_SENDER_ADDRESS` | Verified sender email address for magic link emails |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_ENABLE_COOKIE_CONSENT` | `true` | Set to `false` to disable Termly cookie consent banner |

### Where Secrets Are Stored

| Secret Type | Location | Notes |
|-------------|----------|-------|
| Local development | `.env` file | Git-ignored, never committed |
| Production | Vercel Environment Variables | Set in Vercel Dashboard |
| GitHub Actions (if needed) | GitHub Repository Secrets | Only if using GitHub Actions for deployment |

---

## Appendix: Type Definitions

```typescript
// lib/types/lists.ts

export interface PlaceEntry {
  placeId: string;           // Google Maps Place ID
  notes: string;             // private notes (never shown publicly)
  rating: number | null;     // 1-5 star rating, null = unrated
  position: number;          // sequential integer for manual ordering
  addedAt: string;           // ISO timestamp
}

export interface UserList {
  id: string;                // Primary key (UUID)
  userId: string;
  slug: string;              // "favorites" | "to-visit" | "visited" | "custom_{uuid}"
  name: string;
  description: string;
  isDefaultList: boolean;
  isPublic: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Full list with resolved place data, used on /lists page */
export interface UserListWithEntries extends UserList {
  entries: PlaceEntry[];
}

export interface PublishedList {
  listId: string;
  userId: string;            // For internal lookup only, NOT displayed publicly
  username: string;          // Reddit-style display name, shown publicly
  name: string;
  description: string;
  placeCount: number;
  previewPlaceIds: string[];
  publishedAt: string;
}

/** Public list view — notes stripped, ratings visible */
export interface PublicListView {
  listId: string;
  username: string;
  name: string;
  description: string;
  entries: PublicPlaceEntry[];
  publishedAt: string;
}

/** Place entry as seen in a public list — no notes */
export interface PublicPlaceEntry {
  placeId: string;
  rating: number | null;
  position: number;
}

export interface CuratorList {
  id: string;                          // Airtable record ID
  name: string;                        // "List Name" field
  description: string;                 // "List Description" field
  published: boolean;                  // "Published" checkbox (use Boolean() to parse)
  places: Place[];                     // Resolved from linked "Places" field
}
```

---

## Appendix: File Structure (New Files)

```
charlotte-third-places/
  app/
    api/
      auth/
        [...all]/
          route.ts           # Better Auth handler (magic link + OTP)
      lists/
        route.ts             # GET all, POST create
        [listId]/
          route.ts           # GET, PATCH, DELETE list
          reorder/
            route.ts         # POST batch position update
          places/
            route.ts         # POST add place
            [placeId]/
              route.ts       # PATCH entry (notes, rating), DELETE place
          publish/
            route.ts         # POST publish (profanity filter + username check)
          unpublish/
            route.ts         # POST unpublish
      community/
        lists/
          route.ts           # GET feed (paginated, newest first)
          [listId]/
            route.ts         # GET public list (ratings visible, notes stripped)
      curator/
        lists/
          route.ts           # GET curator lists
      user/
        route.ts             # DELETE account
        export/
          route.ts           # GET data export
        username/
          route.ts           # POST set, PATCH change username
          check/
            route.ts         # GET availability check
      admin/
        stats/
          route.ts           # GET dashboard metrics (admin only)
        users/
          route.ts           # GET paginated user list (admin only)
          [userId]/
            route.ts         # GET detail, DELETE account (admin only)
            ban/
              route.ts       # POST ban user (admin only)
            unban/
              route.ts       # POST unban user (admin only)
        lists/
          route.ts           # GET all published lists (admin only)
          [listId]/
            route.ts         # DELETE list (admin only)
            unpublish/
              route.ts       # POST force-unpublish (admin only)
    lists/
      page.tsx               # Lists page
    community/
      page.tsx               # Community feed
      lists/
        [listId]/
          page.tsx           # Public list view (ratings, no notes, disclaimer)
    settings/
      page.tsx               # Account settings (username, export, delete)
    admin/
      page.tsx               # Admin dashboard (metrics) — admin only
      users/
        page.tsx             # Admin user management — admin only
      lists/
        page.tsx             # Admin list moderation — admin only
    privacy/
      page.tsx               # Privacy Policy (Termly embed)
    cookies/
      page.tsx               # Cookie Policy (Termly embed)
    terms/
      page.tsx               # Terms and Conditions (Termly embed)
  components/
    SaveButton.tsx
    VisitedToggle.tsx          # Checkmark toggle for marking places as visited
    StarRating.tsx             # 1–5 star input with hover labels
    SortableListEntries.tsx    # Drag-and-drop sortable list (@dnd-kit)
    ListPicker.tsx
    ListCard.tsx
    PublishListDialog.tsx
    UsernameDialog.tsx         # Reddit-style username picker
    CreateListDialog.tsx
    AuthDialog.tsx             # Email input → magic link/code entry
    UserMenu.tsx
  contexts/
    AuthContext.tsx
    ListsContext.tsx
  lib/
    auth.ts                  # Better Auth server config (PostgreSQL adapter + magic link + email OTP)
    auth-client.ts           # Better Auth client
    constants.ts             # List limits, rating config, username rules, feature flags
    db.ts                    # PostgreSQL connection pool (shared pg.Pool instance)
    email.ts                 # Azure Communication Services email sender
    lists-service.ts         # User lists API service (CRUD via SQL queries)
    curator-lists-service.ts # Curator lists from Airtable (always hits real API)
    types/
      lists.ts               # List-related TypeScript types
  migrations/
    001_create_list_tables.sql  # SQL migration for user_list and list_entry tables
  scripts/
    seed-admin.ts              # Idempotent: sets is_admin for admin email
  .github/
    workflows/
      db-migrate.yml           # GitHub Action: runs migrations + seed on push to main
```

---

## Appendix: Maintenance Calendar

| Task | Frequency | Notes |
|------|-----------|-------|
| Review Termly policies | Annually | Paid plan auto-updates, but review for accuracy |
| Review ACS email sender domain | Annually | Ensure domain verification is still valid |
| Review Azure PostgreSQL costs | Quarterly | Should stay under $30/month at B1ms tier |
| Review user data for cleanup | Annually | Remove orphaned data if needed |
| PostgreSQL minor version updates | Quarterly | Azure auto-applies within maintenance window |

---

## Appendix: Future Roadmap

### OAuth Sign-In (Deferred)

OAuth (Google, Microsoft, Apple) can be added later as an optional enhancement. Better Auth supports [adding social providers](https://www.better-auth.com/docs/concepts/oauth) alongside magic link, so authenticated users could link a social account to their existing email-based account. This is not needed for launch but could improve UX for users who prefer one-click sign-in.

### Offline Resilience (Deferred)

If users report issues with flaky connections, implement optimistic UI updates with a localStorage-backed retry queue. The normalized `list_entry` table (one row per place) makes conflict resolution simple — individual row operations don't conflict with each other. Strategy: optimistic update → queue failed requests → process queue on reconnect → server is source of truth on conflict.

### Community Engagement Features (Deferred)

Future enhancements to the `/community` page:

- Feature a user's list as "List of the Week"
- Highlight top-rated lists
- "Trending" lists based on view count
- User profiles with all published lists
- Follow other users to see their new lists
