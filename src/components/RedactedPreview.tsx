import type { PiiEntity } from "../types/hybrid";

interface RedactedPreviewProps {
  redactedText: string;
  entities: PiiEntity[];
}

export function RedactedPreview({
  redactedText,
  entities,
}: RedactedPreviewProps) {
  const tokenMap = new Map(entities.map((e) => [e.token, e]));
  const parts = redactedText.split(/(\[[A-Z_]+_\d+\])/g);

  return (
    <div className="redacted-sheet" aria-label="Sanitized cloud payload preview">
      {parts.map((part, idx) => {
        const match = tokenMap.get(part);
        if (match) {
          return (
            <span
              key={`${part}-${idx}`}
              className="redaction-bar"
              title={`Protected locally (${match.category}): "${match.original}" — never sent to cloud`}
            >
              {part}
            </span>
          );
        }
        return <span key={idx}>{part}</span>;
      })}
    </div>
  );
}
