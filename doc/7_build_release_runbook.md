# Build & Release Runbook — The Atomic Incident

## 1. Môi trường phát triển
- Yêu cầu Node/npm, package global, thiết lập `.env`.
- Command chuẩn: `npm install`, `npm run dev`, `npm run build`.

## 2. CI/CD Pipeline
- Workflow (lint + test + build + artifact upload).
- Branch strategy (feature → develop → main, release tags).
- Condition deploy (manual trigger, auto deploy staging?).

## 3. Chuẩn bị Release
- Checklist trước merge: test pass, QA sign-off, changelog update, version bump (SemVer).
- Build asset: optimize, hash, upload CDN nếu có.

## 4. Triển khai
- Staging deploy steps, smoke checklist.
- Production deploy steps, rollback plan.

## 5. Analytics & Monitoring
- Verify GA events, error logging (Sentry/LogRocket).
- Metric cần theo dõi sau release (player retention, crash rate).

## 6. Communication
- Thông báo team (Slack/email), release notes, marketing beat.
- Post-release support window (hotfix timeline).

## 7. Backup & Rollback
- Cách lưu artifact cũ, revert commit, disable feature flags.

## 8. Tài liệu tham chiếu
- Link dashboard CI, config hosting, policy bảo mật.
