# Contributing to ThoughtsPlus

Thanks for your interest in contributing to ThoughtsPlus! This guide explains how to report issues, propose changes, and set up a local dev environment.

## Before you start

- Read the project overview and README to understand scope and constraints.
- This project is **source-available**, not open source. Contributions are accepted, but use is governed by `LICENSE`.
- Check existing issues before starting work; for larger changes, open an issue first to align on scope.

## Ways to contribute

- **Bug reports** (most helpful): use the bug report template and include clear repro steps.
- **Feature requests**: describe the problem, the desired outcome, and alternatives considered.
- **Docs and UI polish**: clarity, copy, and consistency improvements are welcome.
- **Code contributions**: please keep PRs focused and small when possible.

## Reporting bugs

Use the issue template in `.github/ISSUE_TEMPLATE/bug_report.md` and include:

- OS and app version
- Exact steps to reproduce
- Expected vs. actual behavior
- Screenshots or short clips if UI-related

## Development setup

Prerequisites:

- Node.js 18+
- npm

Setup:

```bash
npm install
npm run dev
```

Notes:

- This is an Electron app. Run it via `npm run dev` (not in a browser).
- Dev mode uses an isolated data folder so production data isn't overwritten.

## Testing

Minimum check before opening a PR:

```bash
npx tsc --noEmit
```

Optional:

```bash
npm test
```

## Code style and conventions

- Follow existing patterns in the codebase (TypeScript + React + Tailwind).
- Keep dark mode variants where applicable.
- Prefer `clsx` for conditional class names.
- Use `accentColor` from `useTheme()` instead of hard-coded accent colors.
- Keep IPC changes paired: renderer call + main handler.

## Pull request checklist

- Clear description of **what** and **why**
- Linked issue (if applicable)
- Screenshots/GIFs for UI changes
- Tests run (or rationale if not)
- No secrets or API keys committed
- Documentation updated if behavior or UI changed

## Builds and releases

If you are working on packaging or installers, see `BUILD_INSTRUCTIONS.md`. Please avoid committing build artifacts in PRs.

## Security

If you believe you have found a security issue, please avoid public disclosure. Use GitHub's private security advisory flow if available. If not, open a minimal issue asking for a private follow-up.

## License and contribution terms

By submitting a contribution, you agree that:

- Your contribution is licensed under the same terms as `LICENSE`.
- You assign all rights to the project maintainers as described in `LICENSE`.

---

Thanks again for helping improve ThoughtsPlus!
