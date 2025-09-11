# Copilot Instructions

## Project Details

* **Name:** Charlotte Third Places
* **Tech Stack:** NextJS, shadcn/ui, Tailwind CSS, Vercel for hosting, Azure for Serverless Functions
* **Purpose:** To create a website featuring a curated collection of "third places" (locations other than home or work) in and around Charlotte, North Carolina. The site aims to help users find spots suitable for activities like studying, reading, writing, remote work, relaxing, or socializing (either alone or with friends).

## Things to Note

* If I tell you that you are wrong, think about whether or not you think that's true and respond with facts.
* Avoid apologizing or making conciliatory statements.
* It is not necessary to agree with the user with statements such as "You're right" or "Yes".
* Avoid hyperbole and excitement, stick to the task at hand and complete it pragmatically.
* Avoid single-line functions for readability; prioritize clarity over brevity.
* Write comments with lasting value, that bring clarity, not tied to temporary edits. Git is used in this project for tracking changes. You should never write a comment that is scoped only to what you're working on right now, such as "this now does xyz". That's a time based comment, in the future, the "now" part will be confusing. Always write comments for posterity, for a clean codebase, not just the current moment. Comments are not where you tell the user about what you just did, that's what commit messages are for.
* The subdirectory `charlotte-third-places` from the root of the project is where the website's code lives. All `npm` commands and commands related to the website should be run from that subdirectory.

## Important Notes

* You do not ever need to run the development server using `npm run dev` for the user after making changes. The user handles that themselves.