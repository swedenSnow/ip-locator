# Git Hooks

This directory contains Git hooks to maintain code quality and prevent issues from being committed or pushed.

## Setup

To enable these hooks, run:

```bash
npm run prepare-hooks
```

This configures Git to use the `.githooks` directory instead of the default `.git/hooks`.

## Pre-Commit Hook

Runs automatically before each commit. Performs the following checks on **staged files only**:

1. **ESLint** - Lints all staged `.js`, `.jsx`, `.ts`, `.tsx`, and `.json` files
2. **Jest Tests** - Runs tests for any spec files related to the staged files

If any check fails, the commit is blocked.

## Pre-Push Hook

Runs automatically before pushing to remote. Performs comprehensive checks:

1. **npm audit** - Checks for security vulnerabilities (fails on moderate+ severity)
2. **ESLint** - Lints the entire codebase
3. **Jest Tests** - Runs all tests
4. **TypeScript** - Type checks the entire codebase
5. **Build** - Ensures the project builds successfully

If any check fails, the push is blocked.

## Bypassing Hooks

If you need to bypass hooks in an emergency (not recommended):

```bash
# Skip pre-commit
git commit --no-verify

# Skip pre-push
git push --no-verify
```

## Troubleshooting

If hooks aren't running:

1. Ensure they're executable: `chmod +x .githooks/*`
2. Verify Git config: `git config core.hooksPath` (should show `.githooks`)
3. Re-run setup: `npm run prepare-hooks`
