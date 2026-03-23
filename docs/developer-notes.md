
# Developer Notes

A scratch pad for various notes related to this project.

## Next.js

The front end us Next.js deployed to Vercel (Hobby Tier) with `shadcn/ui` for styling.

- To run locally with no Incremental Static Regeneration (a local CSV file will be used, no real interaction with Airtable) `cd` into the `charlotte-third-places` directory and run `npm run dev`. Prefer this nearly always, there should only ever be very specific reasons to run live against prod data.
- To run locally with Incremental Static Regeneration and thus mirror production (visits will cache and be revalidated according to the set time) `cd` into `charlotte-third-places` and run `npm run build; npm start`.

**Or, simply use the `launch.json` file which has the above commands baked in as configurations**

## Random Information

- When using Python's logging module pass `exc_info=True` to get the stack trace.

## Tailwind CSS v4

This project uses Tailwind CSS v4 with the CSS-first configuration approach. Key points:

- **Configuration lives in `styles/globals.css`** — No `tailwind.config.ts` file. Theme values, custom utilities, and variants are defined directly in CSS.
- **`@theme` block** — Defines design tokens (colors, fonts, breakpoints, spacing). Values are evaluated at build time.
- **`@utility` directive** — Creates custom utility classes. Use this instead of `@theme` when you need runtime CSS variable evaluation.
- **`@custom-variant`** — Defines custom variants like dark mode: `@custom-variant dark (&:is(.dark *))`
- **`tw-animate-css`** — Animation library replacing `tailwindcss-animate` for v4 compatibility.

For full documentation, see the [Tailwind CSS v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide).

## Colors

Brand colors.

- Blue
  - Hex: #0092ca
  - HSL: hsl(197, 100%, 39.6%)
- Pinkish
  - Hex: #f21368
  - HSL: hsl(337, 90%, 51%)
- Light Blue
  - Hex: #f5fbff
  - HSL: hsl(197, 100%, 97%)
- Dark Blue
  - Hex: #181b1e
  - HSL: hsl(197, 5%, 10%)

## API Endpoints

### `GET /api/places`

**URL**: <https://www.charlottethirdplaces.com/api/places>

Returns all places on the site as a JSON array. Each element matches the `Place` type defined in `lib/types.ts`. Uses `force-static` rendering, so the response is generated at build time and refreshed when `/api/revalidate` is called.

**Response**: `200 OK` — JSON array of `Place` objects. Date fields (`createdDate`, `lastModifiedDate`) are serialized as ISO 8601 strings.

**Implementation**: `app/api/places/route.ts`

### `GET /api/revalidate`

On-demand ISR revalidation. Requires `Authorization: Bearer {REVALIDATE_TOKEN}` header. Revalidates the entire site including all API routes.

**Implementation**: `app/api/revalidate/route.ts`

### `POST /api/chat`

AI-powered chat endpoint using RAG retrieval against Cosmos DB. See `docs/ai.md` for full documentation.

**Implementation**: `app/api/chat/route.ts`
