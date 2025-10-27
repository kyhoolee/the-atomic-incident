#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

NVMRC_FILE=".nvmrc"
RECOMMENDED_NODE="v14.21.3"

if [[ -f "$NVMRC_FILE" ]]; then
  RECOMMENDED_NODE="$(<"$NVMRC_FILE")"
fi

if [[ -s "$HOME/.nvm/nvm.sh" ]]; then
  # shellcheck disable=SC1090
  source "$HOME/.nvm/nvm.sh"
fi

if command -v nvm >/dev/null 2>&1; then
  echo "Sử dụng nvm để đảm bảo runtime Node cô lập cho repo này..."
  nvm install "$RECOMMENDED_NODE"
  nvm use "$RECOMMENDED_NODE"
elif command -v volta >/dev/null 2>&1; then
  echo "Volta đã được cài. Đảm bảo bạn đã chạy 'volta pin node@${RECOMMENDED_NODE#v}' cho repo này."
else
  echo "[Lưu ý] Không tìm thấy nvm hay volta. Hãy tự đảm bảo bạn đang chạy Node $RECOMMENDED_NODE để tương thích với toolchain cũ." >&2
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js không được tìm thấy. Cài Node $RECOMMENDED_NODE (vd: dùng nvm) rồi chạy lại." >&2
  exit 1
fi

NODE_VERSION="$(node -v)"
NODE_MAJOR="${NODE_VERSION#v}"
NODE_MAJOR="${NODE_MAJOR%%.*}"
if (( NODE_MAJOR < 14 )); then
  echo "[Cảnh báo] Đang dùng Node $NODE_VERSION. Các phụ thuộc (sass, webpack-dev-server) hiện yêu cầu Node >= 14." >&2
fi

if ! grep -q '"typings"' package.json; then
  echo "Cài bổ sung typings CLI để script postinstall chạy thành công..."
  npm install --save-dev typings@2 >/dev/null
fi

if [[ -f package-lock.json ]] && grep -q '"node-sass"' package-lock.json; then
  echo "[Lỗi] package-lock.json vẫn còn tham chiếu node-sass cũ. Xoá package-lock.json và chạy lại script." >&2
  exit 1
fi

if [[ ! -d node_modules ]]; then
  echo "Cài dependencies lần đầu..."
else
  echo "Cập nhật dependencies..."
fi
npm install

echo "Khởi động webpack-dev-server ở chế độ development..."
npm run dev
