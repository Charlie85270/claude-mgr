# Plan 11 Amendments — Echelon Host Integration

These amendments document how Plans 05, 07, 08, 09, and 10 are modified now that Echelon (Electron desktop app) is the primary host platform for factor-echelon.

Original plan files are preserved unchanged. This document is additive.

## Plan 05 — Season Runtime

**Original:** Season lifecycle managed via CLI commands and host platform channel posts.
**Amendment:** Season lifecycle runs through `electron/core/season-manager.ts` with IPC channels (`season:spawn`, `season:archive`, `season:restore`). The `src/app/seasons/` UI replaces CLI interaction. Review gates execute via `electron/core/review-gate-runner.ts` and display on the `ReviewGateBoard` component.

## Plan 06 — Knowledge Base

**Original:** KB interface with pluggable backends (mempalace, git-mirror).
**Amendment:** mempalace is the single KB backend, accessed through `electron/services/kb-bridge.ts` → `electron/services/mempalace-client.ts`. The memory dashboard at `src/app/memory/` is retitled "Knowledge Base" and wired to `kb:*` IPC channels.

## Plan 07 — OOBE & Ingestion

**Original:** OOBE state machine runs as CLI prompts.
**Amendment:** OOBE runs in `src/app/seasons/new/` as an in-app wizard. The state machine from `build/oobe/state-machine.ts` is invoked via IPC. Theme selection, tier picking, PRD drop, and roster preview all happen in the Electron renderer.

## Plan 08 — Counselor

**Original:** API keys provisioned via environment variables or CLI config.
**Amendment:** API keys stored via Electron `safeStorage` API (macOS Keychain-backed). Configured in `src/app/settings/counselor/` page. Counselor invocations route through `electron/services/counselor-service.ts` with IPC channel `counselor:invoke`.

## Plan 09 — User Intervention

**Original:** CLI commands for cancel, override, rerun, season, character, kb, counselor, uninstall.
**Amendment:** CLI commands become IPC handlers + tray menu items + Telegram/Slack bot commands. The existing Dorothy Telegram (`electron/services/telegram-bot.ts`) and Slack (`electron/services/slack-bot.ts`) integrations carry intervention commands. Tray panel shows season status and quick actions.

## Plan 10 — Integration & Release

**Original:** Release produces skill bundles for Claude Code and OpenClaw.
**Amendment:** Release also produces `Echelon.app` via electron-builder. The CI workflow at `.github/workflows/pr.yml` runs 3 parallel jobs: skill build matrix, Vitest, electron-builder dry-run. The release runbook at `docs/release/release-runbook.md` is extended with Echelon.app signing and notarization steps.
