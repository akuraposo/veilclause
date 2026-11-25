# VeilClause — Design Document (#BuildHybridAI 2026)

## 1. Intent & Why
Freelancers, small businesses, and HR/legal teams routinely want AI to audit contracts, NDAs, and offer letters, yet pasting raw documents into cloud AI leaks sensitive PII (names, national IDs, bank accounts, salaries, addresses).

**VeilClause** solves this with **Firebase AI Logic Hybrid Inference** on Web (Chrome):
- **On-Device AI (Gemini Nano via `ONLY_ON_DEVICE` / `PREFER_ON_DEVICE`)** acts as a local **Privacy Firewall** that detects and masks PII strictly inside the browser, and powers instant offline summaries and quick clause Q&A.
- **Cloud AI (Gemini 3 Flash via `ONLY_IN_CLOUD` + Remote Config)** receives *only the redacted payload* to perform deep legal risk scoring (Structured JSON), identify predatory clauses, and draft balanced redline rewrites.
- **Local Re-hydration** restores original entity names inside the browser so the user gets an actionable final contract without raw PII ever touching the cloud.

## 2. Architecture & Approaches Considered
- **Selected (Option A): Vite + React + TypeScript SPA + Firebase AI Logic Web SDK**
  - Zero custom backend; direct client-side `firebase/ai` with `GoogleAIBackend`, `InferenceMode`, Firebase App Check (`useLimitedUseAppCheckTokens: true`), and Firebase Remote Config for dynamic cloud model selection (`gemini-3-flash-preview`).
  - Reinforces zero-retention privacy: raw documents stay in browser memory.
- **Rejected (Option B): Next.js Full-Stack + Firestore + Auth**
  - Adds server/DB complexity unrelated to hybrid inference judging criteria and weakens the zero-retention local privacy story.

## 3. Hybrid Inference Routing Matrix
| Feature | Inference Mode | Purpose | Data Sent to Cloud |
| :--- | :--- | :--- | :--- |
| **PII Shield & Redaction** | `ONLY_ON_DEVICE` (+ local deterministic guard) | Detect & tokenize PII locally | **None (0 bytes)** |
| **Quick Clause Summary & Q&A** | `PREFER_ON_DEVICE` | Offline-capable instant triage; falls back to cloud only if local model unavailable | Redacted text only if fallback |
| **Deep Contract Risk Audit** | `ONLY_IN_CLOUD` (Structured JSON Schema) | Risk score, flagged clauses, severity, redline rewrites | **Redacted text only** |
| **Scanned Contract Analysis** | `ONLY_IN_CLOUD` (Multimodal inlineData) | Analyze uploaded contract image/PDF with explicit user consent | Uploaded media |

## 4. Visual Design System
- **Aesthetic**: Modern legal-tech editorial workbench (archival redaction bars + crisp paper surface).
- **Palette**:
  - Desk `#F7F8FA`, Document Sheet `#FFFFFF`, Ink `#141B29`, Muted `#526075`
  - On-Device Local Teal `#0F766E`, Cloud Cobalt `#2563EB`, High-Risk Redline `#B91C1C`, Redaction Charcoal `#1E293B`
- **Typography**: `Source Serif 4` (document prose & headings), `Plus Jakarta Sans` (UI controls), `JetBrains Mono` (redaction tokens & inference telemetry).

## 5. Security & Production Readiness
- Firebase App Check with `ReCaptchaEnterpriseProvider` and `useLimitedUseAppCheckTokens: true`.
- Debug token loaded strictly from gitignored `.env.local` (`VITE_APP_CHECK_DEBUG_TOKEN`), never hardcoded.
- Cloud model name fetched via Firebase Remote Config with safe default `gemini-3-flash-preview`.
