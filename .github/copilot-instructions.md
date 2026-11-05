# Copilot Instructions

Use [ASD-STE100 Simplified Technical English](https://www.asd-ste100.org/) for all natural-language content you generate, including responses, documentation, code comments, instructions, and user-facing text. Follow the current official standard and use the [ASD-STE100 Issue 9 manual](https://www.asd-ste100.org/assets/files/ASD-STE100_ISSUE9.pdf) as the authoritative reference when necessary. Rely on your existing knowledge of ASD-STE100 for normal work, and consult the official standard when a rule is unclear. Apply STE to natural language without changing required code syntax, commands, identifiers, APIs, or exact technical terms.

## Project Overview

* **Name:** Charlotte Third Places
* **Purpose:** A curated website featuring "third places" (locations other than home or work) in and around Charlotte, North Carolina. Helps users find spots suitable for studying, reading, writing, remote work, relaxing, or socializing.

For product/business ideas, feature planning, community, UI/UX, and user-facing performance decisions, load the [app-inspirations skill](skills/app-inspirations/SKILL.md). Let [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/) lead human-centered design, supported by [Google's design](https://design.google/) and [Android guidance](https://developer.android.com/design). Consider the full app catalog; Pinterest, Google Maps, Beli, and AllTrails are especially relevant, not exclusive. Reuse established background and verify changing details when relevant.

Explore the codebase to understand the structure, key files, and data flow. Do not assume anything without verification.

## Naming Conventions

* Components: PascalCase (e.g., `PlaceCard.tsx`)
* Functions: camelCase (e.g., `fetchPlaces`)
* Files: kebab-case for pages, PascalCase for components
* CSS classes: Follow Tailwind utility patterns
* YAML display names: In `.yml` and `.yaml` files, use Title Case for human-facing `name` values, workflow names, job names, step names, PR title prefixes, titles, and similar labels unless an external tool requires exact casing.

## Setup & Running

* `npm install` - Install dependencies
* `npm run dev` - Development server
* `npm run build` - Production build
* `npm run start` - Production server
* `npm run lint` - ESLint validation

## Various Notes

* Be direct and factual in responses
* See [docs/testing.md](../docs/testing.md) for complete testing guide
* Avoid apologetic language or unnecessary agreement
* Focus on practical solutions over enthusiasm
* Question incorrect assumptions with facts
* **ALL icons must go through `components/Icons.tsx`.** This keeps icon dependencies centralized, makes swaps trivial, and ensures consistent sizing/styling props across the app.
* For skill prose and metadata descriptions, use commas or separate sentences instead of colons, semicolons, em dashes, or en dashes. Keep required punctuation in metadata syntax, URLs, and code.
* Write comments for long-term code clarity, not temporary changes
* Opt for surgical, concise, and clear code. Code that will last for posterity, aggressively avoid over engineering.
* Brand colors defined in HSL format (see `/docs/developer-notes.md`)
* You do not need to run `npm run dev` after changes - the user handles this
* Never run `npm run build`, `npx next build`, `next build`, or any other production build command when working locally unless the user explicitly asks for a production build for that task
* Always work from the `web` subdirectory for web npm commands
