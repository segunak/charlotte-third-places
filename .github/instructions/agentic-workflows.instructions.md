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

Every gh-aw workflow source file should use an explicit high-effort Opus model through the Copilot engine unless the user explicitly chooses another model:

```yaml
# Docs: https://github.github.com/gh-aw/reference/model-tables/#model-aliases
# Docs: https://github.github.com/gh-aw/specs/model-alias-specification/#61-effort
engine:
  id: copilot
  model: "opus?effort=high"
```

If the user asks for GPT instead, research the current GitHub Agentic Workflows model alias docs before choosing the model string, use the latest documented GPT alias available through the Copilot gateway with `?effort=high`, and tell the user the exact `engine.id` and `engine.model` being used. If the model preference is ambiguous, ask whether to use Opus high-effort or the latest documented GPT high-effort model. Default to Opus high-effort.

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
