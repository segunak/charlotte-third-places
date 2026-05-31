# User Lists Feature

Enable users to save third places to personal lists with ratings, manual ranking, private notes, and Google Docs style share links. Authentication is handled by WorkOS AuthKit with Google Sign-In, Apple Sign-In, and email one-time passcodes. Charlotte Third Places owns all product user data in Azure PostgreSQL. Public discovery is curator-controlled only.

This plan intentionally chooses **World A**: private lists by default, unlisted share links for direct sharing, and curator-featured public lists for high-quality editorial discovery. There is no public feed of arbitrary member-published lists.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [World A Sharing Model](#world-a-sharing-model)
3. [Architecture Decisions](#architecture-decisions)
4. [Database Schema](#database-schema)
5. [API Routes](#api-routes)
6. [UI Components and UX](#ui-components-and-ux)
7. [Navigation Changes](#navigation-changes)
8. [SEO, Privacy, and Anti-Indexing Rules](#seo-privacy-and-anti-indexing-rules)
9. [Implementation Checklist](#implementation-checklist)
10. [Manual Configuration Steps](#manual-configuration-steps)
11. [Testing Strategy](#testing-strategy)
12. [Privacy and Compliance](#privacy-and-compliance)
13. [Cost Estimates](#cost-estimates)
14. [Environment Variables](#environment-variables)
15. [Type Definitions](#type-definitions)
16. [File Structure](#file-structure)
17. [Maintenance Calendar](#maintenance-calendar)
18. [Future Roadmap](#future-roadmap)

---

## Executive Summary

### What We Are Building

- **Personal Lists**: Three default lists per user: Favorites, To Visit, and Visited. Users can also create up to five custom lists.
- **Ratings and Rankings**: Optional 1-5 star ratings per place, private notes, and manual drag-and-drop ordering.
- **Direct Sharing**: Users can generate an opaque share link for any list. Anyone with the link can view it. The link can be revoked or rotated at any time.
- **Curator Featured Lists**: Only the site curator, and future trusted curators, can publish public indexable lists under `/featured/[slug]`.
- **Authentication**: WorkOS AuthKit hosted UI with Google Sign-In, Apple Sign-In, and Magic Auth email one-time passcodes. No passwords and no in-app auth email infrastructure.
- **Data Ownership**: Charlotte Third Places owns the app user table, list data, ratings, notes, share tokens, analytics, account deletion, and user counts in Azure PostgreSQL.
- **Quality Control**: There is no public feed of arbitrary member lists. The public surface stays curated.
- **Moderation Burden**: There is no automated moderation pipeline for v1 because member content is not publicly discoverable. Share-link abuse is handled reactively through a report-and-revoke flow.

### Locked Decisions

| Decision | Final Choice |
| --- | --- |
| Auth provider | WorkOS AuthKit |
| Sign-in methods | Google, Apple, email OTP through WorkOS Magic Auth |
| Magic links | Not used |
| Auth UI | WorkOS hosted AuthKit UI |
| Auth domain | WorkOS default hosted domain for v1 |
| Product user source of truth | Local `app_user` table in Azure PostgreSQL |
| Member list default visibility | Private |
| Member list sharing | Unlisted opaque share links only |
| Public member publishing | Not allowed |
| Public discovery surface | Curator-controlled `/featured/*` and `/community` |
| Community feed of member lists | Not built |
| Automated UGC moderation | Not built for v1 |
| Mobile bottom navigation | Home, Map, Chat, Lists, Community |

### Key Technology Choices

| Component | Choice | Rationale |
| --- | --- | --- |
| **Authentication** | [WorkOS AuthKit](https://workos.com/authkit) via `@workos-inc/authkit-nextjs` | Hosted login, Google, Apple, email OTP, session handling, and auth emails handled outside the app. Free up to 1M MAU. |
| **Database** | [Azure Database for PostgreSQL Flexible Server](https://learn.microsoft.com/en-us/azure/postgresql/) | App-owned user/list data, SQL analytics, foreign keys, cascade deletes, and easy scale-up path. |
| **PostgreSQL Client** | [`pg`](https://www.npmjs.com/package/pg) | Lightweight direct SQL access for app-owned tables. |
| **Migrations** | [`node-pg-migrate`](https://github.com/salsita/node-pg-migrate) | Idempotent migrations that can run locally and in GitHub Actions. |
| **Drag and Drop** | [`@dnd-kit/sortable`](https://dndkit.com/) | Accessible manual list ordering. |
| **Sharing UX** | Web Share API plus Copy Link fallback | Native mobile sharing in iOS, Android, PWA, and mobile browsers. |
| **Legal Policies** | [Termly](https://termly.io/) paid plan | Existing privacy, cookie, and terms management with consent banner support. |

### Current Codebase Status

| Component | Version | Notes |
| --- | --- | --- |
| **Next.js** | 16.x | App Router. Next 16 uses `proxy.ts` instead of `middleware.ts`. |
| **React** | 19.x | React 19 with the React Compiler. |
| **Tailwind CSS** | 4.x | CSS-first configuration. |
| **Vitest** | 4.x | Unit testing. |
| **Playwright** | 1.57+ | E2E testing. |
| **AI SDK** | 5.x | Vercel AI SDK for RAG chat. |
| **Airtable** | Existing integration | Source of truth for place data. |
| **Serwist** | Existing integration | PWA/offline shell support. |

**What Exists:**

- Core site: Home, Map, Chat, Contribute, About, Places.
- AI Chat with RAG using Azure Cosmos DB and Azure OpenAI.
- Airtable and local CSV data services with ISR.
- Filter system with React context.
- Modal system with React context.
- shadcn/ui primitives including Dialog, Drawer, Sheet, Tabs, Button, Avatar, and Dropdown Menu.
- Centralized icon wrapper in `components/Icons.tsx`.
- Test infrastructure with Vitest and Playwright.
- `better-auth` package is installed but not configured; it should be removed as part of this plan.

**What Does Not Exist Yet:**

- WorkOS AuthKit dependency or configuration.
- `app/login/route.ts`, `app/callback/route.ts`, `app/logout/route.ts`, or `proxy.ts`.
- `lib/db.ts` PostgreSQL pool.
- `lib/auth/workos.ts` auth helpers.
- `app_user` and `auth_identity` tables.
- User list, list entry, share link, featured list, or report tables.
- Lists page, share-link page, featured pages, or admin featured workflow.
- Save-to-list UI on place cards, modals, and place detail pages.
- Termly policy pages inside the Next.js app.

---

## World A Sharing Model

World A is the product model for v1. It matches the familiar Google Docs or Microsoft OneDrive pattern: a user can create a view-only link and share it directly with someone, but the platform does not place those links into public search, feeds, or discovery surfaces.

This keeps the public Charlotte Third Places experience curated while still giving users a useful sharing tool.

### Three Visibility Tiers

| Tier | Database Value | Who Can View | Search Indexing | URL Pattern |
| --- | --- | --- | --- | --- |
| **Private** | `private` | List owner only | Not indexable | `/lists` owner-only UI |
| **Unlisted Link** | `unlisted_link` | Anyone with the active opaque link | `noindex,nofollow`; excluded from sitemap; blocked in robots | `/s/[token]` |
| **Curator Featured** | `curator_featured` | Public | Indexable; included in sitemap | `/featured/[slug]` |

### Default Behavior

Every user list starts as `private`. Nothing is public by default. A list becomes shareable only when the owner explicitly creates a share link. A list becomes public only when a curator creates or promotes a featured snapshot.

There is no boolean `is_public` column. Visibility is represented by a `visibility` enum-like text field with only these values:

- `private`
- `unlisted_link`
- `curator_featured`

### Unlisted Share Links

A user can open a list, click **Share**, and generate a link. The app creates a random URL-safe opaque token and stores it on `user_list.share_token`.

A share-link page:

- Is viewable without sign-in.
- Uses the URL pattern `/s/[token]`.
- Shows only the list associated with the active token.
- Returns 404 if the token is missing, revoked, rotated, expired in a future implementation, or tied to a private list.
- Sets `noindex,nofollow` metadata.
- Is excluded from `sitemap.ts`.
- Is blocked in `robots.ts` with `Disallow: /s/`.
- Does not show the owner's email.
- Uses anonymous attribution by default.
- Shows notes only if the owner explicitly enables `share_includes_notes` for that list.

This is not a public publishing workflow. It is direct sharing. If a user shares something low quality or offensive through a link, the content is attributable to the author of the shared list, not to Charlotte Third Places as a curated public recommendation.

### Link Controls

Every list owner can:

- Create a share link.
- Copy the link.
- Open the native share sheet through `navigator.share` when available.
- Toggle whether notes are included in the shared view.
- Choose attribution mode: anonymous or local display name.
- Revoke the current link.
- Rotate the link, making the previous URL invalid.
- Turn sharing off and return the list to `private`.

### Curator Featured Lists

Featured lists are the only public, indexable list content.

A featured list can be created in two ways:

1. **Curator-authored**: A curator builds a list from scratch in the admin UI.
2. **Curator-promoted**: A member opts in to allow consideration for featuring. A curator reviews the list and creates a curator-owned snapshot under `/featured/[slug]`.

Promotion creates a snapshot. It does not expose the original user list. Later edits to the member's original list do not change the featured version unless a curator intentionally updates the featured snapshot.

Featured pages can include:

- Curator-edited title.
- Curator-edited description.
- Curator notes per place.
- Optional attribution: anonymous community member or the member's chosen display name.
- Full SEO metadata and OpenGraph previews.

### What Is Explicitly Not Built

The following are intentionally out of scope for v1:

- No public feed of arbitrary member lists.
- No `/community/lists/[listId]` public member-list pages.
- No member-controlled publish button.
- No public member profiles.
- No follow system.
- No likes or comments.
- No trending list feed based on user-published content.
- No automated AI moderation pipeline.
- No profanity filter at publish time because there is no member publish step.
- No platform-wide search over member lists.

### Why World A

Charlotte Third Places has value because it is curated. World A preserves that quality bar while still making personal lists useful. Users get normal direct sharing, the public site stays editorially controlled, and the solo project owner avoids the operational burden of moderating a public UGC feed.

---

## Architecture Decisions

### Authentication: WorkOS AuthKit

**Decision**: Use WorkOS AuthKit for authentication and session management.

Supported sign-in methods for v1:

- Google Sign-In.
- Apple Sign-In.
- WorkOS Magic Auth email one-time passcode.

Not used in v1:

- Magic links.
- Passwords.
- Better Auth.
- Azure Communication Services for auth emails.
- A custom WorkOS AuthKit domain.

### Why WorkOS AuthKit

WorkOS handles the highest-risk auth surface:

- Hosted sign-in UI.
- Google provider integration.
- Apple provider integration.
- Email OTP delivery for Magic Auth.
- Session issuance and refresh.
- AuthKit session cookie integration for Next.js.
- JWT access token validation.

Charlotte Third Places keeps ownership of the product user model. WorkOS answers the question "who signed in?" The app answers the question "what does this person own and do in Charlotte Third Places?"

### WorkOS Next.js Integration

Use the official Next.js package:

```bash
npm install @workos-inc/authkit-nextjs
```

Required app files:

| File | Purpose |
| --- | --- |
| `app/login/route.ts` | Calls `getSignInUrl()` and redirects to the hosted AuthKit UI. |
| `app/callback/route.ts` | Handles the WorkOS callback and provisions the local app user. |
| `app/logout/route.ts` | Calls WorkOS `signOut()` and clears session state. |
| `proxy.ts` | Uses `authkitMiddleware()` to support WorkOS sessions in Next 16. |
| `lib/auth/workos.ts` | Centralizes `requireAuth`, `ensureAppUser`, `requireAdmin`, and local user lookup. |
| `app/layout.tsx` | Wraps the app in `AuthKitProvider`. |

Use `withAuth()` in server components, server actions, and route handlers to read the current WorkOS auth state.

### Required WorkOS Environment Variables

| Variable | Purpose |
| --- | --- |
| `WORKOS_API_KEY` | Server-side API key from WorkOS dashboard. |
| `WORKOS_CLIENT_ID` | AuthKit client ID from WorkOS dashboard. |
| `WORKOS_COOKIE_PASSWORD` | 32+ character secret used by the SDK for encrypted cookies. |
| `NEXT_PUBLIC_WORKOS_REDIRECT_URI` | Callback URL, such as `http://localhost:3000/callback` or `https://www.charlottethirdplaces.com/callback`. |

### Auth Domain

Use the default WorkOS hosted AuthKit domain for v1. Do not pay for the custom domain add-on at launch. Revisit only if the hosted domain creates measurable brand or conversion friction.

### Identity Ownership Model

**Decision**: The app owns local user records. WorkOS is auth-only.

Local ownership is represented by two tables:

- `app_user`: local product user. This is the source of truth for app user counts, admin flags, ban status, display name, account deletion, and product relationships.
- `auth_identity`: maps a WorkOS user ID to one local `app_user`.

Product tables reference `app_user.id`, never the WorkOS user ID. This prevents vendor lock-in and keeps app analytics, account deletion, and future business-account modeling under local control.

### Storage: Azure Database for PostgreSQL Flexible Server

**Decision**: Use Azure Database for PostgreSQL Flexible Server for all user-owned product data.

Rationale:

- Managed PostgreSQL with backups, patching, and easy scaling.
- Strong relational integrity with foreign keys and `ON DELETE CASCADE`.
- SQL queries for analytics and admin dashboards.
- Simple app-owned migrations through `node-pg-migrate`.
- Cost fits within existing Azure credits.

Use a shared `pg.Pool` from `lib/db.ts`. Avoid introducing an ORM for v1.

### Ratings and Rankings

**Decision**: Support optional 1-5 star ratings and manual ordering.

Rating labels:

| Stars | Label |
| --- | --- |
| 1 | Skip it |
| 2 | It's okay |
| 3 | Solid |
| 4 | Great |
| 5 | Outstanding |

Sort options:

| Sort | Behavior |
| --- | --- |
| Custom order | Uses `position`; drag-and-drop edits this value. |
| Rating | High to low; unrated entries at bottom. |
| Recently added | Newest entries first. |
| Alphabetical | By resolved place name. |

Reordering uses sequential integers inside a SQL transaction.

### Content Moderation

**Decision**: No automated moderation pipeline for v1.

Why:

- Member lists are private by default.
- Member share links are unlisted and not indexed.
- There is no public feed of member-created content.
- Curator-featured pages are manually reviewed and edited by a trusted curator.

Reactive abuse handling is still required:

- Every `/s/[token]` page includes a small **Report this link** action.
- Reports write to `share_link_report`.
- Admin can revoke a share token immediately.
- Terms state that shared lists reflect the author's content, not an official Charlotte Third Places recommendation.

### Notes Visibility

Notes are private by default.

For unlisted share links, the owner can opt in to include notes by toggling `share_includes_notes`. This is per list. The default is `false`.

For featured lists, notes are never copied automatically into the public page. Curators may write separate `curator_note` text for a featured list entry.

### Backend Repository

The `third-places-data` Azure Functions backend does not need changes for user lists. User list operations are product-app CRUD and live in Next.js API routes in the Charlotte Third Places app.

The existing data backend remains responsible for place data enrichment, Airtable sync, photos, Google Maps, Outscraper, Cosmos, and related workflows.

### Admin Console

Admin is local app state, not WorkOS role state for v1.

`app_user.is_admin = true` grants access to admin routes. A seed script sets this flag for `segun@charlottethirdplaces.com` after the first login.

Admin pages:

| Page | Route | Purpose |
| --- | --- | --- |
| Dashboard | `/admin` | User count, list count by visibility, active share links, featured list count, open reports, most saved places. |
| Users | `/admin/users` | Search users, view account details, ban/unban, delete account. |
| Lists | `/admin/lists` | Inspect member lists, revoke share links, handle reports. |
| Featured Lists | `/admin/featured` | View, edit, create, and unpublish featured lists. |
| Featured Candidates | `/admin/featured/candidates` | Review opted-in member lists for possible promotion. |

Ban behavior:

- Banned users cannot access authenticated member features.
- Banned users' active share links are hidden or revoked by admin action.
- Banning is reversible.
- Deleting is irreversible and cascades through local product data.

### Schema Management

**Decision**: Use migration-based CI/CD with `node-pg-migrate`.

No Better Auth migration exists. WorkOS does not manage app database tables.

CI/CD sequence:

1. `npx node-pg-migrate up`
2. `npx tsx scripts/seed-admin.ts`

A GitHub Action should run these steps on push to `main` when `migrations/**`, `scripts/seed-admin.ts`, or auth/db helper files change.

### Featured Lists Storage

**Decision**: Store featured lists in PostgreSQL via `featured_list` and `featured_list_entry`.

Airtable remains the source of truth for place data. Featured-list membership and editorial list metadata should live in Postgres so the admin UI, member promotion workflow, and public featured pages share one source of truth.

If existing Airtable Curator Lists data is already live, migrate it into Postgres with a one-time script. After migration, use the app admin UI for new featured lists.

---

## Database Schema

All product tables live in Azure PostgreSQL. WorkOS does not create or own these tables.

### Extensions

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

`pgcrypto` provides `gen_random_uuid()`.

### `app_user`

Local product user table. This is the app's source of truth for user counts and product ownership.

```sql
CREATE TABLE app_user (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  is_banned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_app_user_display_name_lower
  ON app_user (LOWER(display_name))
  WHERE display_name IS NOT NULL;
```

`display_name` is optional. It is a local attribution handle, not an auth identity. It can be used on share links or featured snapshots only when the member explicitly chooses that attribution mode.

### `auth_identity`

Links a WorkOS auth identity to the local app user.

```sql
CREATE TABLE auth_identity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  provider_email TEXT,
  provider_email_verified BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  UNIQUE (provider, provider_user_id)
);

CREATE INDEX idx_auth_identity_app_user_id ON auth_identity(app_user_id);
```

For v1, `provider = 'workos'`.

### `user_list`

One row per member-owned list.

```sql
CREATE TABLE user_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  is_default_list BOOLEAN NOT NULL DEFAULT FALSE,
  visibility TEXT NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('private', 'unlisted_link', 'curator_featured')),
  share_token TEXT UNIQUE,
  share_token_created_at TIMESTAMPTZ,
  share_token_revoked_at TIMESTAMPTZ,
  share_includes_notes BOOLEAN NOT NULL DEFAULT FALSE,
  eligible_for_featuring BOOLEAN NOT NULL DEFAULT FALSE,
  attribution_mode TEXT NOT NULL DEFAULT 'anonymous'
    CHECK (attribution_mode IN ('anonymous', 'display_name')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (app_user_id, slug)
);

CREATE INDEX idx_user_list_app_user_id ON user_list(app_user_id);

CREATE INDEX idx_user_list_active_share_token
  ON user_list(share_token)
  WHERE share_token IS NOT NULL AND share_token_revoked_at IS NULL;

CREATE INDEX idx_user_list_feature_candidates
  ON user_list(updated_at DESC)
  WHERE eligible_for_featuring = TRUE;
```

Important rules:

- `visibility` defaults to `private`.
- `share_token` is nullable and only meaningful for active share links.
- `share_token_revoked_at` invalidates the token.
- `share_includes_notes` defaults to `false`.
- `eligible_for_featuring` defaults to `false`.
- `attribution_mode` defaults to `anonymous`.
- `curator_featured` means the user list has been promoted or represented by a featured snapshot. The public page is still served from `featured_list`, not directly from the member list.

### `list_entry`

One row per place in a member-owned list.

```sql
CREATE TABLE list_entry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES user_list(id) ON DELETE CASCADE,
  place_id TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  rating SMALLINT CHECK (rating >= 1 AND rating <= 5),
  position INTEGER NOT NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (list_id, place_id)
);

CREATE INDEX idx_list_entry_list_id ON list_entry(list_id);
CREATE INDEX idx_list_entry_place_id ON list_entry(place_id);
```

### `featured_list`

Curator-owned public list metadata.

```sql
CREATE TABLE featured_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  hero_image_url TEXT,
  source_user_list_id UUID REFERENCES user_list(id) ON DELETE SET NULL,
  source_app_user_id UUID REFERENCES app_user(id) ON DELETE SET NULL,
  attribution_mode TEXT NOT NULL DEFAULT 'anonymous'
    CHECK (attribution_mode IN ('anonymous', 'display_name')),
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_featured_list_published
  ON featured_list(published_at DESC)
  WHERE is_published = TRUE;
```

### `featured_list_entry`

One row per place in a featured public list.

```sql
CREATE TABLE featured_list_entry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  featured_list_id UUID NOT NULL REFERENCES featured_list(id) ON DELETE CASCADE,
  place_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  curator_note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (featured_list_id, place_id)
);

CREATE INDEX idx_featured_list_entry_list_id ON featured_list_entry(featured_list_id);
```

### `share_link_report`

Reports for abusive or problematic unlisted links.

```sql
CREATE TABLE share_link_report (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_list_id UUID NOT NULL REFERENCES user_list(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL,
  reason TEXT NOT NULL,
  reporter_email TEXT,
  reporter_ip INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolution TEXT
);

CREATE INDEX idx_share_link_report_open
  ON share_link_report(created_at DESC)
  WHERE resolved_at IS NULL;
```

### List Limits

Enforce these in API routes and shared constants:

| Constant | Value | Meaning |
| --- | --- | --- |
| `MAX_CUSTOM_LISTS` | `5` | Custom lists per user. Default lists do not count. |
| `MAX_PLACES_PER_LIST` | `100` | Places per list. |
| `MAX_NOTE_LENGTH` | `500` | Characters per private note. |
| `MAX_LIST_NAME_LENGTH` | `80` | Characters per list name. |
| `MAX_LIST_DESCRIPTION_LENGTH` | `500` | Characters per list description. |
| `RATING_MIN` | `1` | Minimum rating. |
| `RATING_MAX` | `5` | Maximum rating. |

### Default Lists

On first successful app-user provisioning, create these three lists in one transaction:

| Slug | Name | Default |
| --- | --- | --- |
| `favorites` | Favorites | Yes |
| `to-visit` | To Visit | Yes |
| `visited` | Visited | Yes |

### Reorder Strategy

Positions are simple sequential integers. On drag-and-drop reorder:

1. Load current entries.
2. Reorder in memory.
3. Write new positions in a single SQL transaction.
4. Reject if any entry does not belong to the list owner.

### Example Analytics Queries

| Question | SQL Shape |
| --- | --- |
| App user count | `SELECT COUNT(*) FROM app_user` |
| New users this month | `SELECT COUNT(*) FROM app_user WHERE created_at >= date_trunc('month', NOW())` |
| Most saved places | `SELECT place_id, COUNT(*) FROM list_entry GROUP BY place_id ORDER BY COUNT(*) DESC` |
| Average rating for a place | `SELECT AVG(rating) FROM list_entry WHERE place_id = $1 AND rating IS NOT NULL` |
| Active share links | `SELECT COUNT(*) FROM user_list WHERE share_token IS NOT NULL AND share_token_revoked_at IS NULL` |
| Feature candidates | `SELECT * FROM user_list WHERE eligible_for_featuring = TRUE ORDER BY updated_at DESC` |
| Open reports | `SELECT COUNT(*) FROM share_link_report WHERE resolved_at IS NULL` |

There is no community-feed query because v1 does not have a member-published community feed.

---

## API Routes

### Authentication Routes

| Route | Method | Auth | Description |
| --- | --- | --- | --- |
| `/login` | GET | None | Redirects to WorkOS hosted AuthKit UI. Accepts `returnTo`. |
| `/callback` | GET | WorkOS callback | Handles WorkOS auth response, provisions local user, redirects to `returnTo`. |
| `/logout` | POST | Required | Signs out through WorkOS and clears the session. |
| `proxy.ts` | N/A | N/A | Next 16 auth middleware using WorkOS `authkitMiddleware()`. |

### List Routes

| Route | Method | Auth | Description |
| --- | --- | --- | --- |
| `/api/lists` | GET | Required | Get all lists for current user. |
| `/api/lists` | POST | Required | Create custom list. |
| `/api/lists/[listId]` | GET | Required | Get one owned list with entries and resolved place data. |
| `/api/lists/[listId]` | PATCH | Required | Update list name, description, note sharing, attribution mode, or featuring opt-in. |
| `/api/lists/[listId]` | DELETE | Required | Delete custom list. Default lists cannot be deleted. |
| `/api/lists/[listId]/places` | POST | Required | Add place to list. |
| `/api/lists/[listId]/places/[placeId]` | PATCH | Required | Update rating, notes, or position metadata. |
| `/api/lists/[listId]/places/[placeId]` | DELETE | Required | Remove place from list. |
| `/api/lists/[listId]/reorder` | POST | Required | Batch update entry positions. |
| `/api/lists/[listId]/share` | POST | Required | Generate or return active share link. Sets `visibility = 'unlisted_link'`. |
| `/api/lists/[listId]/share` | DELETE | Required | Revoke current share link and return list to private. |
| `/api/lists/[listId]/share/rotate` | POST | Required | Revoke old token and generate a new one. |
| `/api/lists/[listId]/featuring-opt-in` | POST | Required | Toggle `eligible_for_featuring`. |

### Public Share Routes

| Route | Method | Auth | Description |
| --- | --- | --- | --- |
| `/s/[token]` | GET | None | Read-only unlisted list view. Returns 404 for missing or revoked token. |
| `/api/share/[token]/report` | POST | None | Submit report for a share link. |

### Featured Routes

| Route | Method | Auth | Description |
| --- | --- | --- | --- |
| `/featured` | GET | None | Public index of curator-featured lists. |
| `/featured/[slug]` | GET | None | Public featured list page. |
| `/api/featured` | GET | None | Published featured lists JSON. |
| `/api/featured/[slug]` | GET | None | Published featured list detail JSON. |

### Community Route

| Route | Method | Auth | Description |
| --- | --- | --- | --- |
| `/community` | GET | None | Public curator-controlled page with featured lists, anonymous aggregate signals, About link, and Contribute link. |

`/community` is not a member-list feed. It must not query arbitrary member-shared lists.

### User Routes

| Route | Method | Auth | Description |
| --- | --- | --- | --- |
| `/api/user/display-name` | POST | Required | Set optional display name. |
| `/api/user/display-name` | PATCH | Required | Update display name. |
| `/api/user/display-name` | DELETE | Required | Clear display name. |
| `/api/user/display-name/check` | GET | None | Check display-name availability. |
| `/api/user/export` | GET | Required | Export user data as JSON. |
| `/api/user` | DELETE | Required | Delete local account and app data. |

### Admin Routes

Every admin route must call `requireAdmin()` and return 403 for non-admin users.

| Route | Method | Auth | Description |
| --- | --- | --- | --- |
| `/api/admin/stats` | GET | Admin | Dashboard metrics from local tables. |
| `/api/admin/users` | GET | Admin | Paginated user list and search. |
| `/api/admin/users/[userId]` | GET | Admin | User detail. |
| `/api/admin/users/[userId]` | DELETE | Admin | Delete user account. |
| `/api/admin/users/[userId]/ban` | POST | Admin | Ban user locally. |
| `/api/admin/users/[userId]/unban` | POST | Admin | Unban user locally. |
| `/api/admin/lists` | GET | Admin | Inspect member lists and active share links. |
| `/api/admin/lists/reports` | GET | Admin | Open share-link reports. |
| `/api/admin/lists/[listId]/revoke-share` | POST | Admin | Revoke any active share token. |
| `/api/admin/featured` | GET | Admin | List featured lists. |
| `/api/admin/featured` | POST | Admin | Create curator-authored featured list. |
| `/api/admin/featured/[featuredListId]` | GET | Admin | Get featured list for editing. |
| `/api/admin/featured/[featuredListId]` | PATCH | Admin | Update featured list. |
| `/api/admin/featured/[featuredListId]` | DELETE | Admin | Delete or unpublish featured list. |
| `/api/admin/featured/candidates` | GET | Admin | Get lists where `eligible_for_featuring = TRUE`. |
| `/api/admin/featured/promote` | POST | Admin | Snapshot an opted-in member list into `featured_list`. |

### Removed Routes From Earlier Plan

These routes must not be implemented:

- `/api/auth/[...all]`
- `/api/lists/[listId]/publish`
- `/api/lists/[listId]/unpublish`
- `/api/community/lists`
- `/api/community/lists/[listId]`
- `/community/lists/[listId]`
- `/api/user/username`
- `/api/user/username/check`
- `/api/curator/lists`

---

## UI Components and UX

### New Components

| Component | Location | Description |
| --- | --- | --- |
| `SaveButton.tsx` | `components/` | Bookmark action. Logged-out users route to sign-in wall. |
| `VisitedToggle.tsx` | `components/` | Adds/removes a place from the Visited default list. |
| `StarRating.tsx` | `components/` | 1-5 star input with labels. |
| `ListPicker.tsx` | `components/` | Drawer or Sheet for choosing lists when saving a place. |
| `SortableListEntries.tsx` | `components/` | Drag-and-drop list entry ordering. |
| `ShareListDialog.tsx` | `components/` | World A sharing control: generate, copy, native share, revoke, rotate, note toggle, attribution mode. |
| `ShareLinkPageClient.tsx` | `app/s/[token]/` | Read-only public unlisted list view. |
| `ReportLinkDialog.tsx` | `components/` | Report form on `/s/[token]`. |
| `FeaturedListCard.tsx` | `components/` | Preview card for featured lists. |
| `FeaturedListPageClient.tsx` | `app/featured/[slug]/` | Public featured list renderer. |
| `OptInToFeaturingToggle.tsx` | `components/` | Lets a user opt in to curator consideration. |
| `DisplayNameDialog.tsx` | `components/` | Optional display-name editor. |
| `CreateListDialog.tsx` | `components/` | Create custom list. |
| `SignInWall.tsx` | `components/` | Branded sign-in prompt for protected pages. |
| `UserMenu.tsx` | `components/` | Avatar dropdown with Lists, Settings, Sign out, Admin if applicable. |
| `AdminFeaturedEditor.tsx` | `components/admin/` | Editor for curator-featured lists. |

### Pages to Create

| Page | Route | Description |
| --- | --- | --- |
| `app/login/route.ts` | `/login` | Redirect to WorkOS. |
| `app/callback/route.ts` | `/callback` | WorkOS callback and local user provisioning. |
| `app/logout/route.ts` | `/logout` | WorkOS sign-out. |
| `app/lists/page.tsx` | `/lists` | Authenticated list management UI. |
| `app/s/[token]/page.tsx` | `/s/[token]` | Public unlisted share-link view. |
| `app/featured/page.tsx` | `/featured` | Public featured-list index. |
| `app/featured/[slug]/page.tsx` | `/featured/[slug]` | Public featured-list page. |
| `app/community/page.tsx` | `/community` | Public curator-controlled community hub. |
| `app/settings/page.tsx` | `/settings` | Account settings, display name, export, delete. |
| `app/admin/page.tsx` | `/admin` | Admin dashboard. |
| `app/admin/users/page.tsx` | `/admin/users` | User management. |
| `app/admin/lists/page.tsx` | `/admin/lists` | Member list inspection and reports. |
| `app/admin/featured/page.tsx` | `/admin/featured` | Featured list management. |
| `app/admin/featured/new/page.tsx` | `/admin/featured/new` | Create featured list. |
| `app/admin/featured/candidates/page.tsx` | `/admin/featured/candidates` | Review opt-in member lists. |
| `app/privacy/page.tsx` | `/privacy` | Termly Privacy Policy embed. |
| `app/cookies/page.tsx` | `/cookies` | Termly Cookie Policy embed. |
| `app/terms/page.tsx` | `/terms` | Termly Terms and Conditions embed. |

### Components to Remove From Earlier Plan

Do not build these:

- `AuthDialog.tsx`: WorkOS hosted UI replaces it.
- `PublishListDialog.tsx`: there is no member publish workflow.
- `UsernameDialog.tsx`: replaced by optional `DisplayNameDialog.tsx`.
- `CommunityPageClient.tsx` as a member-feed page: `/community` is curator-controlled.

### Existing Components to Modify

| Component | Required Changes |
| --- | --- |
| `app/layout.tsx` | Wrap app with `AuthKitProvider` while preserving existing providers. |
| `components/SiteHeader.tsx` | Add Sign in button for logged-out users and UserMenu for logged-in users. |
| `components/MainNavigation.tsx` | Add Lists and Community. Community is always public; Lists is gated by page auth. |
| `components/MobileNavigation.tsx` | Five slots: Home, Map, Chat, Lists, Community. |
| `components/SiteFooter.tsx` | Add Privacy, Cookies, Terms, and Consent Preferences link. |
| `components/PlaceCard.tsx` | Add SaveButton and VisitedToggle using icons from `Icons`. |
| `components/PlaceModal.tsx` | Add SaveButton and VisitedToggle. |
| `components/PlacePageClient.tsx` | Add SaveButton and VisitedToggle near primary actions. |
| `components/Icons.tsx` | Add all needed icons through the centralized `Icons` object only. |

### Share Dialog UX

First-time share flow:

1. User opens a list.
2. User clicks **Share**.
3. `ShareListDialog` opens and calls `POST /api/lists/[listId]/share`.
4. Server generates `share_token`, sets `visibility = 'unlisted_link'`, and returns `/s/[token]`.
5. Dialog shows the URL, Copy Link, and Share via native share sheet.

Dialog copy:

> Anyone with this link can view your list. This page will not appear in Google, Bing, or the Charlotte Third Places sitemap. You can revoke the link at any time.

Controls:

- Copy Link.
- Share via system sheet when `navigator.share` exists.
- Include notes when sharing.
- Attribution: Anonymous community member or my display name.
- Revoke link.
- Generate new link.
- Stop sharing.

### Share-Link Page UX

`/s/[token]` shows:

- List name.
- List description.
- Attribution: anonymous by default.
- Places with resolved place data.
- Ratings if present.
- Notes only if `share_includes_notes = true`.
- Small footer: Report this link.

It does not show:

- Owner email.
- WorkOS profile data.
- Admin controls.
- Any other lists by the same member.
- Public comments, likes, or follows.

### Community Page UX

`/community` is public and curator-controlled.

Recommended sections:

- Featured lists.
- Anonymous aggregate signal: Most Saved This Week.
- About Charlotte Third Places.
- Contribute a place.
- App/community principles: curated public surface, private member lists, direct sharing.

It must not include a feed of arbitrary member-created lists.

### shadcn/ui Components

Likely needed:

```bash
npx shadcn@latest add radio-group switch tooltip checkbox
```

Already available according to the codebase scan: Button, Dialog, Drawer, Sheet, Tabs, Dropdown Menu, and Avatar.

### npm Packages

Install:

```bash
npm install @workos-inc/authkit-nextjs pg @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities node-pg-migrate jose
```

Uninstall:

```bash
npm uninstall better-auth
```

Do not install for v1:

- `@azure/communication-email`
- `leo-profanity`
- `input-otp`

---

## Navigation Changes

### Desktop Navigation

Logged out:

```txt
Home | Map | Chat | Lists | Community | About | Contribute    [Sign in]
```

Logged in:

```txt
Home | Map | Chat | Lists | Community | About | Contribute    [UserMenu]
```

Behavior:

- `/lists` shows a sign-in wall when logged out.
- `/community` is public and curator-controlled.
- Sign in links to `/login?returnTo=<current path>`.
- UserMenu includes My Lists, Settings, Sign out, and Admin when applicable.

### Mobile Bottom Navigation

Always use exactly five slots:

```txt
Home | Map | Chat | Lists | Community
```

Mobile constraints:

- The native app may not expose a browser back button.
- About and Contribute must be reachable from `/community`.
- Lists must be reachable from the bottom nav even when logged out; logged-out users see `SignInWall`.
- Community must be reachable from the bottom nav for logged-out and logged-in users.

### Footer

Footer includes:

- About.
- Contribute.
- Privacy.
- Cookies.
- Terms.
- Consent Preferences when cookie consent is enabled.

Footer alone is not enough for mobile reachability because the bottom nav changes the primary mobile affordances. Community must contain About and Contribute links.

---

## SEO, Privacy, and Anti-Indexing Rules

### Robots

`app/robots.ts` must disallow:

```txt
Disallow: /s/
Disallow: /lists/
Disallow: /settings/
Disallow: /admin/
```

### Sitemap

`app/sitemap.ts` must include:

- Public marketing/content pages.
- Place pages.
- `/featured`.
- Published `/featured/[slug]` pages.

`app/sitemap.ts` must exclude:

- `/s/[token]`.
- `/lists`.
- `/settings`.
- `/admin/*`.
- Any member-owned list route.

### Share-Link Metadata

`/s/[token]` must set:

```ts
robots: {
  index: false,
  follow: false,
  nocache: true,
}
```

Do not set a canonical URL on share-link pages.

OpenGraph metadata is allowed for link previews, but this must not make the page indexable.

### Featured Metadata

`/featured/[slug]` should set:

- Title.
- Description.
- Canonical URL.
- OpenGraph image.
- Twitter card metadata.
- `robots.index = true` when published.

### Privacy Defaults

Schema defaults must protect the user:

| Field | Default |
| --- | --- |
| `visibility` | `private` |
| `share_includes_notes` | `false` |
| `eligible_for_featuring` | `false` |
| `attribution_mode` | `anonymous` |
| `is_published` on `featured_list` | `false` |

---

## Implementation Checklist

### Phase 1: Auth and Infrastructure

- [ ] Install WorkOS, pg, dnd-kit, node-pg-migrate, and jose.
- [ ] Uninstall Better Auth.
- [ ] Create `lib/db.ts` with singleton `pg.Pool`.
- [ ] Create `lib/auth/workos.ts` with `requireAuth`, `ensureAppUser`, `requireAdmin`, and `getCurrentAppUser`.
- [ ] Create `app/login/route.ts`.
- [ ] Create `app/callback/route.ts`.
- [ ] Create `app/logout/route.ts`.
- [ ] Create `proxy.ts` with WorkOS `authkitMiddleware()`.
- [ ] Wrap the app in `AuthKitProvider` in `app/layout.tsx`.
- [ ] Add WorkOS environment variables locally and in Vercel.

### Phase 2: Database Schema

- [ ] Create `migrations/001_create_app_user.sql` for `app_user` and `auth_identity`.
- [ ] Create `migrations/002_create_user_list.sql` for `user_list` and `list_entry`.
- [ ] Create `migrations/003_create_featured_list.sql` for `featured_list` and `featured_list_entry`.
- [ ] Create `migrations/004_create_share_link_report.sql`.
- [ ] Create `scripts/seed-admin.ts` using `app_user.primary_email`.
- [ ] Create `.github/workflows/db-migrate.yml`.
- [ ] Run migrations locally once with `DATABASE_URL`.

### Phase 3: Core Lists

- [ ] Create `lib/constants.ts` for limits, rating labels, route constants, and sharing defaults.
- [ ] Create `lib/lists-service.ts` with server-side SQL operations.
- [ ] Build `/api/lists` route.
- [ ] Build `/api/lists/[listId]` route.
- [ ] Build `/api/lists/[listId]/places` route.
- [ ] Build `/api/lists/[listId]/places/[placeId]` route.
- [ ] Build `/api/lists/[listId]/reorder` route.
- [ ] Create ListsContext and ListsProvider if client state requires it.
- [ ] Build `/lists` page with tabs, sort modes, rating edits, note edits, and reorder.

### Phase 4: Place Save UI

- [ ] Build `SaveButton`.
- [ ] Build `ListPicker`.
- [ ] Build `VisitedToggle`.
- [ ] Build `StarRating`.
- [ ] Add save and visited actions to `PlaceCard.tsx`.
- [ ] Add save and visited actions to `PlaceModal.tsx`.
- [ ] Add save and visited actions to `PlacePageClient.tsx`.
- [ ] Add needed icons through `components/Icons.tsx` only.

### Phase 5: World A Share Links

- [ ] Build `POST /api/lists/[listId]/share`.
- [ ] Build `DELETE /api/lists/[listId]/share`.
- [ ] Build `POST /api/lists/[listId]/share/rotate`.
- [ ] Build `ShareListDialog`.
- [ ] Implement Copy Link fallback.
- [ ] Implement native `navigator.share` path.
- [ ] Build `app/s/[token]/page.tsx`.
- [ ] Add `noindex,nofollow` metadata to share-link pages.
- [ ] Build `ReportLinkDialog`.
- [ ] Build `POST /api/share/[token]/report`.
- [ ] Update `app/robots.ts` to block `/s/`.
- [ ] Update `app/sitemap.ts` to exclude share links.

### Phase 6: Featured Lists

- [ ] Build `featured_list` query helpers.
- [ ] Build `/featured` page.
- [ ] Build `/featured/[slug]` page.
- [ ] Build `/api/featured` route.
- [ ] Build `/api/featured/[slug]` route.
- [ ] Add featured pages to sitemap.
- [ ] Build admin featured list editor.
- [ ] Build admin candidate review page.
- [ ] Build promote-to-featured API route.
- [ ] Build opt-in toggle on list settings.

### Phase 7: Community Page

- [ ] Build `/community` as a public curator-controlled hub.
- [ ] Add Featured Lists section.
- [ ] Add anonymous Most Saved This Week section.
- [ ] Add About link.
- [ ] Add Contribute link.
- [ ] Confirm no member-list feed appears on the page.

### Phase 8: Account and Admin

- [ ] Build `/settings` page.
- [ ] Build display-name API routes.
- [ ] Build data export route.
- [ ] Build account deletion route.
- [ ] Build admin dashboard.
- [ ] Build admin users page and API routes.
- [ ] Build admin lists page with share-link reports.
- [ ] Build admin revoke-share action.
- [ ] Add banned-user checks to authenticated helpers.

### Phase 9: Legal and Polish

- [ ] Add Termly policy pages.
- [ ] Add Termly consent banner before tracking scripts.
- [ ] Update Termly policy copy for WorkOS and World A share links.
- [ ] Add footer links.
- [ ] Add error toasts for failed saves, shares, revokes, reports, and reorders.
- [ ] Add loading and empty states.
- [ ] Add responsive spacing for mobile bottom nav.

---

## Manual Configuration Steps

### 1. Create Azure Database for PostgreSQL Flexible Server

1. Go to Azure Portal.
2. Create Azure Database for PostgreSQL Flexible Server.
3. Use existing resource group if appropriate, such as `rg-third-places-data`.
4. Recommended starting tier: Burstable B1ms, 1 vCore, 2 GB RAM, 32 GB storage.
5. Use PostgreSQL 16 or newer.
6. Configure public access and firewall rules for development and Vercel access.
7. Create database `thirdplaces`.
8. Save the connection string as `DATABASE_URL` with `sslmode=require`.

Example shape:

```txt
postgresql://{user}:{password}@{server}.postgres.database.azure.com:5432/thirdplaces?sslmode=require
```

### 2. Configure WorkOS AuthKit

1. Create or open the WorkOS project.
2. Copy `WORKOS_API_KEY`.
3. Copy `WORKOS_CLIENT_ID`.
4. Generate a 32+ character `WORKOS_COOKIE_PASSWORD`.
5. Configure local redirect URI: `http://localhost:3000/callback`.
6. Configure production redirect URI: `https://www.charlottethirdplaces.com/callback`.
7. Configure sign-in endpoint: `http://localhost:3000/login` and production equivalent.
8. Configure sign-out redirect: local and production home URLs.
9. Enable Magic Auth email OTP.
10. Configure Google OAuth provider inside WorkOS.
11. Configure Apple provider inside WorkOS with Apple Developer Team ID, Service ID, Key ID, and private key.
12. Keep the default hosted AuthKit domain for v1.

### 3. Configure Vercel Environment Variables

Add:

| Variable | Environment |
| --- | --- |
| `WORKOS_API_KEY` | Production, Preview, Development if needed |
| `WORKOS_CLIENT_ID` | Production, Preview, Development if needed |
| `WORKOS_COOKIE_PASSWORD` | Production, Preview, Development if needed |
| `NEXT_PUBLIC_WORKOS_REDIRECT_URI` | Production, Preview, Development |
| `DATABASE_URL` | Production, Preview, Development if using remote DB |
| `NEXT_PUBLIC_ENABLE_COOKIE_CONSENT` | Optional; default true |

### 4. Configure GitHub Secrets

For migration workflow:

| Secret | Purpose |
| --- | --- |
| `DATABASE_URL` | Allows GitHub Actions to run migrations and seed admin. |

Do not add WorkOS secrets to GitHub Actions unless CI tests explicitly need them.

### 5. Run Database Migrations

Local:

```bash
npx node-pg-migrate up
npx tsx scripts/seed-admin.ts
```

CI:

- Run the same two commands in `.github/workflows/db-migrate.yml`.

### 6. Termly Policies

Termly policy IDs already exist:

| Policy | UUID |
| --- | --- |
| Privacy Policy | `4af666ad-5f20-42ae-96d3-0b587717c6f6` |
| Cookie Policy | `1416a187-4ce6-4e4b-abdd-39c1cb4f7671` |
| Terms and Conditions | `354be667-fbde-479e-a4b9-1a3b261ef0ed` |
| Consent Banner | `6d8a214b-c280-4e7b-90b7-1863059212ca` |

Update policy text to reflect:

- WorkOS as authentication provider.
- Google and Apple sign-in through WorkOS.
- Email OTP through WorkOS Magic Auth.
- Azure PostgreSQL as app data store.
- Unlisted share links as user-controlled direct sharing.
- Curator-featured public pages.
- Shared lists reflect the list author's content, not an official Charlotte Third Places recommendation.

### Removed Manual Steps

Do not create:

- Azure Communication Services resource for auth.
- ACS sender domain for auth.
- Better Auth secret.
- Better Auth URL.
- Better Auth migration.
- Better Auth API route.

---

## Testing Strategy

Use the repo's existing commands from `charlotte-third-places/charlotte-third-places`:

| Command | Purpose |
| --- | --- |
| `npm run test:unit:run` | Run unit tests once. |
| `npm run test:e2e` | Run Playwright E2E with automatic dev server handling. |
| `npm test` | Run all tests. |

### Unit and Component Tests

| Test File | Coverage |
| --- | --- |
| `SaveButton.test.tsx` | Logged-out sign-in path, logged-in picker, saved state. |
| `VisitedToggle.test.tsx` | Adds/removes place from Visited list. |
| `StarRating.test.tsx` | Rating selection, clearing, labels. |
| `ListPicker.test.tsx` | List selection, duplicate handling, note entry. |
| `SortableListEntries.test.tsx` | Reorder event and position update payload. |
| `ListsPage.test.tsx` | Tabs, sort modes, empty states, custom lists. |
| `ShareListDialog.test.tsx` | Token generation, Copy Link, native share fallback, revoke, rotate, include-notes toggle. |
| `ShareLinkPage.test.tsx` | Public read-only rendering, notes hidden by default, report link. |
| `FeaturedListPage.test.tsx` | Public featured rendering and curator notes. |
| `Navigation.test.tsx` | Desktop and mobile nav match locked structure. |
| `UserMenu.test.tsx` | User dropdown, settings, sign out, admin link. |
| `SignInWall.test.tsx` | Lists/settings sign-in wall and return target. |
| `DisplayNameDialog.test.tsx` | Optional display name validation and uniqueness checks. |
| `ensureAppUser.test.ts` | Idempotent local user provisioning from WorkOS user. |
| `auth-helpers.test.ts` | `requireAuth`, `requireAdmin`, banned user behavior. |
| `lists-service.test.ts` | CRUD, limits, ownership checks. |
| `share-service.test.ts` | Generate, revoke, rotate, and resolve share tokens. |

### E2E Tests

| Test File | Coverage |
| --- | --- |
| `auth-flow.spec.ts` | WorkOS mocked login, session persistence, logout. |
| `save-place.spec.ts` | Save place, mark visited, edit note, remove place. |
| `lists-page.spec.ts` | Create, rename, delete custom list; sort; reorder. |
| `rating-and-ranking.spec.ts` | Rate, edit rating, clear rating, reorder. |
| `share-flow.spec.ts` | Create share link, open as anonymous viewer, report link, revoke link, confirm 404. |
| `featured-flow.spec.ts` | Opt in to featuring, admin promotes snapshot, public featured page loads. |
| `mobile-nav.spec.ts` | Home, Map, Chat, Lists, Community reachable; About and Contribute reachable from Community. |
| `account-deletion.spec.ts` | Delete account, local data cascades, user loses access. |
| `admin.spec.ts` | Admin stats, user search, ban/unban, revoke share link. |

### API Route Tests

| Route | Critical Cases |
| --- | --- |
| `GET /api/lists` | Requires auth, returns only current user's lists. |
| `POST /api/lists` | Enforces custom list limit and validates name. |
| `POST /api/lists/[listId]/places` | Prevents duplicates and enforces max places. |
| `PATCH /api/lists/[listId]/places/[placeId]` | Validates note length and rating range. |
| `POST /api/lists/[listId]/reorder` | Validates all entries belong to list. |
| `POST /api/lists/[listId]/share` | Creates active token and returns URL. |
| `DELETE /api/lists/[listId]/share` | Revokes token and makes `/s/[token]` return 404. |
| `POST /api/lists/[listId]/share/rotate` | Old token 404s, new token works. |
| `GET /s/[token]` | Resolves active token, hides notes by default, noindexes page. |
| `POST /api/share/[token]/report` | Creates report without auth. |
| `POST /api/admin/featured/promote` | Requires admin and snapshots member list. |
| `DELETE /api/user` | Deletes `app_user`; cascades product data. |

### Mocking Strategy

| Dependency | Mock Approach |
| --- | --- |
| WorkOS SDK | Mock `withAuth`, `getSignInUrl`, `handleAuth`, and `signOut`. |
| PostgreSQL | Use `pg-mem` or mocked `pg.Pool` for unit tests. |
| Place data | Use existing local CSV/test fixtures. |
| Web Share API | Stub `navigator.share` and clipboard APIs. |
| `@dnd-kit` | Use testing utilities or direct reorder callback invocation. |
| Network | Use MSW where client-side request mocking is needed. |

### Critical Path Before Deploy

- [ ] Unauthenticated users can browse the core site.
- [ ] Authenticated users can save a place.
- [ ] Authenticated users can mark a place as visited.
- [ ] Authenticated users can rate and reorder list entries.
- [ ] Private lists are not viewable by other users.
- [ ] Share links are viewable without sign-in.
- [ ] Share links are `noindex,nofollow`.
- [ ] Revoked share links return 404.
- [ ] Share-link report flow works without sign-in.
- [ ] Member lists do not appear in sitemap.
- [ ] Featured lists do appear in sitemap.
- [ ] `/community` contains no arbitrary member feed.
- [ ] Mobile nav has Home, Map, Chat, Lists, Community.
- [ ] About and Contribute are reachable from Community on mobile.
- [ ] Admin can promote a member opt-in list to featured snapshot.
- [ ] Admin can revoke a share link.
- [ ] Account deletion cascades local product data.

---

## Privacy and Compliance

### Data Stored Locally

| Data | Purpose | Retention |
| --- | --- | --- |
| Primary email | Account identity, support, admin search | Until account deletion |
| WorkOS user ID snapshot | Link WorkOS identity to local app user | Until account deletion |
| Optional display name | Optional attribution on shared/featured lists | Until cleared or account deletion |
| Saved places | Core list feature | Until removed or account deletion |
| Ratings | User's private rating data and optional share display | Until removed or account deletion |
| Notes | Private user notes; optional share display if enabled | Until removed or account deletion |
| Share token | Enables unlisted direct sharing | Until revoked, rotated, or account deletion |
| Share-link reports | Abuse handling | Until resolved and retention policy expires |
| Admin flags | Authorization for admin UI | Until changed or account deletion |

### Data Not Stored Locally

- Passwords.
- Auth email OTP codes.
- OAuth access tokens.
- OAuth refresh tokens.
- Payment information.
- Precise user location.
- Public member profiles.
- Public member feed entries.

WorkOS may store auth-provider details necessary to operate authentication. The app should not copy WorkOS profile data into public attribution by default.

### User Rights

| Right | Implementation |
| --- | --- |
| Access | `/api/user/export` returns JSON export. |
| Deletion | `DELETE /api/user` deletes `app_user` and cascades product data. |
| Portability | JSON export is machine-readable. |
| Rectification | User can edit lists, entries, notes, ratings, display name. |
| Objection | User can revoke share links and opt out of featuring consideration. |

### Account Deletion Behavior

Deleting an account:

- Deletes the `app_user` row.
- Cascades `auth_identity`, `user_list`, and `list_entry`.
- Deletes or cascades share-link report relationships as designed by FK.
- Sets `featured_list.source_app_user_id` and `source_user_list_id` to null for snapshots that already became curator-owned public content.
- Best-effort calls WorkOS to delete or deactivate the WorkOS user if supported and desired.

Featured snapshots are curator-owned editorial content. If a user deletes their account after a list was featured, the public snapshot may remain but attribution should degrade to anonymous unless a separate removal policy requires deletion.

### Shared-Link Liability Framing

Terms should state:

> Lists shared through unlisted links reflect the views and content of the list author. Charlotte Third Places does not index, promote, or endorse unlisted shared lists. Public recommendations on Charlotte Third Places are curator-controlled featured content.

### Third-Party Processors

| Processor | Purpose |
| --- | --- |
| WorkOS | Authentication, hosted AuthKit UI, social login, email OTP. |
| Microsoft Azure | PostgreSQL data storage and existing backend infrastructure. |
| Vercel | Hosting, deployment, analytics where enabled. |
| Termly | Legal policies and cookie consent. |
| Airtable | Place data source of truth. |

---

## Cost Estimates

### Monthly Costs at Launch

| Service | Estimated Cost | Notes |
| --- | --- | --- |
| Azure PostgreSQL Flexible Server B1ms | ~$13-15 | 1 vCore, 2 GB RAM, 32 GB storage. |
| WorkOS AuthKit | $0 | Free up to 1M monthly active users. |
| Vercel | $0 | Hobby plan may be sufficient initially. |
| Termly | Existing paid plan | Already selected for policies and consent. |
| **Total New Monthly Cost** | **~$13-15 plus existing Termly** | WorkOS and Vercel can remain free at launch. |

### At 1,000 Users

| Service | Estimated Cost |
| --- | --- |
| Azure PostgreSQL Flexible Server B1ms | ~$13-15/month |
| WorkOS AuthKit | $0 |
| Vercel | $0-20/month depending on plan and traffic |
| Termly | Existing paid plan |

### At 10,000 Users

| Service | Estimated Cost |
| --- | --- |
| Azure PostgreSQL Flexible Server B2s if needed | ~$26/month |
| WorkOS AuthKit | $0 under 1M MAU |
| Vercel | ~$20/month if Pro is needed |
| Termly | Existing paid plan |

### Costs Explicitly Avoided in v1

| Service | Why Avoided |
| --- | --- |
| WorkOS custom AuthKit domain | $99/month add-on; not needed for v1. |
| Azure Communication Services Email | WorkOS sends auth emails. |
| Automated moderation APIs | No public member feed, so no moderation pipeline needed. |
| Directory Sync / enterprise SSO | Not relevant to consumer app users. |

---

## Environment Variables

### Required Locally and in Vercel

| Variable | Description |
| --- | --- |
| `WORKOS_API_KEY` | Server-side WorkOS API key. |
| `WORKOS_CLIENT_ID` | WorkOS client ID. |
| `WORKOS_COOKIE_PASSWORD` | 32+ character cookie encryption password. |
| `NEXT_PUBLIC_WORKOS_REDIRECT_URI` | Callback URL for current environment. |
| `DATABASE_URL` | Azure PostgreSQL connection string with `sslmode=require`. |

### Optional

| Variable | Default | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_ENABLE_COOKIE_CONSENT` | `true` | Enables Termly cookie consent banner. |

### Removed Variables

Do not use:

- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `AZURE_ACS_CONNECTION_STRING`
- `AZURE_ACS_SENDER_ADDRESS`

---

## Type Definitions

```typescript
// lib/types/lists.ts

export type ListVisibility = "private" | "unlisted_link" | "curator_featured";

export type AttributionMode = "anonymous" | "display_name";

export interface AppUser {
  id: string;
  primaryEmail: string;
  displayName: string | null;
  isAdmin: boolean;
  isBanned: boolean;
  createdAt: string;
  updatedAt: string;
  lastSeenAt: string | null;
}

export interface PlaceEntry {
  id: string;
  placeId: string;
  notes: string;
  rating: number | null;
  position: number;
  addedAt: string;
}

export interface UserList {
  id: string;
  appUserId: string;
  slug: string;
  name: string;
  description: string;
  isDefaultList: boolean;
  visibility: ListVisibility;
  shareToken: string | null;
  shareTokenCreatedAt: string | null;
  shareTokenRevokedAt: string | null;
  shareIncludesNotes: boolean;
  eligibleForFeaturing: boolean;
  attributionMode: AttributionMode;
  createdAt: string;
  updatedAt: string;
}

export interface UserListWithEntries extends UserList {
  entries: PlaceEntry[];
}

export interface SharedListView {
  listId: string;
  name: string;
  description: string;
  attribution: string;
  attributionMode: AttributionMode;
  shareIncludesNotes: boolean;
  entries: SharedPlaceEntry[];
}

export interface SharedPlaceEntry {
  placeId: string;
  rating: number | null;
  notes?: string;
  position: number;
}

export interface FeaturedList {
  id: string;
  slug: string;
  title: string;
  description: string;
  heroImageUrl: string | null;
  sourceUserListId: string | null;
  sourceAppUserId: string | null;
  attributionMode: AttributionMode;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FeaturedListEntry {
  id: string;
  featuredListId: string;
  placeId: string;
  position: number;
  curatorNote: string;
}
```

---

## File Structure

```txt
charlotte-third-places/
  app/
    login/
      route.ts
    callback/
      route.ts
    logout/
      route.ts
    lists/
      page.tsx
    s/
      [token]/
        page.tsx
        ShareLinkPageClient.tsx
    featured/
      page.tsx
      [slug]/
        page.tsx
        FeaturedListPageClient.tsx
    community/
      page.tsx
    settings/
      page.tsx
    admin/
      page.tsx
      users/
        page.tsx
      lists/
        page.tsx
      featured/
        page.tsx
        new/
          page.tsx
        candidates/
          page.tsx
    privacy/
      page.tsx
    cookies/
      page.tsx
    terms/
      page.tsx
    api/
      lists/
        route.ts
        [listId]/
          route.ts
          reorder/
            route.ts
          share/
            route.ts
            rotate/
              route.ts
          featuring-opt-in/
            route.ts
          places/
            route.ts
            [placeId]/
              route.ts
      share/
        [token]/
          report/
            route.ts
      featured/
        route.ts
        [slug]/
          route.ts
      user/
        route.ts
        export/
          route.ts
        display-name/
          route.ts
          check/
            route.ts
      admin/
        stats/
          route.ts
        users/
          route.ts
          [userId]/
            route.ts
            ban/
              route.ts
            unban/
              route.ts
        lists/
          route.ts
          reports/
            route.ts
          [listId]/
            revoke-share/
              route.ts
        featured/
          route.ts
          candidates/
            route.ts
          promote/
            route.ts
          [featuredListId]/
            route.ts
  components/
    SaveButton.tsx
    VisitedToggle.tsx
    StarRating.tsx
    ListPicker.tsx
    SortableListEntries.tsx
    ShareListDialog.tsx
    ReportLinkDialog.tsx
    FeaturedListCard.tsx
    OptInToFeaturingToggle.tsx
    DisplayNameDialog.tsx
    CreateListDialog.tsx
    SignInWall.tsx
    UserMenu.tsx
    admin/
      AdminFeaturedEditor.tsx
  contexts/
    ListsContext.tsx
  lib/
    db.ts
    constants.ts
    lists-service.ts
    share-service.ts
    featured-service.ts
    auth/
      workos.ts
    types/
      lists.ts
  migrations/
    001_create_app_user.sql
    002_create_user_list.sql
    003_create_featured_list.sql
    004_create_share_link_report.sql
  scripts/
    seed-admin.ts
  proxy.ts
  .github/
    workflows/
      db-migrate.yml
```

---

## Maintenance Calendar

| Task | Frequency | Notes |
| --- | --- | --- |
| Review Termly policies | Annually | Confirm WorkOS, sharing, and processors are accurate. |
| Review WorkOS provider settings | Quarterly | Confirm Google, Apple, and Magic Auth are healthy. |
| Review Azure PostgreSQL costs | Quarterly | Scale up only when metrics justify it. |
| Review open share-link reports | Weekly once launched | Revoke abusive links quickly. |
| Review featured candidates | Optional weekly/monthly | Curator workflow, not moderation obligation. |
| Review sitemap and robots output | Before launch and after SEO changes | Confirm `/s/*` is never indexed. |

---

## Future Roadmap

### Additional Curators

When ready, add trusted curators by setting `app_user.is_admin = true` or introducing a more granular `curator` role. The featured-list workflow already supports multiple curators conceptually.

### Custom WorkOS AuthKit Domain

Defer the custom AuthKit domain until there is a clear brand or conversion reason to pay for it.

### Anonymous Aggregate Signals

The Community page can show anonymous community-derived signals without exposing member content:

- Most saved this week.
- Most visited this month.
- Highest average rating among places with enough saves.

These should link to place pages, not member lists.

### Offline Resilience

If users report unreliable mobile connectivity, add optimistic UI updates and a retry queue. This is deferred until there is evidence it is needed.

### Share-Link Expiration

Optional future enhancement: allow owners to set expiration dates for share links.

### Business Accounts

The local `app_user` and `auth_identity` model can support future business accounts without moving product ownership into WorkOS.
