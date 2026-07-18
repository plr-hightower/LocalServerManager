#!/bin/bash
# scripts/release.sh
#
# GitFlow-style release helper (dev = "develop", master = "main").
#
# start:  cut a release/x.y.z branch off dev, bump version everywhere
#         (root/backend/frontend/shared package.json + lockfile), roll
#         CHANGELOG.md's [Unreleased] section into a dated release section,
#         commit, and push. Only bug fixes / final touches belong on a
#         release branch from here on — no new features.
#
# finish: merge the release branch into master (--no-ff, tagged vX.Y.Z) AND
#         back into dev (--no-ff), matching GitFlow's "release finish", then
#         delete the release branch locally and on origin.
#
# Note: unlike feature/bug-fix branches in this repo (which squash-merge via
# GitHub PR), the release-branch merge here is a direct, real merge commit on
# both sides. That's intentional — GitFlow merges the same release branch into
# master and dev, so squashing would produce divergent commit content on each
# side and cause pain on the next merge between them.
#
# Usage:
#   ./scripts/release.sh start <patch|minor|major|x.y.z>
#   ./scripts/release.sh finish

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

DEVELOP_BRANCH="dev"
MAIN_BRANCH="master"
CHANGELOG="doc/CHANGELOG.md"

require_clean_tree() {
  if [ -n "$(git status --porcelain)" ]; then
    echo "Working tree is not clean. Commit or stash changes first."
    exit 1
  fi
}

compute_bumped_version() {
  local current="$1" bump="$2"
  case "$bump" in
    patch|minor|major) ;;
    *) echo "$bump"; return ;;  # already an explicit x.y.z
  esac

  IFS='.' read -r major minor patch <<< "$current"
  case "$bump" in
    major) echo "$((major + 1)).0.0" ;;
    minor) echo "$major.$((minor + 1)).0" ;;
    patch) echo "$major.$minor.$((patch + 1))" ;;
  esac
}

cmd_start() {
  local bump=${1:-}
  if [ -z "$bump" ]; then
    echo "Usage: ./scripts/release.sh start <patch|minor|major|x.y.z>"
    exit 1
  fi

  require_clean_tree

  git checkout "$DEVELOP_BRANCH"
  git pull

  local current_version new_version release_branch
  current_version="$(node -p "require('./package.json').version")"
  new_version="$(compute_bumped_version "$current_version" "$bump")"
  release_branch="release/$new_version"

  echo "Current version: $current_version -> $new_version"

  git checkout -b "$release_branch"

  npm pkg set version="$new_version"
  npm pkg set version="$new_version" --workspace=backend
  npm pkg set version="$new_version" --workspace=frontend
  npm pkg set version="$new_version" --workspace=shared
  npm install --package-lock-only

  if ! grep -q "^## \[Unreleased\]$" "$CHANGELOG"; then
    echo "Could not find '## [Unreleased]' in $CHANGELOG — aborting."
    exit 1
  fi

  local today block
  today="$(date +'%-d %B %Y')"
  block="$(mktemp)"
  cat > "$block" <<EOF
## [Unreleased]

### Added

### Fixed

### Changed

### Deprecated

### Removed

### Security

## [$new_version] $today
EOF
  sed -i "/^## \[Unreleased\]\$/{
    r $block
    d
  }" "$CHANGELOG"
  rm "$block"

  git add package.json backend/package.json frontend/package.json shared/package.json package-lock.json "$CHANGELOG"
  git commit -m "Release v$new_version"
  git push -u origin "$release_branch"

  echo ""
  echo "Release branch $release_branch created and pushed."
  echo "Stabilize here (bug fixes only, no new features), then run:"
  echo "  ./scripts/release.sh finish"
}

cmd_finish() {
  require_clean_tree

  local release_branch version
  release_branch="$(git branch --show-current)"
  if [[ "$release_branch" != release/* ]]; then
    echo "Not on a release/* branch (currently on '$release_branch')."
    echo "Checkout the release branch first, e.g.: git checkout release/0.1.0"
    exit 1
  fi
  version="${release_branch#release/}"

  git push origin "$release_branch"

  git checkout "$MAIN_BRANCH"
  git pull
  git merge --no-ff "$release_branch" -m "Release v$version"
  git tag -a "v$version" -m "v$version"
  git push origin "$MAIN_BRANCH"
  git push origin "v$version"

  git checkout "$DEVELOP_BRANCH"
  git pull
  git merge --no-ff "$release_branch" -m "Merge release v$version back into $DEVELOP_BRANCH"
  git push origin "$DEVELOP_BRANCH"

  git branch -d "$release_branch"
  git push origin --delete "$release_branch"

  echo ""
  echo "Released v$version: merged into $MAIN_BRANCH (tagged v$version) and back into $DEVELOP_BRANCH."
}

SUBCOMMAND=${1:-}
shift || true

case "$SUBCOMMAND" in
  start) cmd_start "$@" ;;
  finish) cmd_finish "$@" ;;
  *)
    echo "Usage:"
    echo "  ./scripts/release.sh start <patch|minor|major|x.y.z>"
    echo "  ./scripts/release.sh finish"
    exit 1
    ;;
esac
