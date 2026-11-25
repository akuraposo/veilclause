# VeilClause (#BuildHybridAI 2026)

VeilClause is a browser-based contract review tool built with Firebase AI Logic hybrid inference. It uses Gemini Nano in Chrome to strip personal data locally before sending the redacted document to Gemini 3 Flash in the cloud for risk analysis and redline suggestions.

## Why run this hybrid?

People paste contracts and offer letters into cloud AI tools all the time, even though those files contain names, Tax IDs or NIKs, bank account numbers, salaries, and home addresses. VeilClause keeps that data in the browser while still using a larger cloud model for legal review:

| Feature | Firebase AI Logic Mode | Where it runs | Sent to cloud |
| :--- | :--- | :--- | :--- |
| Local PII Privacy Firewall | `InferenceMode.ONLY_ON_DEVICE` (+ deterministic local guard) | In Chrome on Gemini Nano | 0 bytes |
| Quick Clause Q&A | `InferenceMode.PREFER_ON_DEVICE` | Local/offline when available; cloud fallback if not | Redacted text only |
| Deep Risk Audit & Redlines | `InferenceMode.ONLY_IN_CLOUD` (Structured JSON + Multimodal) | Cloud Gemini 3.5 (`gemini-3.5-flash-lite` via Remote Config) | Redacted payload only |
| Local Re-hydration | In-browser string restoration | Browser memory only | 0 bytes |

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Provision Firebase AI Logic (Required for Live Mode)
```bash
npx -y firebase-tools@latest login
npx -y firebase-tools@latest use --add
npx -y firebase-tools@latest init ailogic
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local` and fill in your Firebase Web App config and App Check keys:
```bash
cp .env.example .env.local
```
> Security note: do not hardcode or commit `VITE_APP_CHECK_DEBUG_TOKEN`. Keep `.env.local` gitignored and register your debug token under Firebase Console > App Check > Manage debug tokens.

### 4. Enable Gemini Nano in Chrome (Desktop 139+)
1. Open `chrome://flags/#optimization-guide-on-device-model` and set it to `Enabled BypassPerfRequirement`.
2. Open `chrome://flags/#prompt-api-for-gemini-nano` and set it to `Enabled`.
3. Relaunch Chrome and check `chrome://on-device-internals` to confirm the model is ready.

### 5. Run & Deploy
```bash
npm run dev
npm run build
npx -y firebase-tools@latest deploy --only hosting
```
