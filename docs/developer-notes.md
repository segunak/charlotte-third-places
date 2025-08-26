
# Developer Notes

A scratch pad for various notes related to this project.

## Next.js

The front end us Next.js deployed to Vercel (Hobby Tier) with `shadcn/ui` for styling.

- To run locally with no Incremental Static Regeneration (a local CSV file will be used, no real interaction with Airtable) `cd` into the `charlotte-third-places` directory and run `npm run dev`. Prefer this nearly always, there should only ever be very specific reasons to run live against prod data.
- To run locally with Incremental Static Regeneration and thus mirror production (visits will cache and be revalidated according to the set time) `cd` into `charlotte-third-places` and run `npm run build; npm start`.

**Or, simply use the `launch.json` file which has the above commands baked in as configurations**

## Random Information

- When using Python's logging module pass `exc_info=True` to get the stack trace.

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
