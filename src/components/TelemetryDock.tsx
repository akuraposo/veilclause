import { useState } from "react";
import { ChevronUp, ChevronDown, Activity } from "lucide-react";
import type { TelemetryEvent } from "../types/hybrid";

interface TelemetryDockProps {
  events: TelemetryEvent[];
}

export function TelemetryDock({ events }: TelemetryDockProps) {
  const [expanded, setExpanded] = useState(false);

  const localCount = events.filter(
    (e) =>
      e.inferenceSource === "ON_DEVICE" || e.inferenceSource === "LOCAL_GUARD"
  ).length;
  const cloudCount = events.filter(
    (e) => e.inferenceSource === "IN_CLOUD"
  ).length;
  const latest = events[0];

  return (
    <footer className="telemetry-dock">
      <div
        className="telemetry-summary"
        onClick={() => setExpanded((prev) => !prev)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setExpanded((p) => !p);
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Activity size={15} color="#2dd4bf" />
          <strong style={{ fontWeight: 600 }}>Split-Brain Hybrid Telemetry</strong>
          {latest && (
            <span style={{ color: "#94a3b8" }}>
              Last: {latest.operation} ({latest.inferenceSource}, {latest.latencyMs}ms)
            </span>
          )}
        </div>

        <div className="telemetry-metrics">
          <span className="metric-chip">
            <span className="dot local" /> Local Calls: {localCount}
          </span>
          <span className="metric-chip">
            <span className="dot cloud" /> Cloud Calls: {cloudCount}
          </span>
          <span className="metric-chip">
            Total Events: {events.length}
          </span>
          {expanded ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
        </div>
      </div>

      {expanded && (
        <div className="telemetry-log">
          {events.length === 0 ? (
            <div style={{ color: "#94a3b8" }}>
              No inference calls recorded yet. Click "Shield PII Locally" or "Run Cloud Deep Audit" to inspect real-time hybrid routing.
            </div>
          ) : (
            <table className="telemetry-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Operation</th>
                  <th>Requested Mode</th>
                  <th>Actual Source</th>
                  <th>Latency</th>
                  <th>PII Shielded</th>
                  <th>Cloud Payload</th>
                  <th>Model</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <tr key={ev.id}>
                    <td>{ev.timestamp}</td>
                    <td>{ev.operation}</td>
                    <td>{ev.requestedMode}</td>
                    <td>
                      <span className={`src-badge ${ev.inferenceSource}`}>
                        {ev.inferenceSource}
                      </span>
                    </td>
                    <td>{ev.latencyMs}ms</td>
                    <td>{ev.piiProtectedCount}</td>
                    <td>
                      {ev.cloudBytesSent === 0
                        ? "0 B (Local)"
                        : `${(ev.cloudBytesSent / 1024).toFixed(1)} KB`}
                    </td>
                    <td>{ev.modelUsed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </footer>
  );
}
