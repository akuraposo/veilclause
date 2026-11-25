import { X, CheckCircle2, AlertTriangle, Terminal } from "lucide-react";
import type { DeviceCapabilities } from "../types/hybrid";

interface SetupModalProps {
  open: boolean;
  onClose: () => void;
  capabilities: DeviceCapabilities;
}

export function SetupModal({ open, onClose, capabilities }: SetupModalProps) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <h2 className="pane-title" style={{ fontSize: "1.2rem" }}>
            Hybrid AI Runtime & Firebase Setup
          </h2>
          <button
            className="btn btn-outline"
            style={{ padding: "5px 8px" }}
            onClick={onClose}
            aria-label="Close setup modal"
          >
            <X size={16} />
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 18,
          }}
        >
          <div className="entity-row">
            <div>
              <div style={{ fontSize: "0.78rem", color: "var(--ink-muted)" }}>
                Chrome Gemini Nano
              </div>
              <div style={{ fontWeight: 600, fontSize: "0.86rem" }}>
                {capabilities.chromeNanoStatus}
              </div>
            </div>
            {capabilities.chromeNanoStatus === "available" ? (
              <CheckCircle2 size={18} color="var(--local-teal)" />
            ) : (
              <AlertTriangle size={18} color="var(--risk-medium)" />
            )}
          </div>

          <div className="entity-row">
            <div>
              <div style={{ fontSize: "0.78rem", color: "var(--ink-muted)" }}>
                Firebase AI Logic
              </div>
              <div style={{ fontWeight: 600, fontSize: "0.86rem" }}>
                {capabilities.firebaseConfigured
                  ? `Connected (${capabilities.activeCloudModel})`
                  : "Demo Mode (add .env.local)"}
              </div>
            </div>
            {capabilities.firebaseConfigured ? (
              <CheckCircle2 size={18} color="var(--cloud-cobalt)" />
            ) : (
              <AlertTriangle size={18} color="var(--risk-medium)" />
            )}
          </div>
        </div>

        <h3 style={{ fontSize: "0.92rem", margin: "0 0 6px" }}>
          1. Provision Firebase AI Logic & App Check
        </h3>
        <p style={{ fontSize: "0.82rem", color: "var(--ink-secondary)", margin: "0 0 6px" }}>
          Run the Firebase CLI inside the project folder to enable the Gemini Developer API and link your Firebase project:
        </p>
        <pre className="code-block">
{`npx -y firebase-tools@latest login
npx -y firebase-tools@latest init ailogic`}
        </pre>

        <h3 style={{ fontSize: "0.92rem", margin: "0 0 6px" }}>
          2. Configure .env.local (never commit debug tokens)
        </h3>
        <pre className="code-block">
{`VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_RECAPTCHA_ENTERPRISE_SITE_KEY=your_recaptcha_key
VITE_APP_CHECK_DEBUG_TOKEN=your_registered_debug_uuid`}
        </pre>

        <h3 style={{ fontSize: "0.92rem", margin: "0 0 6px" }}>
          3. Enable On-Device Gemini Nano in Chrome (Desktop 139+)
        </h3>
        <p style={{ fontSize: "0.82rem", color: "var(--ink-secondary)", margin: "0 0 6px" }}>
          Open these Chrome flags, enable them, relaunch Chrome, and verify model download in <code>chrome://on-device-internals</code>:
        </p>
        <pre className="code-block">
{`chrome://flags/#optimization-guide-on-device-model  -> Enabled BypassPerfRequirement
chrome://flags/#prompt-api-for-gemini-nano          -> Enabled`}
        </pre>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 12,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: "0.78rem",
              color: "var(--ink-muted)",
            }}
          >
            <Terminal size={14} /> Remote Config key: <code>cloud_model_name</code>
          </span>
          <button className="btn btn-local" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
