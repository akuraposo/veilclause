export type PiiCategory =
  | "PERSON"
  | "COMPANY"
  | "EMAIL"
  | "PHONE"
  | "BANK_ACCOUNT"
  | "ID_NUMBER"
  | "AMOUNT"
  | "ADDRESS";

export interface PiiEntity {
  id: string;
  token: string;
  original: string;
  category: PiiCategory;
  source: "ON_DEVICE_AI" | "LOCAL_GUARD";
  enabled: boolean;
}

export interface RiskClause {
  id: string;
  title: string;
  category: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  excerpt: string;
  explanation: string;
  redlineSuggestion: string;
}

export interface AuditReport {
  overallRiskScore: number;
  riskLevel: "HIGH" | "MEDIUM" | "LOW";
  executiveSummary: string;
  clauses: RiskClause[];
  negotiationChecklist: string[];
}

export type InferenceSourceLabel =
  | "ON_DEVICE"
  | "IN_CLOUD"
  | "LOCAL_GUARD"
  | "DEMO_SIMULATED";

export interface TelemetryEvent {
  id: string;
  timestamp: string;
  operation: string;
  requestedMode: "ONLY_ON_DEVICE" | "PREFER_ON_DEVICE" | "ONLY_IN_CLOUD";
  inferenceSource: InferenceSourceLabel;
  latencyMs: number;
  piiProtectedCount: number;
  cloudBytesSent: number;
  modelUsed: string;
  note?: string;
}

export type ChromeNanoStatus =
  | "available"
  | "downloadable"
  | "downloading"
  | "unavailable";

export interface DeviceCapabilities {
  firebaseConfigured: boolean;
  appCheckActive: boolean;
  chromeNanoStatus: ChromeNanoStatus;
  activeCloudModel: string;
  isOnline: boolean;
}

export interface QuickAnswer {
  question: string;
  answer: string;
  inferenceSource: InferenceSourceLabel;
  latencyMs: number;
  timestamp: string;
}
