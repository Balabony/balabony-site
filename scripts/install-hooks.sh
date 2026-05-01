#!/usr/bin/env bash
# Run once after cloning: bash scripts/install-hooks.sh
set -e
HOOK=".git/hooks/pre-commit"
cp scripts/pre-commit "$HOOK"
chmod +x "$HOOK"
echo "✓ pre-commit hook installed"
