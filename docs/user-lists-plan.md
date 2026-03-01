# User Lists Feature

Enable users to save third places to personal lists with community sharing. Email-based authentication (magic link + OTP code), full GDPR compliance, offline resilience, and comprehensive test coverage.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Decisions](#architecture-decisions)
3. [Database Schema](#database-schema)
4. [API Routes](#api-routes)
5. [UI Components](#ui-components)
6. [Navigation Changes](#navigation-changes)
7. [Offline Resilience](#offline-resilience)
8. [Implementation Checklist](#implementation-checklist)
9. [Manual Configuration Steps](#manual-configuration-steps)
10. [Testing Strategy](#testing-strategy)
11. [Privacy & Compliance](#privacy--compliance)
12. [Cost Estimates](#cost-estimates)

---

## Executive Summary

### What We're Building

- **Personal Lists**: 3 default lists (Favorites, To Visit, Visited) + up to 5 custom lists per user
- **Community Features**: Users can publish any list (including defaults) publicly; curators can create featured lists
- **Authentication**: Email-based (magic link + OTP code) — no passwords, no OAuth complexity
- **Privacy**: Full GDPR/CCPA compliance with account deletion, data export, and privacy policy

### Key Technology Choices

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Authentication** | [Better Auth](https://www.better-auth.com/) (magic link + email OTP) | No rotating secrets, no provider portals, works on localhost, zero maintenance |
| **Email Service** | [Azure Communication Services](https://learn.microsoft.com/en-us/azure/communication-services/overview) | Free tier (100 emails/day), stays within existing Azure ecosystem and $150/month credits |
| **Database** | [Azure Table Storage](https://learn.microsoft.com/en-us/azure/storage/tables/table-storage-overview) | ~$0.03/month, uses existing `thirdplacesdata` account, no RU limits |
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

### Why Not Cosmos DB for Table?

We evaluated Cosmos DB for Table but chose Azure Table Storage because:

- **Cost**: Table Storage ~$0.03/month vs Cosmos DB minimum ~$24/month (or competes with existing free tier RU budget)
- **Simplicity**: Uses existing storage account, no new Cosmos account needed
- **Sufficient for use case**: User lists don't need <10ms SLA latency or global distribution
- **Same SDK**: [`@azure/data-tables`](https://www.npmjs.com/package/@azure/data-tables) works with both, so migration is possible later if needed

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
- ❌ `lib/table-storage.ts` — Azure Table Storage client not created
- ❌ Auth API routes (`/api/auth/[...all]`)
- ❌ Auth context/provider
- ❌ Lists API routes and context/provider
- ❌ Any user-facing auth UI (AuthDialog, UserMenu, etc.)
- ❌ Policy pages (`/privacy`, `/cookies`, `/terms`)
- ❌ Cookie consent banner (Termly)
- ❌ Lists page (`/lists`), Community page (`/community`)
- ❌ [`@azure/data-tables`](https://www.npmjs.com/package/@azure/data-tables) package — needs to be installed

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

### Storage: [Azure Table Storage](https://learn.microsoft.com/en-us/azure/storage/tables/table-storage-overview)

**Decision**: Use Azure Table Storage on existing `thirdplacesdata` storage account.

**Rationale**:

- Existing account = no new resources to provision
- Consumption pricing = ~$0.03/month for expected usage
- No RU limits = no throttling concerns
- Simple key-value model fits user lists perfectly

### Email Service: [Azure Communication Services](https://learn.microsoft.com/en-us/azure/communication-services/concepts/email/email-overview)

**Decision**: Use [Azure Communication Services (ACS) Email](https://learn.microsoft.com/en-us/azure/communication-services/concepts/email/email-overview) for sending magic links and OTP codes.

**Rationale**:

- Free tier: 100 emails/day (more than enough for expected sign-ups)
- Beyond free tier: ~$0.00025 per email (negligible)
- Stays within existing Azure ecosystem and $150/month Azure credits
- No new vendor relationship required

### Publishing: Lightweight Index Pattern

**Decision**: Store published list metadata in a separate `publishedLists` partition for efficient community feed queries.

**Rationale**:

- Querying across all users' lists would be slow (cross-partition)
- Index contains only metadata (name, place count, preview)
- Full list data fetched on-demand when user clicks

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

### Azure Table Storage Tables

All tables created on existing `thirdplacesdata` storage account.

#### Authentication Tables (Better Auth)

```txt
Table: user
PartitionKey: "users"
RowKey: {userId}  (uuid generated by Better Auth)
Properties:
  - email: string
  - emailVerified: boolean
  - createdAt: datetime
  - updatedAt: datetime
```

```txt
Table: session
PartitionKey: user_{userId}
RowKey: {sessionToken}
Properties:
  - userId: string
  - expiresAt: datetime  (set to 10 years from creation)
  - createdAt: datetime
  - updatedAt: datetime
```

```txt
Table: verification
PartitionKey: "verification"
RowKey: {token}
Properties:
  - identifier: string   (email address)
  - value: string         (magic link token or OTP code)
  - expiresAt: datetime   (10 minutes from creation)
  - createdAt: datetime
  - updatedAt: datetime
```

**Note:** No `account` table needed — that was for storing OAuth provider tokens, which magic link authentication doesn't require.

#### User Lists Table

```txt
Table: userLists
PartitionKey: user_{userId}
RowKey: favorites | to-visit | visited | custom_{uuid}
Properties:
  - name: string (e.g., "Favorites", "Best Coffee Spots")
  - description: string (empty string for default lists)
  - placeEntries: JSON string
      [
        {
          "placeId": "google-maps-place-id",
          "notes": "Great pour-over, quiet on weekdays",
          "addedAt": "2026-01-15T10:30:00Z"
        }
      ]
  - isDefaultList: boolean (true for favorites/to-visit/visited)
  - isPublic: boolean (whether list is published to community)
  - publishedAt: datetime | null
  - createdAt: datetime
  - updatedAt: datetime
```

**List Limits** (enforced in API routes via constants in `lib/constants.ts`):

- `MAX_CUSTOM_LISTS = 5` — custom lists per user (3 defaults don't count)
- `MAX_PLACES_PER_LIST = 100` — places per list
- `MAX_NOTE_LENGTH = 500` — characters per note

#### Published Lists Index

```txt
Table: publishedLists
PartitionKey: "community"
RowKey: {reverseTimestamp}_{listId}
Properties:
  - listId: string (matches userLists RowKey)
  - userId: string (for lookup only, NOT displayed publicly)
  - name: string
  - description: string
  - placeCount: number
  - previewPlaceIds: JSON string (first 3 place IDs for thumbnail)
  - publishedAt: datetime
```

**Privacy Note**: Published lists display only the **list name** — never the author's email. The `userId` is stored only for internal lookup (e.g., allowing the owner to unpublish).

**Why reverseTimestamp?**: Azure Table Storage sorts RowKey ascending. Using `(MAX_TIMESTAMP - timestamp)` puts newest first, enabling efficient "recent lists" queries.

---

## API Routes

### Authentication Routes (Better Auth handles these)

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/[...all]` | ALL | Better Auth catch-all handler (magic link, OTP, session management) |

### Lists Routes

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/lists` | GET | Required | Get all lists for current user |
| `/api/lists` | POST | Required | Create custom list |
| `/api/lists/[listId]` | GET | Required | Get single list with full place data |
| `/api/lists/[listId]` | PATCH | Required | Update list (name, description) |
| `/api/lists/[listId]` | DELETE | Required | Delete custom list (not defaults) |
| `/api/lists/[listId]/places` | POST | Required | Add place to list |
| `/api/lists/[listId]/places/[placeId]` | PATCH | Required | Update note for place in list |
| `/api/lists/[listId]/places/[placeId]` | DELETE | Required | Remove place from list |
| `/api/lists/[listId]/publish` | POST | Required | Publish list to community |
| `/api/lists/[listId]/unpublish` | POST | Required | Remove list from community |

### Community Routes

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/community/lists` | GET | None | Get published lists feed (paginated) |
| `/api/community/lists/[userId]/[listId]` | GET | None | Get full public list by ID |

### User Routes

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/user/export` | GET | Required | Download all user data as JSON |
| `/api/user` | DELETE | Required | Delete account and all data |

### Curator Routes (Admin Only)

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/curator/lists` | GET | None | Get curator lists (from Airtable, ISR cached) |

---

## UI Components

### New Components to Create

| Component | Location | Description |
|-----------|----------|-------------|
| `SaveButton.tsx` | `components/` | Bookmark icon button, opens list picker |
| `ListPicker.tsx` | `components/` | Drawer (mobile) / Sheet (desktop) with checkboxes |
| `ListsPageClient.tsx` | `app/lists/` | Main lists page with tabs |
| `ListCard.tsx` | `components/` | Card showing list preview (for community feed) |
| `PublishListDialog.tsx` | `components/` | Confirmation dialog for publishing |
| `CreateListDialog.tsx` | `components/` | Form to create custom list |
| `AuthDialog.tsx` | `components/` | Sign in prompt — email input, then magic link/code entry |
| `UserMenu.tsx` | `components/` | Email display dropdown with settings, sign out |

### New Pages to Create

| Page | Route | Description |
|------|-------|-------------|
| `app/privacy/page.tsx` | `/privacy` | Privacy Policy (Termly embed) |
| `app/cookies/page.tsx` | `/cookies` | Cookie Policy (Termly embed) |
| `app/terms/page.tsx` | `/terms` | Terms and Conditions (Termly embed) |

### Existing Components to Modify

| Component | Changes |
|-----------|---------|
| `PlaceCard.tsx` | Add SaveButton |
| `PlaceModal.tsx` | Add SaveButton in header |
| `PlacePageClient.tsx` | Add SaveButton |
| `MainNavigation.tsx` | Add "Lists" link when authenticated |
| `MobileNavigation.tsx` | Replace "About" with "Lists" when authenticated |
| `SiteHeader.tsx` | Add UserMenu when authenticated |
| `SiteFooter.tsx` | Add "About", "Privacy", "Cookies", "Terms" links |
| `Icons.tsx` | Add Bookmark, BookmarkCheck icons |

### shadcn/ui Components to Install

```bash
npx shadcn@latest add checkbox input-otp
```

Already available: [Drawer](https://ui.shadcn.com/docs/components/drawer), [Sheet](https://ui.shadcn.com/docs/components/sheet), [Tabs](https://ui.shadcn.com/docs/components/tabs), [Dialog](https://ui.shadcn.com/docs/components/dialog), [Button](https://ui.shadcn.com/docs/components/button), [Avatar](https://ui.shadcn.com/docs/components/avatar)

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
Home | Map | Chat | Contribute | About
```

**Logged In:**

```
Home | Map | Chat | Contribute | Lists | About    [User Menu]
```

### Mobile (MobileNavigation.tsx)

**Logged Out:**

```
🏠 Home | 🗺️ Map | 💬 Chat | ➕ Contribute | ℹ️ About
```

**Logged In:**

```
🏠 Home | 🗺️ Map | 💬 Chat | ➕ Contribute | 📚 Lists
```

**Where does About go?**

- Added to SiteFooter (already common pattern)
- Also accessible from UserMenu dropdown

### Mobile Header (SiteHeader.tsx)

**Logged In:**

- Add user icon on right side (initials or generic icon — no avatar since we only collect email)
- Tap opens UserMenu with: My Lists, Settings, About, Sign Out

---

## Offline Resilience

### Strategy: Optimistic Updates with Retry Queue

When a user saves a place while online, it updates immediately. If the network fails mid-request, the action is queued for retry.

### User Experience

1. **Save action** → Optimistic UI update (immediate feedback)
2. **API call succeeds** → Done
3. **API call fails** → Action queued, user sees subtle "syncing" indicator
4. **Network restored** → Queue processed automatically
5. **Max retries exceeded** → Toast notification, user can retry manually

### Conflict Resolution

- **Last-write-wins**: If same place is added/removed while offline, most recent action wins
- **Server is source of truth**: On login, fetch fresh data from server, merge with localStorage

---

## Implementation Checklist

Ordered list of implementation tasks. Complete in sequence; some tasks depend on prior ones.

### Authentication Setup

- [ ] Install dependencies:
  ```bash
  npm install @azure/data-tables @azure/communication-email
  npx shadcn@latest add checkbox input-otp
  ```
  > Note: `better-auth` is already installed
- [ ] Create `lib/constants.ts` with list limits, feature flags, session config
- [ ] Create Azure Communication Services resource (see Manual Steps)
- [ ] Create Azure Table Storage tables (see Manual Steps)
- [ ] Create `lib/auth.ts` — Better Auth server config with magic link + email OTP plugins
- [ ] Create `lib/auth-client.ts` — Better Auth client-side utilities
- [ ] Create `lib/email.ts` — Azure Communication Services email sender
- [ ] Create `app/api/auth/[...all]/route.ts` (Better Auth catch-all handler)
- [ ] Create AuthContext and AuthProvider
- [ ] Build AuthDialog component (email input → code entry)
- [ ] Add UserMenu to SiteHeader

### Core Lists Functionality

- [ ] Create `lib/table-storage.ts` singleton client
- [ ] Create `lib/lists-service.ts` for API calls
- [ ] Build API routes:
  - `/api/lists` (GET, POST)
  - `/api/lists/[listId]` (GET, PATCH, DELETE)
  - `/api/lists/[listId]/places` (POST)
  - `/api/lists/[listId]/places/[placeId]` (PATCH, DELETE)
- [ ] Create ListsContext and ListsProvider
- [ ] Build SaveButton and ListPicker components
- [ ] Add SaveButton to PlaceCard, PlaceModal, PlacePageClient

### Lists Page

- [ ] Create `/app/lists/page.tsx` with tabs
- [ ] Build ListsPageClient with:
  - Tab per list
  - Place cards with notes
  - Remove from list action
  - Empty state
- [ ] Update navigation:
  - MainNavigation: Add "Lists" when logged in
  - MobileNavigation: Replace "About" with "Lists"
  - SiteFooter: Add "About" link

### Community Features

- [ ] Build publish/unpublish API routes
- [ ] Create PublishListDialog component
- [ ] Add publish toggle to list settings
- [ ] Build community feed:
  - `/app/community/page.tsx`
  - `/api/community/lists` endpoint
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
  - Download as JSON
- [ ] Build account deletion:
  - `/api/user` DELETE endpoint
  - Cascade delete from all tables
  - Confirmation dialog
- [ ] Add Settings page with:
  - Export data button
  - Delete account button

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

### Offline Support & Polish

- [ ] Implement OfflineQueue (localStorage-backed retry queue)
- [ ] Add sync indicators
- [ ] Implement localStorage → account sync on login
- [ ] Add loading states and error handling
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

### 2. Create Azure Table Storage Tables ⏳ TODO

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Storage accounts → thirdplacesdata**
3. Click **Tables** in left sidebar
4. Create tables:
   - `user` (Better Auth users — stores email only)
   - `session` (Better Auth sessions — long-lived)
   - `verification` (Better Auth magic link/OTP tokens — auto-expire)
   - `userLists` (user's saved lists)
   - `publishedLists` (community published lists index)

### 3. Get Table Storage Connection String ⏳ TODO

1. In `thirdplacesdata` storage account
2. Go to **Access keys** in left sidebar
3. Copy **Connection string** from key1
4. Save as `AZURE_TABLE_STORAGE_CONNECTION_STRING` in `.env`

### 4. Add Environment Variables Locally ⏳ TODO

Add the following environment variables to your local `.env` file (which is git-ignored and never committed):

| Variable | Where to Get It |
|----------|----------------|
| `BETTER_AUTH_SECRET` | Generate a random 32+ character string |
| `BETTER_AUTH_URL` | Set to `http://localhost:3000` for local development |
| `AZURE_ACS_CONNECTION_STRING` | From Step 1 (Azure Communication Services → Keys) |
| `AZURE_ACS_SENDER_ADDRESS` | The verified sender email from Step 1 |
| `AZURE_TABLE_STORAGE_CONNECTION_STRING` | From Step 3 (Storage Account → Access keys) |

### 5. Add Environment Variables to Vercel ⏳ TODO

1. Go to [Vercel Dashboard](https://vercel.com/) → Charlotte Third Places project
2. Navigate to **Settings → Environment Variables**
3. Add the same five environment variables from Step 4, with these production differences:
   - `BETTER_AUTH_URL` → set to `https://www.charlottethirdplaces.com`
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

### 10. Get Admin User ID ⏳ TODO

1. After deploying, sign in with your email via magic link
2. Query `user` table for your email
3. Save your `userId` for admin checks

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
      ListPicker.test.tsx
      ListsPage.test.tsx
      Navigation.test.tsx
      UserMenu.test.tsx
      AuthDialog.test.tsx
    contexts/
      AuthContext.test.tsx
      ListsContext.test.tsx
    lib/
      lists-service.test.ts
      offline-queue.test.ts
      table-storage.test.ts
  e2e/
    auth-flow.spec.ts
    save-place.spec.ts
    lists-page.spec.ts
    community-feed.spec.ts
    account-deletion.spec.ts
```

### Unit Tests

| Test File | Coverage |
|-----------|----------|
| `SaveButton.test.tsx` | Renders bookmark icon, opens drawer/sheet, shows login prompt when unauthenticated, displays filled icon when place is saved |
| `ListPicker.test.tsx` | Checkbox toggles work, notes input accepts text, save/cancel actions, loading states |
| `ListsPage.test.tsx` | Tabs render for each list, places display correctly, empty states, delete from list |
| `Navigation.test.tsx` | Shows correct nav items based on auth state |
| `UserMenu.test.tsx` | Email displays, dropdown opens, sign out works |
| `AuthDialog.test.tsx` | Email input validation, OTP code entry, loading states, error handling |
| `AuthContext.test.tsx` | Auth state management, login/logout flows, session persistence |
| `ListsContext.test.tsx` | Lists CRUD operations, optimistic updates, error states |
| `lists-service.test.ts` | API calls, error handling, retry logic |
| `offline-queue.test.ts` | Queue persistence, retry behavior, conflict resolution |
| `table-storage.test.ts` | CRUD operations, error handling |

### E2E Tests (Playwright)

| Test File | Coverage |
|-----------|----------|
| `auth-flow.spec.ts` | Magic link/OTP login, session persistence across pages, logout clears session |
| `save-place.spec.ts` | Save to Favorites, appears in /lists, update note, remove from list |
| `lists-page.spec.ts` | Navigate tabs, create custom list, delete custom list, rename list |
| `community-feed.spec.ts` | Publish list, appears in community, unpublish removes it |
| `account-deletion.spec.ts` | Delete account, all data removed, can't sign in |

### API Route Tests

| Route | Test Cases |
|-------|------------|
| `GET /api/lists` | Returns empty array for new user, returns all lists, rejects unauthenticated |
| `POST /api/lists` | Creates custom list, enforces 5 list limit, validates name length |
| `POST /api/lists/[listId]/places` | Adds place, prevents duplicates, enforces 100 place limit |
| `DELETE /api/lists/[listId]` | Deletes custom list, cannot delete default list |
| `POST /api/lists/[listId]/publish` | Adds to publishedLists, updates isPublic |
| `GET /api/community/lists` | Returns paginated results, sorted newest first |
| `DELETE /api/user` | Cascade deletes all user data |

### Mocking Strategy

| Dependency | Mock Approach |
|------------|---------------|
| Azure Table Storage | Mock `TableClient` with in-memory Map |
| Better Auth | Mock `auth.api.getSession()` to return test user |
| Azure Communication Services | Mock email sending, verify correct recipient/content |
| localStorage | Use jsdom's built-in localStorage |
| Network | Use [MSW (Mock Service Worker)](https://mswjs.io/) for API mocking in E2E |

### Critical Path Tests

These tests must pass before every deploy:

1. ✅ Unauthenticated user can browse places
2. ✅ Email sign-in flow completes successfully
3. ✅ Session persists across page navigation
4. ✅ Authenticated user can save place to Favorites
5. ✅ Saved place appears in /lists
6. ✅ User can remove place from list
7. ✅ User can export all data as JSON
8. ✅ Account deletion removes all user data
9. ✅ Published list appears in community feed
10. ✅ Unpublished list removed from community feed

---

## Privacy & Compliance

### Data We Store

| Data | Purpose | Retention |
|------|---------|-----------|
| Email | Authentication, unique identifier | Until account deletion |
| Session token | Maintaining login state | Until sign-out or account deletion |
| Saved places | Core feature | Until account deletion |
| Notes | User-created content on saved places | Until account deletion |

### Data We Don't Store

- ❌ Passwords (magic link only)
- ❌ Names (not collected)
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
| Azure Table Storage | ~$0.03 | Storage + transactions for ~100 users |
| Azure Communication Services | $0 | Free tier: 100 emails/day |
| Vercel | $0 | Hobby plan sufficient |
| Termly | ~$10/month | Paid plan — auto-updates, cookie consent banner |
| **Total** | **~$10/month** | |

### At Scale (1,000 users)

| Service | Estimated Cost |
|---------|---------------|
| Azure Table Storage | ~$0.30/month |
| Azure Communication Services | ~$0.25/month (beyond free tier) |
| Vercel | $0–20/month (depends on traffic) |
| Termly | ~$10/month |
| **Total** | **$10–30/month** |

### At Scale (10,000 users)

| Service | Estimated Cost |
|---------|---------------|
| Azure Table Storage | ~$3/month |
| Azure Communication Services | ~$2.50/month |
| Vercel | $20/month (Pro plan) |
| Termly | $10/month |
| **Total** | **~$35/month** |

All costs covered by existing $150/month Azure credits.

---

## Appendix: Environment Variables

### Required

The following environment variables are needed in both local `.env` and Vercel:

| Variable | Description |
|----------|-------------|
| `BETTER_AUTH_SECRET` | Random 32+ character string for signing session tokens |
| `BETTER_AUTH_URL` | Site URL — production domain or `http://localhost:3000` for dev |
| `AZURE_ACS_CONNECTION_STRING` | From Azure Portal → Communication Services → Keys |
| `AZURE_ACS_SENDER_ADDRESS` | Verified sender email address for magic link emails |
| `AZURE_TABLE_STORAGE_CONNECTION_STRING` | From Azure Portal → Storage Account → Access keys |

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
  notes: string;
  addedAt: string;           // ISO timestamp
}

export interface UserList {
  id: string;                // RowKey: favorites | to-visit | visited | custom_{uuid}
  userId: string;
  name: string;
  description: string;
  placeEntries: PlaceEntry[];
  isDefaultList: boolean;
  isPublic: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublishedList {
  listId: string;
  userId: string;            // For internal lookup only, NOT displayed publicly
  name: string;
  description: string;
  placeCount: number;
  previewPlaceIds: string[];
  publishedAt: string;
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
          places/
            route.ts         # POST add place
            [placeId]/
              route.ts       # PATCH note, DELETE place
          publish/
            route.ts         # POST publish
          unpublish/
            route.ts         # POST unpublish
      community/
        lists/
          route.ts           # GET feed
          [userId]/
            [listId]/
              route.ts       # GET public list
      curator/
        lists/
          route.ts           # GET curator lists
      user/
        route.ts             # DELETE account
        export/
          route.ts           # GET data export
    lists/
      page.tsx               # Lists page
    community/
      page.tsx               # Community feed
    privacy/
      page.tsx               # Privacy Policy (Termly embed)
    cookies/
      page.tsx               # Cookie Policy (Termly embed)
    terms/
      page.tsx               # Terms and Conditions (Termly embed)
    settings/
      page.tsx               # Account settings
  components/
    SaveButton.tsx
    ListPicker.tsx
    ListCard.tsx
    PublishListDialog.tsx
    CreateListDialog.tsx
    AuthDialog.tsx           # Email input → magic link/code entry
    UserMenu.tsx
  contexts/
    AuthContext.tsx
    ListsContext.tsx
  lib/
    auth.ts                  # Better Auth server config (magic link + email OTP)
    auth-client.ts           # Better Auth client
    constants.ts             # List limits, feature flags, session config
    email.ts                 # Azure Communication Services email sender
    table-storage.ts         # Azure Table Storage client
    lists-service.ts         # User lists API service
    curator-lists-service.ts # Curator lists from Airtable (always hits real API)
    lists/
      offline-queue.ts
      types.ts
```

---

## Appendix: Maintenance Calendar

| Task | Frequency | Notes |
|------|-----------|-------|
| Review Termly policies | Annually | Paid plan auto-updates, but review for accuracy |
| Review ACS email sender domain | Annually | Ensure domain verification is still valid |
| Review Azure Table Storage costs | Quarterly | Should stay under $0.10/month |
| Review user data for cleanup | Annually | Remove orphaned data if needed |

---

## Appendix: Future Roadmap

### OAuth Sign-In (Deferred)

OAuth (Google, Microsoft, Apple) can be added later as an optional enhancement. Better Auth supports [adding social providers](https://www.better-auth.com/docs/concepts/oauth) alongside magic link, so authenticated users could link a social account to their existing email-based account. This is not needed for launch but could improve UX for users who prefer one-click sign-in.
