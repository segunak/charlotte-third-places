# Front End Site: Stuff and Thangs

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server from the `charlotte-third-places` sub folder:

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the live site.

## Testing with Production Data

By default, the application uses local CSV data when running in development mode. If you want to test with production Airtable data while still in development mode:

1. Open the `.env` file in the project root
2. Uncomment or add the line `FORCE_PRODUCTION_DATA=true`
3. Restart the development server:

```powershell
npm run dev
```

To switch back to local CSV data:
1. Either comment out the line with `# FORCE_PRODUCTION_DATA=true`
2. Or set it to false with `FORCE_PRODUCTION_DATA=false`
3. Restart the development server

## More Notes

- Commit changes to the develop branch for a live preview of the site via Vercel. Merge changes into `master` when ready for production.
