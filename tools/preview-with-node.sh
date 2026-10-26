#!/bin/sh
# 找到可用的 node 后启动预览服务。PATH 没有 node 时回退到用户目录安装、Homebrew、Cursor 自带二进制。
# 用法：sh tools/preview-with-node.sh [--watch|--ensure]
set -e
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
SCRIPT="$ROOT/tools/preview-server.mjs"

pick_node() {
  if command -v node >/dev/null 2>&1; then
    command -v node
    return
  fi
  for candidate in \
    "$HOME/.local/node/bin/node" \
    /opt/homebrew/bin/node \
    /usr/local/bin/node \
    "/Applications/Cursor.app/Contents/Resources/app/resources/helpers/node"
  do
    if [ -x "$candidate" ]; then
      echo "$candidate"
      return
    fi
  done
  echo ""
}

NODE=$(pick_node)
if [ -z "$NODE" ]; then
  echo "[lferp-preview] 找不到 Node.js。请安装 Node，或在 Cursor 中打开本仓库。" >&2
  exit 127
fi

exec "$NODE" "$SCRIPT" "$@"
