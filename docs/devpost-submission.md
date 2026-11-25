# Devpost Submission Kit: VeilClause (#BuildHybridAI 2026)

## Project Title
VeilClause: Privacy-First Contract Review with On-Device Redaction and Cloud Audit

## Tagline
Redact sensitive PII locally on Gemini Nano, audit the sanitized contract on Cloud Gemini 3, and restore the original names in your browser.

---

## Inspiration
Freelancers and small teams often paste contracts, NDAs, and offer letters straight into cloud AI chats to check for bad terms. Those documents carry real names, Tax IDs or NIKs, bank account numbers, salaries, and street addresses. With cloud-only tools, you either leak private details or skip AI review altogether.

Firebase AI Logic hybrid inference lets us split the job inside one client SDK: run redaction and quick lookups on-device, and send only the sanitized text to the cloud.

## What It Does
1. Local PII redaction (`InferenceMode.ONLY_ON_DEVICE`): Before anything leaves the browser, VeilClause scans the contract with Chrome's built-in Gemini Nano plus a local regex guard. It replaces sensitive fields with placeholders like `[PERSON_1]`, `[ORG_1]`, `[BANK_ACC_1]`, and `[AMOUNT_1]` without making any network call.
2. Cloud payload preview: You can switch between the original draft and the exact redacted payload that will be sent out, toggle individual redactions on or off, or add custom terms to mask.
3. Cloud risk audit (`InferenceMode.ONLY_IN_CLOUD`): Sends only the redacted text (and an optional scanned contract image or PDF via `inlineData`) to Cloud Gemini 3.5 (`gemini-3.5-flash-lite`, fetched through Firebase Remote Config). Using Structured JSON Schema output, the model returns a 0-100 risk score, severity-ranked clauses, replacement wording, and a negotiation checklist.
4. Local re-hydration: One button swaps the real names, bank accounts, and contract amounts back into the redlines inside browser memory so you can copy them directly.
5. Local-first Q&A (`InferenceMode.PREFER_ON_DEVICE`): Answers quick contract questions on Gemini Nano offline when available, and falls back to Cloud Gemini 3 with redacted text on devices without local AI.
6. Split-Brain Telemetry Dock: Logs `result.inferenceSource` (`ON_DEVICE` vs `IN_CLOUD`), latency, number of shielded PII items, and exact bytes sent to the cloud.

## How We Built It
The frontend runs on React 19, TypeScript, and Vite. All AI calls go through the Firebase AI Logic Web SDK (`firebase/ai` v12.6+) using `GoogleAIBackend` across `ONLY_ON_DEVICE`, `PREFER_ON_DEVICE`, and `ONLY_IN_CLOUD` modes, with Structured JSON `Schema` and multimodal file uploads.

For security and configuration, we wired up Firebase App Check (`ReCaptchaEnterpriseProvider`, `useLimitedUseAppCheckTokens: true`, and a gitignored debug token for local development), Firebase Remote Config (`cloud_model_name`), and Firebase Hosting.

## Built With
`firebase`, `firebase-ai-logic`, `gemini-nano`, `gemini-3`, `firebase-app-check`, `firebase-remote-config`, `firebase-hosting`, `react`, `typescript`, `vite`

---

## 2.5-Minute Demo Video Script

- 0:00 to 0:25: Open VeilClause with the Freelance MSA sample loaded. Point out the sensitive fields in the draft: Tax ID, IBAN, $48,500 fee, and street addresses. Explain why pasting raw contracts into a cloud model leaks client and personal data.
- 0:25 to 0:55: Click Shield PII Locally. Show the masked tokens (`[BANK_ACC_1]`, `[AMOUNT_1]`, `[PERSON_2]`) in the Cloud Payload view. Open the Split-Brain Telemetry Dock at the bottom and point to `ONLY_ON_DEVICE`, `ON_DEVICE`, and `0 B (Local)`.
- 0:55 to 1:40: Click Run Cloud Deep Audit. Show the new telemetry row (`ONLY_IN_CLOUD` / `IN_CLOUD` with `gemini-3.5-flash-lite`) while PII stays masked. Walk through the High Risk score, the uncapped liability flag, and the suggested redline. Click Restore Original Details so `[AMOUNT_1]` and `[PERSON_2]` turn back into `$48,500` and `Daniel Pratama`, then click Copy Redline.
- 1:40 to 2:10: Open Quick Ask (Local-First) and click a suggested question to show `PREFER_ON_DEVICE` routing. Switch to the Vendor SLA sample to show it handles different contract types too.
- 2:10 to 2:30: Open the Config modal briefly to show App Check, Remote Config (`cloud_model_name`), and Chrome Gemini Nano status. Wrap up by summarizing how redaction stays local while deep legal review runs in the cloud.
