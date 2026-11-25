import { useEffect, useMemo, useState } from "react";
import {
  ShieldCheck,
  CloudLightning,
  Cpu,
  Eye,
  EyeOff,
  FileUp,
  Copy,
  Check,
  MessageSquareText,
  SlidersHorizontal,
  WifiOff,
  Lock,
  Plus,
} from "lucide-react";
import { SAMPLE_CONTRACTS } from "./data/sampleContracts";
import { getDeviceCapabilities, DEFAULT_CLOUD_MODEL } from "./lib/firebase";
import { applyRedaction, rehydrateText } from "./lib/piiEngine";
import {
  runOnDevicePiiShield,
  runCloudDeepAudit,
  runHybridQuickAsk,
} from "./lib/hybridAiService";
import { RedactedPreview } from "./components/RedactedPreview";
import { TelemetryDock } from "./components/TelemetryDock";
import { SetupModal } from "./components/SetupModal";
import type {
  AuditReport,
  DeviceCapabilities,
  PiiEntity,
  QuickAnswer,
  TelemetryEvent,
} from "./types/hybrid";

type RightTab = "firewall" | "audit" | "ask";

const QUICK_QUESTIONS = [
  "What are the payment terms and holdback risks?",
  "Can the other party terminate without paying for work done?",
  "Do I lose ownership of my pre-existing code or tools?",
];

export default function App() {
  const [selectedSampleId, setSelectedSampleId] = useState(
    SAMPLE_CONTRACTS[0].id
  );
  const [rawText, setRawText] = useState(SAMPLE_CONTRACTS[0].content);
  const [docView, setDocView] = useState<"original" | "redacted">("original");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const [entities, setEntities] = useState<PiiEntity[]>([]);
  const [customTerm, setCustomTerm] = useState("");
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);
  const [rehydrateOutput, setRehydrateOutput] = useState(false);

  const [activeTab, setActiveTab] = useState<RightTab>("firewall");
  const [questionInput, setQuestionInput] = useState("");
  const [quickAnswers, setQuickAnswers] = useState<QuickAnswer[]>([]);

  const [loadingShield, setLoadingShield] = useState(false);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [loadingAsk, setLoadingAsk] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [telemetry, setTelemetry] = useState<TelemetryEvent[]>([]);
  const [setupOpen, setSetupOpen] = useState(false);
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>({
    firebaseConfigured: false,
    appCheckActive: false,
    chromeNanoStatus: "unavailable",
    activeCloudModel: DEFAULT_CLOUD_MODEL,
    isOnline: true,
  });

  useEffect(() => {
    void getDeviceCapabilities().then(setCapabilities);

    const handleOnline = () =>
      setCapabilities((c) => ({ ...c, isOnline: true }));
    const handleOffline = () =>
      setCapabilities((c) => ({ ...c, isOnline: false }));

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const activeEntities = useMemo(
    () => entities.filter((e) => e.enabled),
    [entities]
  );

  const redactedText = useMemo(
    () => applyRedaction(rawText, entities),
    [rawText, entities]
  );

  function handleSelectSample(id: string) {
    const sample = SAMPLE_CONTRACTS.find((s) => s.id === id);
    if (!sample) return;
    setSelectedSampleId(id);
    setRawText(sample.content);
    setEntities([]);
    setAuditReport(null);
    setQuickAnswers([]);
    setDocView("original");
    setRehydrateOutput(false);
  }

  async function handleShieldPii(): Promise<PiiEntity[]> {
    setLoadingShield(true);
    try {
      const { entities: detected, telemetry: ev } =
        await runOnDevicePiiShield(rawText);
      setEntities(detected);
      setTelemetry((prev) => [ev, ...prev]);
      setDocView("redacted");
      setActiveTab("firewall");
      return detected;
    } finally {
      setLoadingShield(false);
    }
  }

  async function handleRunCloudAudit() {
    setLoadingAudit(true);
    try {
      let currentEntities = entities;
      if (currentEntities.length === 0) {
        const shieldRes = await runOnDevicePiiShield(rawText);
        currentEntities = shieldRes.entities;
        setEntities(currentEntities);
        setTelemetry((prev) => [shieldRes.telemetry, ...prev]);
      }

      const safeText = applyRedaction(rawText, currentEntities);
      const activeCount = currentEntities.filter((e) => e.enabled).length;

      const { report, telemetry: ev } = await runCloudDeepAudit(
        safeText,
        activeCount,
        attachedFile
      );
      setAuditReport(report);
      setTelemetry((prev) => [ev, ...prev]);
      setDocView("redacted");
      setActiveTab("audit");
    } finally {
      setLoadingAudit(false);
    }
  }

  async function handleQuickAsk(promptText?: string) {
    const q = (promptText ?? questionInput).trim();
    if (!q) return;
    setLoadingAsk(true);
    try {
      let currentEntities = entities;
      if (currentEntities.length === 0) {
        const shieldRes = await runOnDevicePiiShield(rawText);
        currentEntities = shieldRes.entities;
        setEntities(currentEntities);
        setTelemetry((prev) => [shieldRes.telemetry, ...prev]);
      }
      const safeText = applyRedaction(rawText, currentEntities);
      const activeCount = currentEntities.filter((e) => e.enabled).length;
      const { answer, telemetry: ev } = await runHybridQuickAsk(
        q,
        safeText,
        activeCount
      );
      setQuickAnswers((prev) => [
        {
          question: q,
          answer,
          inferenceSource: ev.inferenceSource,
          latencyMs: ev.latencyMs,
          timestamp: ev.timestamp,
        },
        ...prev,
      ]);
      setTelemetry((prev) => [ev, ...prev]);
      setQuestionInput("");
      setActiveTab("ask");
    } finally {
      setLoadingAsk(false);
    }
  }

  function handleAddCustomTerm(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = customTerm.trim();
    if (!cleaned) return;
    const nextIdx = entities.length + 1;
    const newEntity: PiiEntity = {
      id: `custom-${Date.now()}`,
      token: `[CUSTOM_${nextIdx}]`,
      original: cleaned,
      category: "PERSON",
      source: "LOCAL_GUARD",
      enabled: true,
    };
    setEntities((prev) => [newEntity, ...prev]);
    setCustomTerm("");
    setDocView("redacted");
  }

  function toggleEntity(id: string) {
    setEntities((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item
      )
    );
  }

  function formatAuditText(text: string): string {
    return rehydrateOutput ? rehydrateText(text, activeEntities) : text;
  }

  async function copyRedline(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(formatAuditText(text));
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1600);
    } catch {
      // Clipboard unavailable
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <ShieldCheck size={19} />
          </div>
          <div>
            <h1 className="brand-title">VeilClause</h1>
            <p className="brand-subtitle">
              Privacy-first contract review with Firebase AI Logic hybrid inference
            </p>
          </div>
        </div>

        <div className="topbar-status">
          {!capabilities.isOnline && (
            <span className="status-pill warn">
              <WifiOff size={14} /> Offline Mode
            </span>
          )}
          <button
            className={`status-pill clickable ${
              capabilities.chromeNanoStatus === "available" ? "local" : "warn"
            }`}
            onClick={() => setSetupOpen(true)}
          >
            <Cpu size={14} />
            On-Device:{" "}
            {capabilities.chromeNanoStatus === "available"
              ? "Gemini Nano Ready"
              : "Local Guard Fallback"}
          </button>
          <button
            className={`status-pill clickable ${
              capabilities.firebaseConfigured ? "cloud" : "warn"
            }`}
            onClick={() => setSetupOpen(true)}
          >
            <CloudLightning size={14} />
            {capabilities.firebaseConfigured
              ? `Cloud: ${capabilities.activeCloudModel}`
              : "Demo Mode — Setup Firebase"}
          </button>
          <button
            className="status-pill clickable"
            onClick={() => setSetupOpen(true)}
            title="Runtime & Firebase AI Logic configuration"
          >
            <SlidersHorizontal size={14} /> Config
          </button>
        </div>
      </header>

      <main className="workbench">
        {/* LEFT PANE: DOCUMENT SHEET */}
        <section className="pane" aria-label="Contract document workspace">
          <div className="pane-header">
            <h2 className="pane-title">Contract Document</h2>
            <div className="view-toggle" role="tablist">
              <button
                className={docView === "original" ? "active" : ""}
                onClick={() => setDocView("original")}
              >
                Original Draft
              </button>
              <button
                className={docView === "redacted" ? "active" : ""}
                onClick={() => setDocView("redacted")}
              >
                Cloud Payload ({activeEntities.length} shielded)
              </button>
            </div>
          </div>

          <div className="sample-strip">
            <span style={{ fontSize: "0.76rem", color: "var(--ink-muted)" }}>
              Samples:
            </span>
            {SAMPLE_CONTRACTS.map((sample) => (
              <button
                key={sample.id}
                className={`sample-chip ${
                  selectedSampleId === sample.id ? "active" : ""
                }`}
                onClick={() => handleSelectSample(sample.id)}
              >
                {sample.tag} — {sample.title}
              </button>
            ))}
          </div>

          <div className="doc-body">
            {docView === "original" ? (
              <textarea
                className="doc-textarea"
                value={rawText}
                onChange={(e) => {
                  setRawText(e.target.value);
                  setSelectedSampleId("custom");
                }}
                placeholder="Paste a contract, NDA, invoice, or offer letter here..."
                aria-label="Original contract text"
              />
            ) : (
              <RedactedPreview
                redactedText={redactedText}
                entities={activeEntities}
              />
            )}

            <div className="file-attach-row">
              <label className="file-label">
                <FileUp size={14} />
                {attachedFile
                  ? `Attached: ${attachedFile.name}`
                  : "Attach scanned contract image/PDF (optional Cloud multimodal)"}
                <input
                  type="file"
                  accept="image/*,.pdf"
                  style={{ display: "none" }}
                  onChange={(e) =>
                    setAttachedFile(e.target.files?.[0] ?? null)
                  }
                />
              </label>
              {attachedFile && (
                <button
                  className="btn btn-outline"
                  style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                  onClick={() => setAttachedFile(null)}
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          <div className="action-bar">
            <button
              className="btn btn-local"
              onClick={handleShieldPii}
              disabled={loadingShield || !rawText.trim()}
            >
              <ShieldCheck size={16} />
              {loadingShield ? "Scanning locally..." : "Shield PII Locally"}
            </button>

            <button
              className="btn btn-cloud"
              onClick={handleRunCloudAudit}
              disabled={loadingAudit || !rawText.trim()}
            >
              <CloudLightning size={16} />
              {loadingAudit
                ? "Auditing redacted payload..."
                : "Run Cloud Deep Audit"}
            </button>
          </div>
        </section>

        {/* RIGHT PANE: HYBRID INTELLIGENCE WORKBENCH */}
        <section className="pane" aria-label="Hybrid AI analysis workbench">
          <div className="tabs" role="tablist">
            <button
              className={`tab-btn ${activeTab === "firewall" ? "active" : ""}`}
              onClick={() => setActiveTab("firewall")}
            >
              <Lock size={15} />
              Privacy Firewall ({activeEntities.length})
            </button>
            <button
              className={`tab-btn ${activeTab === "audit" ? "active" : ""}`}
              onClick={() => setActiveTab("audit")}
            >
              <CloudLightning size={15} />
              Cloud Risk Audit
            </button>
            <button
              className={`tab-btn ${activeTab === "ask" ? "active" : ""}`}
              onClick={() => setActiveTab("ask")}
            >
              <MessageSquareText size={15} />
              Quick Ask (Local-First)
            </button>
          </div>

          <div className="tab-content">
            {activeTab === "firewall" && (
              <>
                <div className="firewall-banner">
                  <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <strong>On-Device Privacy Firewall:</strong> Sensitive names,
                    bank accounts, IDs, emails, and contract values are detected
                    strictly inside your browser using{" "}
                    <code>InferenceMode.ONLY_ON_DEVICE</code> and masked before
                    any cloud call.
                  </div>
                </div>

                <form
                  className="custom-term-form"
                  onSubmit={handleAddCustomTerm}
                >
                  <input
                    className="text-input"
                    value={customTerm}
                    onChange={(e) => setCustomTerm(e.target.value)}
                    placeholder="Add custom sensitive phrase to mask locally..."
                  />
                  <button type="submit" className="btn btn-outline">
                    <Plus size={15} /> Mask
                  </button>
                </form>

                {entities.length === 0 ? (
                  <div className="empty-state">
                    Click <strong>Shield PII Locally</strong> to scan the
                    document on-device and inspect every token that will be
                    masked before cloud analysis.
                  </div>
                ) : (
                  <div className="entity-list">
                    {entities.map((entity) => (
                      <div
                        key={entity.id}
                        className={`entity-row ${
                          entity.enabled ? "" : "disabled"
                        }`}
                      >
                        <div className="entity-left">
                          <input
                            type="checkbox"
                            checked={entity.enabled}
                            onChange={() => toggleEntity(entity.id)}
                            aria-label={`Toggle redaction for ${entity.original}`}
                          />
                          <span className="redaction-bar">{entity.token}</span>
                          <span
                            className="entity-original"
                            title={entity.original}
                          >
                            {entity.original}
                          </span>
                        </div>
                        <div className="entity-meta">
                          <span className="tag">{entity.category}</span>
                          <span className="tag local">
                            {entity.source === "ON_DEVICE_AI"
                              ? "Gemini Nano"
                              : "Local Guard"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === "audit" && (
              <>
                {!auditReport ? (
                  <div className="empty-state">
                    Click <strong>Run Cloud Deep Audit</strong> to send only the
                    redacted contract to Cloud Gemini 3 (
                    <code>InferenceMode.ONLY_IN_CLOUD</code>) for structured JSON
                    risk scoring, predatory clause detection, and balanced
                    redline rewrites.
                  </div>
                ) : (
                  <>
                    <div className="audit-summary-box">
                      <div style={{ flex: 1 }}>
                        <h3
                          className="pane-title"
                          style={{ marginBottom: 6, fontSize: "1rem" }}
                        >
                          Executive Risk Assessment
                        </h3>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "0.86rem",
                            lineHeight: 1.55,
                            color: "var(--ink-secondary)",
                          }}
                        >
                          {formatAuditText(auditReport.executiveSummary)}
                        </p>
                      </div>
                      <div className={`score-badge ${auditReport.riskLevel}`}>
                        <div className="score-num">
                          {auditReport.overallRiskScore}
                        </div>
                        <div className="score-label">
                          {auditReport.riskLevel} RISK
                        </div>
                      </div>
                    </div>

                    <div className="rehydrate-bar">
                      <span>
                        {rehydrateOutput
                          ? "Showing original names & amounts (restored locally in browser)"
                          : "Showing raw cloud response with shielded placeholders"}
                      </span>
                      <button
                        className="btn btn-outline"
                        style={{ padding: "6px 10px", fontSize: "0.78rem" }}
                        onClick={() => setRehydrateOutput((prev) => !prev)}
                      >
                        {rehydrateOutput ? (
                          <>
                            <EyeOff size={14} /> Show Redacted Tokens
                          </>
                        ) : (
                          <>
                            <Eye size={14} /> Restore Original Details
                          </>
                        )}
                      </button>
                    </div>

                    {auditReport.clauses.map((clause) => (
                      <article key={clause.id} className="clause-card">
                        <div className="clause-header">
                          <h4 className="clause-title">
                            {clause.title}{" "}
                            <span
                              style={{
                                fontWeight: 400,
                                color: "var(--ink-muted)",
                                fontSize: "0.8rem",
                              }}
                            >
                              ({clause.category})
                            </span>
                          </h4>
                          <span className={`sev-pill ${clause.severity}`}>
                            {clause.severity}
                          </span>
                        </div>
                        <div className="clause-body">
                          <div className="clause-excerpt">
                            "{formatAuditText(clause.excerpt)}"
                          </div>
                          <div>{formatAuditText(clause.explanation)}</div>
                          <div className="clause-redline">
                            <div className="clause-redline-head">
                              <span>Suggested Balanced Redline</span>
                              <button
                                className="btn btn-outline"
                                style={{
                                  padding: "3px 8px",
                                  fontSize: "0.74rem",
                                }}
                                onClick={() =>
                                  copyRedline(
                                    clause.id,
                                    clause.redlineSuggestion
                                  )
                                }
                              >
                                {copiedId === clause.id ? (
                                  <>
                                    <Check size={13} /> Copied
                                  </>
                                ) : (
                                  <>
                                    <Copy size={13} /> Copy Redline
                                  </>
                                )}
                              </button>
                            </div>
                            <div style={{ fontFamily: "var(--font-serif)" }}>
                              {formatAuditText(clause.redlineSuggestion)}
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}

                    <div className="clause-card">
                      <div className="clause-header">
                        <h4 className="clause-title">Negotiation Checklist</h4>
                      </div>
                      <div className="clause-body">
                        <ul className="checklist">
                          {auditReport.negotiationChecklist.map((item, idx) => (
                            <li key={idx}>{formatAuditText(item)}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {activeTab === "ask" && (
              <>
                <div className="firewall-banner">
                  <Cpu size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <strong>Local-First Hybrid Q&A:</strong> Uses{" "}
                    <code>InferenceMode.PREFER_ON_DEVICE</code> to answer quick
                    contract questions offline on Gemini Nano with zero API
                    cost, seamlessly falling back to Cloud Gemini 3 (with
                    redacted text only) if local inference is unavailable.
                  </div>
                </div>

                <div className="quick-prompts">
                  {QUICK_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      className="sample-chip"
                      onClick={() => handleQuickAsk(q)}
                      disabled={loadingAsk}
                    >
                      {q}
                    </button>
                  ))}
                </div>

                <form
                  className="custom-term-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleQuickAsk();
                  }}
                >
                  <input
                    className="text-input"
                    value={questionInput}
                    onChange={(e) => setQuestionInput(e.target.value)}
                    placeholder="Ask a quick question about this contract..."
                  />
                  <button
                    type="submit"
                    className="btn btn-local"
                    disabled={loadingAsk || !questionInput.trim()}
                  >
                    {loadingAsk ? "Thinking..." : "Ask"}
                  </button>
                </form>

                {quickAnswers.length === 0 ? (
                  <div className="empty-state">
                    Pick a suggested question above or type your own to test{" "}
                    <code>PREFER_ON_DEVICE</code> hybrid routing.
                  </div>
                ) : (
                  quickAnswers.map((qa, idx) => (
                    <div key={idx} className="qa-card">
                      <div className="qa-meta">
                        <strong>{qa.question}</strong>
                        <span className={`src-badge ${qa.inferenceSource}`}>
                          {qa.inferenceSource} • {qa.latencyMs}ms
                        </span>
                      </div>
                      <p className="qa-answer">{formatAuditText(qa.answer)}</p>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </section>
      </main>

      <TelemetryDock events={telemetry} />
      <SetupModal
        open={setupOpen}
        onClose={() => setSetupOpen(false)}
        capabilities={capabilities}
      />
    </div>
  );
}
