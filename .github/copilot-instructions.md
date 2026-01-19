# Copilot Instructions

## Project Overview

* **Name:** Charlotte Third Places
* **Tech Stack:** Next.js, shadcn/ui, Tailwind CSS, TypeScript, React, Vercel for hosting, Azure for Serverless Functions
* **Purpose:** A curated website featuring "third places" (locations other than home or work) in and around Charlotte, North Carolina. Helps users find spots suitable for studying, reading, writing, remote work, relaxing, or socializing.
* **Data Source:** Airtable for production data, local CSV files for development
* **Architecture:** Server-side rendered Next.js app with App Router, component-based UI with shadcn/ui, responsive design

## Code Structure & Architecture

### Directory Structure

* `/charlotte-third-places/` - Main Next.js application directory
* `/app/` - Next.js App Router pages and API routes
* `/components/` - Reusable React components (UI and business logic)
* `/components/ui/` - shadcn/ui components
* `/lib/` - Utility functions, types, and data services
* `/contexts/` - React context providers
* `/hooks/` - Custom React hooks
* `/public/` - Static assets
* `/styles/` - Global CSS and Tailwind configurations

### Key Files

* `lib/data-services.ts` - Handles data fetching from Airtable or local CSV
* `lib/types.ts` - TypeScript type definitions for Place and other data structures
* `lib/utils.ts` - Utility functions (includes shadcn/ui cn helper)
* `styles/globals.css` - Tailwind CSS v4 configuration (CSS-first approach)
* `components.json` - shadcn/ui configuration

### Data Flow

* Production: Airtable → Next.js API routes → ISR (Incremental Static Regeneration)
* Development: Local CSV files → Direct file reads
* Environment variable `FORCE_PRODUCTION_DATA=true` can override development behavior

## Development Guidelines

### Code Style & Standards

* Use TypeScript for all new code
* Follow Next.js App Router patterns
* Prioritize component composition over inheritance
* Use shadcn/ui components as the foundation for UI elements
* Implement responsive design mobile-first with Tailwind CSS
* Use semantic HTML and proper accessibility attributes

### Naming Conventions

* Components: PascalCase (e.g., `PlaceCard.tsx`)
* Functions: camelCase (e.g., `fetchPlaces`)
* Files: kebab-case for pages, PascalCase for components
* CSS classes: Follow Tailwind utility patterns

### State Management

* Use React Context for global state (see `/contexts/`)
* Local component state with useState/useReducer for component-specific data
* Server state handled by Next.js data fetching patterns

## Development Workflow

### Setup & Running


* `npm install` - Install dependencies
* `npm run dev` - Development server (uses local CSV data)
* `npm run build` - Production build
* `npm run start` - Production server
* `npm run lint` - ESLint validation

### Data Sources

* **Development mode**: Uses local CSV files in `/local-data/` directory
* **Production mode**: Fetches from Airtable via API
* **Override**: Set `FORCE_PRODUCTION_DATA=true` in `.env` to use production data in development

### Testing & Quality

* ESLint configuration extends `next/core-web-vitals`
* TypeScript strict mode enabled
* **Testing infrastructure**: See [docs/testing.md](../docs/testing.md) for complete testing guide

#### Test Commands (use these, NOT raw playwright/vitest commands)

| Command | Purpose | Server Handling |
|---------|---------|-----------------|
| `npm run test:unit` | Run unit tests (Vitest) in watch mode | No server needed |
| `npm run test:unit:run` | Run unit tests once and exit | No server needed |
| `npm run test:e2e` | Run E2E tests (Playwright) | **Auto-starts** dev server via `start-server-and-test` |
| `npm test` | Run ALL tests (unit + E2E) | Auto-starts server for E2E portion |

**IMPORTANT**: Always use `npm run test:e2e` for E2E tests—it starts the dev server automatically. Do NOT run `npx playwright test` directly as it requires a running server.

## Technical Specifications

### Styling

* **Primary**: Tailwind CSS v4 with shadcn/ui design system
* **Theme**: Custom theme defined in `styles/globals.css` using CSS-first configuration (`@theme` block)
* **Colors**: Brand colors defined in HSL format (see `/docs/developer-notes.md`)
* **Fonts**: Inter (body), IBM Plex Sans (cards), JetBrains Mono (code)
* **Responsive**: Mobile-first design with custom breakpoints (3xl: 1920px, 4xl: 2560px, etc.)

### Performance

* Next.js ISR for production data caching
* Image optimization with next/image
* WebP format preferred for images
* Vercel Analytics and Speed Insights integrated

### External Integrations

* Google Maps API for location data
* Airtable for content management
* Google Tag Manager for analytics
* Social media platform links (Instagram, TikTok, etc.)

## Communication Style

* Be direct and factual in responses
* Avoid apologetic language or unnecessary agreement
* Focus on practical solutions over enthusiasm
* Question incorrect assumptions with facts
* Avoid hyperbole; maintain professional tone
* Write comments for long-term code clarity, not temporary changes
* Don't announce what you just did - commit messages serve that purpose

## Workflow Notes

* **Development server**: You do not need to run `npm run dev` after changes - the user handles this
* **Working directory**: Always work from the `charlotte-third-places` subdirectory for npm commands
