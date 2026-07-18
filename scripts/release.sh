#!/bin/bash
# scripts/release.sh
#
# Bumps the project's version (root, backend, frontend, shared package.json),
# rolls the CHANGELOG.md [Unreleased] section into a new dated release section,
# and commits + tags the release locally.
#
# Usage:
#   ./scripts/release.sh patch|minor|major
#   ./scripts/release.sh 1.2.3

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

BUMP_TYPE=${1:-}
if [ -z "$BUMP_TYPE" ]; then
  echo "Usage: ./scripts/release.sh <patch|minor|major|x.y.z>"
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "Working tree is not clean. Commit or stash changes before releasing."
  exit 1
fi

CHANGELOG="doc/CHANGELOG.md"
if ! grep -q "^## \[Unreleased\]$" "$CHANGELOG"; then
  echo "Could not find '## [Unreleased]' in $CHANGELOG — aborting."
  exit 1
fi

CURRENT_VERSION="$(node -p "require('./package.json').version")"
echo "Current version: $CURRENT_VERSION"

NEW_VERSION="$(npm version "$BUMP_TYPE" --no-git-tag-version --no-commit-hooks | sed 's/^v//')"
echo "New version: $NEW_VERSION"

npm pkg set version="$NEW_VERSION" --workspace=backend
npm pkg set version="$NEW_VERSION" --workspace=frontend
npm pkg set version="$NEW_VERSION" --workspace=shared

npm install --package-lock-only

TODAY="$(date +'%-d %B %Y')"
UNRELEASED_BLOCK="$(mktemp)"
cat > "$UNRELEASED_BLOCK" <<EOF
## [Unreleased]

### Added

### Fixed

### Changed

### Deprecated

### Removed

### Security

## [$NEW_VERSION] $TODAY
EOF

sed -i "/^## \[Unreleased\]\$/{
  r $UNRELEASED_BLOCK
  d
}" "$CHANGELOG"
rm "$UNRELEASED_BLOCK"

git add package.json backend/package.json frontend/package.json shared/package.json package-lock.json "$CHANGELOG"
git commit -m "chore(release): v$NEW_VERSION"
git tag -a "v$NEW_VERSION" -m "v$NEW_VERSION"

echo ""
echo "Released v$NEW_VERSION locally (commit + tag created)."
echo "Push with: git push && git push --tags"
