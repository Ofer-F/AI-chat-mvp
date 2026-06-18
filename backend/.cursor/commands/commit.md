# Commit

Create a git commit for the current changes, following this repository's commit message style.

Steps:

1. Run `git status` and `git diff` (and `git diff --staged`) to review what has changed.
2. If nothing is staged, stage the relevant changed files with `git add`. Do not stage files that look like secrets (`.env`, credentials, etc.).
3. Write the commit message strictly following the rules in `.cursor/rules/commit-style.mdc`:
   - Format: `<file/topic>: <verb> <description>.`
   - Lowercase verb (add, fix, update, remove, extend, rename, move, refactor).
   - Max 72 characters in the subject line, always ending with a period.
   - Subject only by default; add a body only if something is non-obvious.
   - For brand-new files/modules, use `<topic>: initial commit.`
4. Commit using a HEREDOC to preserve formatting:

   ```bash
   git commit -m "$(cat <<'EOF'
   <topic>: <verb> <description>.
   EOF
   )"
   ```

5. Run `git status` afterward to confirm the commit succeeded.

If there are multiple unrelated changes, propose splitting them into separate commits, each with its own styled message, before committing.
