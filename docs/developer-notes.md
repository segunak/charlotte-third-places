
# Developer Notes

A scratch pad for various notes related to this project.

## Next.js

The front end us Next.js deployed to Vercel (Hobby Tier) with `shadcn/ui` for styling.

- To run locally with no Incremental Static Regeneration (a local CSV file will be used, no real interaction with Airtable) `cd` into the `charlotte-third-places` directory and run `npm run dev`.
- To run locally with Incremental Static Regeneration and thus mirror production (visits will cache and be revalidated according to the set time) `cd` into `charlotte-third-places` and run `npm run build; npm start`.

**Or, simply use the `launch.json` file which has the above commands baked in as configurations**

## Random Information

- When using Python's logging module pass `exc_info=True` to get the stack trace.

## Place Types

- Bakery  
- Café  
- Coffee Shop  
- Bubble Tea Store  
- Restaurant  
- Market  
- Grocery Store  
- Market Hall  
- Library  
- Bookstore  
- Public Market  
- Game Store  
- Garden  
- Brewery  
- Deli  

## Colors

- Light Color
  - Hex: #0092ca
  - HSL: hsl(197, 100%, 39.6%)
- Dark Color
  - Hex: #f21368
  - HSL: hsl(337, 90%, 51%)

Background: 197 100% 97%
Hex Code: #f5fbff
This is a very light blue color.

Foreground: 197 5% 10%
Hex Code: #181b1e
This is a very dark, almost black color with a hint of blue.
