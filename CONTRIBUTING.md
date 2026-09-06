# Contributing to Hightower Servers

Thanks for wanting to help. This is a small hobby project , issues, bug reports, and pull requests are all welcome.

## Licensing of contributions

By submitting a pull request, you agree that your contribution is licensed under the **GNU Affero General Public License, version 3 or later**, the same license as the rest of the project (inbound = outbound). Don't submit code you don't have the right to relicense this way , in particular, no copy-pasted code from projects under an incompatible license, and no game code or assets from any publisher.

You keep the copyright to your contribution. There is no CLA.

## Ground rules

- **The changelog is mandatory.** Every pull request must add an entry to `doc/CHANGELOG.md` under `## [Unreleased]`, in the right `Added` / `Fixed` / `Changed` section. CI fails the PR otherwise (`.github/workflows/changelog.yml`).
- **Branch off `dev`, not `master`.** `master` only ever receives release merges.
  - `feature/<name>` and `bug-fix/<name>` branches are squash-merged through a GitHub PR.
  - Releases are cut with `./scripts/release.sh start <patch|minor|major>` and closed with `./scripts/release.sh finish`.
- **Tests.** Both sides use Vitest. Run `npm test --workspace=backend` and `npm test --workspace=frontend` before opening a PR, and add tests for service- or store-level logic you change.
- **Types are shared.** Request/response shapes live in `shared/src/*.schema.ts` as zod schemas and are used by both frontend and backend. Change them there, not in one side only, and run `npm run build:shared` afterwards.
- **Never commit secrets.** `.env` is git-ignored; document any new variable in `.env.example` and in the README's configuration table instead of committing a real value.
- **Never commit game images.** `images/*.tar` is git-ignored on purpose , upstream images are pulled from their publishers by `scripts/fetch_all_images.sh`, not redistributed here.

## Adding a game

1. `backend/src/services/games/<game>.service.ts` implementing `IGameService`, with an `image: '<publisher>/<image>:<tag>'` field.
2. Settings schema in `shared/src/`.
3. `./scripts/fetch_all_images.sh` picks up the new image reference automatically.
4. Add the game, its image, and its publisher's EULA/trademark note to the README's **Legal** section , that list has to stay accurate.

## Security issues

Please don't open a public issue for a vulnerability. See [SECURITY.md](SECURITY.md).
