---
name: Dependabot Alert Repair
on:
  schedule:
    # Monday, Wednesday, and Friday at 5 PM ET during daylight saving time, 21:00 UTC.
    - cron: "0 21 * * 1,3,5"
    # Monday, Wednesday, and Friday at 5 PM ET during standard time, 22:00 UTC.
    # The America/New_York gate below skips whichever UTC run is not currently 5 PM ET.
    - cron: "0 22 * * 1,3,5"
  workflow_dispatch:
    inputs:
      aw_context:
        default: "{}"
        description: "Agent caller context (used internally by Agentic Workflows)."
        required: false
        type: string
permissions:
  contents: read
  copilot-requests: write
  pull-requests: read
  security-events: read
  vulnerability-alerts: read
timeout-minutes: 90
# Docs: https://github.github.com/gh-aw/reference/model-tables/#model-aliases
# Docs: https://github.github.com/gh-aw/specs/model-alias-specification/#61-effort
engine:
  id: copilot
  model: claude-opus-4.8
tools:
  github:
    toolsets: [dependabot, repos, pull_requests]
  bash:
    - "curl:*"
    - "find:*"
    - "gh:*"
    - "git:*"
    - "grep:*"
    - "ls:*"
    - "npm:*"
    - "npx:*"
    - "node:*"
network:
  allowed: [defaults, github, node]
# safe-outputs are gh-aw's controlled write path: the agent asks for a PR, comment,
# issue, or other GitHub action, then a separate permissioned job performs it.
safe-outputs:
  github-token: ${{ secrets.GH_AW_GITHUB_TOKEN }}
  # Do not create automatic failure-report issues for this workflow.
  # Docs: https://github.github.com/gh-aw/reference/safe-outputs/#failure-issue-reporting-report-failure-as-issue
  report-failure-as-issue: false
  create-pull-request:
    title-prefix: "[Dependabot Alert Repair] "
    labels: [dependencies, security]
    base-branch: master
    allowed-base-branches: [master]
    allowed-branches: [automation/dependabot-alert-repair]
    draft: false
    # Do not fall back to creating an issue if PR creation is blocked.
    # Docs: https://github.github.com/gh-aw/reference/safe-outputs-pull-requests/#pull-request-creation-create-pull-request
    fallback-as-issue: false
    max: 1
    max-patch-files: 50
    max-patch-size: 4096
    # This workflow is explicitly designed to update dependency manifests and lockfiles.
    # Keep protected-file review for other protected files, but allow dependency files.
    # Docs: https://github.github.com/gh-aw/reference/safe-outputs-pull-requests/#protected-files
    protected-files:
      policy: request_review
      exclude:
        - package.json
        - package-lock.json
    preserve-branch-name: true
    recreate-ref: true
    allowed-files:
      - web/**
      - mobile/**
      - ios/**
      - .github/workflows/*.yml
      - .github/workflows/*.yaml
  noop:
    max: 1
    report-as-issue: false
---

# Dependabot Alert Repair

You are maintaining `segunak/charlotte-third-places`, a Next.js web app with a separate Expo mobile app.

## Mission

Look at every open Dependabot alert in this repository and try to resolve all of them in one focused pull request.

Do not limit yourself to simple package upgrades. Web and mobile npm alerts are expected to be common here, but the workflow exists so you can reason through any Dependabot ecosystem GitHub reports, including GitHub Actions alerts and dependency fixes that require source or test changes.

## Schedule Gate

This workflow has two UTC cron entries so it can represent Monday, Wednesday, and Friday at 5 PM in New York across daylight saving time and standard time.

If this is a scheduled run, first check the current New York weekday and hour:

```bash
TZ=America/New_York date +%u-%H
```

Only continue when the output is `1-17`, `3-17`, or `5-17`, meaning Monday, Wednesday, or Friday at 5 PM in America/New_York. If it is any other value, stop with a no-op summary.

Manual `workflow_dispatch` runs should skip this time gate and continue immediately.

## Branch Strategy

This repository develops product work on `develop` and promotes to `master` by pull request. Dependabot security repair is different: it must target `master` directly so the PR contains only the dependency repair, not unrelated unreleased `develop` work. After the Dependabot PR merges to `master`, the repository's automerge workflow brings the fix back into `develop`.

Before editing dependencies, work from the latest `origin/master` and use the automation branch name `automation/dependabot-alert-repair`:

```bash
git fetch origin master
git checkout -B automation/dependabot-alert-repair origin/master
```

## Alert Inventory

Use the GitHub Dependabot tools or `gh api` to read all open Dependabot alerts for this repository.

If there are no open Dependabot alerts, stop with a no-op summary. Do not edit files and do not open a pull request.

If there are open alerts, inventory all of them before making changes. Record:

- alert number
- severity
- ecosystem
- package name
- manifest path
- vulnerable range
- first patched version
- advisory summary
- whether the alert appears fixable by dependency update only, dependency update plus source migration, GitHub Actions reference update, or not safely fixable by automation

## Repair Strategy

Fix the root dependency issue for every open alert you can resolve safely.

Use the package manager and manifest that belong to each alert:

- For web npm alerts under `web/package.json` or `web/package-lock.json`, work from `web` and use targeted `npm update <package names>` or `npm install <package>@<patched-version>` as appropriate.
- For mobile npm alerts under `mobile/package.json` or `mobile/package-lock.json`, work from `mobile` and use targeted `npm update <package names>` or `npm install <package>@<patched-version>` as appropriate.
- For GitHub Actions alerts, update only the affected workflow action reference, preserving the existing workflow style.

After choosing a patched dependency version, inspect the affected package usage in `web`, `mobile`, and, when relevant, `ios`. If the secure dependency version requires API, import, configuration, or test updates, make the smallest source or test changes needed to keep the app working. This includes replacing removed APIs, adjusting changed imports, updating initialization/configuration code, and fixing tests that break because of the secure dependency version.

Prefer the smallest dependency update set that clears the alerts. Do not do broad upgrades unless npm cannot resolve the patched versions otherwise. Do not do opportunistic refactors.

## Remediation Discipline

Use a single-track Dependabot remediation mindset.

For each alert, apply the most direct standard fix suggested by Dependabot, the advisory, or the package ecosystem. Prefer the first patched version reported by Dependabot.

Do not invent alternative mitigations, redesign code, refactor unrelated code, improve style, change architecture, modernize dependencies, or make unrelated cleanup changes.

Use this order:

1. Update only the vulnerable dependency to the first patched version or narrowest compatible patched range.
2. Regenerate only the affected lockfile.
3. Run validation.
4. If validation fails because the patched dependency has a documented breaking API, import, configuration, or test behavior change, make the smallest code or test migration required for that patched version.
5. Rerun validation.
6. If the alert still cannot be fixed narrowly, stop and call `noop` with the blocker. Do not attempt a creative workaround.

Source or test changes are allowed only when directly required by the dependency remediation. Every source or test change must be explained in the pull request body as required by a specific alert and patched dependency version.

## Safety Rules

- Do not push to `develop`.
- Do not push to `master`.
- Do not commit secrets or print token values.
- Do not modify `.github/workflows/*.md` agentic workflow source files.
- Do not edit generated `.lock.yml` files by hand.
- Do not delete tests or validation steps to make the repair pass.
- Do not change application behavior unless a dependency repair truly requires it.
- Do not edit source or test files unless the patched dependency version requires a code migration or vulnerable usage removal.
- If an alert cannot be repaired safely, stop without opening a partial or risky PR. Use the safe output `noop` to summarize what blocked the repair.
- If you can repair only some alerts, prefer `noop` over a partial PR unless the unrepaired alerts are clearly unrelated and documented.

## Required Validation

Before requesting a pull request, validate the repaired branch.

Always validate the web app from `web`:

```bash
cd web
npm ci
npm run test:ci
npm run test:e2e
```

If Playwright browser dependencies are missing, install the browser dependencies needed for the test run and rerun the failed command:

```bash
npx playwright install --with-deps chromium
npm run test:e2e
```

If mobile dependency files changed, also validate the mobile app from `mobile`:

```bash
cd mobile
npm ci
npm run lint
```

If the dependency ecosystem you changed has its own lockfile or package-manager validation, run that too.

## Pull Request Requirements

Open one pull request against `master` only after validation passes.

Use this branch name:

```text
automation/dependabot-alert-repair
```

The pull request body must include:

- a table of all Dependabot alerts found
- how each alert was classified: dependency update only, dependency update plus source migration, GitHub Actions reference update, or not safely fixable by automation
- what packages, action references, source files, or test files were changed
- which alerts the change is expected to close
- for every changed source or test file, which Dependabot alert required it, which patched dependency version required it, and why a package-only update was insufficient
- the exact validation commands and whether each passed
- any risks or manual review notes

Use the safe output `create-pull-request` tool for the PR. Dependency manifests and workflow files are protected files, so the PR may include a protected-files review marker. That is fine because the whole point is for Segun to approve the dependency repair after repository policy checks pass.
