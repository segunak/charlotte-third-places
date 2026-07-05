---
applyTo: ".github/workflows/*.md,.github/workflows/**/*.md"
---

# Agentic Workflows

Follow the GitHub Agentic Workflows documentation as the authority for workflow authentication, permissions, and safe outputs:

- [Authentication](https://github.github.com/gh-aw/reference/auth/)
- [Permissions](https://github.github.com/gh-aw/reference/permissions/)
- [Safe Outputs](https://github.github.com/gh-aw/reference/safe-outputs/)
- [Safe Outputs for Pull Requests](https://github.github.com/gh-aw/reference/safe-outputs-pull-requests/)
- [Triggering CI](https://github.github.com/gh-aw/reference/triggering-ci/)

Safe outputs are gh-aw's controlled write path. The AI agent asks for a GitHub action, such as creating a PR, issue, or comment, and a separate GitHub Actions job performs that write with the configured token. The agent job itself stays read-only.

Every gh-aw workflow source file must include Copilot inference through the GitHub Actions token:

```yaml
permissions:
  contents: read
  copilot-requests: write
```

Every gh-aw workflow source file must include the shared GitHub operations token:

```yaml
safe-outputs:
  github-token: ${{ secrets.GH_AW_GITHUB_TOKEN }}
```

Keep the agent job read-only. Put all GitHub writes behind `safe-outputs:`.

Use draft PRs by default for workflows that create file changes:

```yaml
safe-outputs:
  github-token: ${{ secrets.GH_AW_GITHUB_TOKEN }}
  create-pull-request:
    draft: true
```

Do not design workflows that edit `.github/workflows/` files.

Keep `.github/workflows/<workflow>.md` as the source file and `.github/workflows/<workflow>.lock.yml` as generated output. Never hand-edit lockfiles. Recompile with `gh aw compile <workflow-id>` after frontmatter changes.
