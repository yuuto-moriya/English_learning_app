#!/bin/bash
set -euo pipefail

# クラウドセッションのときだけ実行する
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# GitHub App のトークンを gh 用に発行（失敗してもセッションは止めない）
node "$CLAUDE_PROJECT_DIR/.claude/hooks/gh-app-token.mjs" || true
