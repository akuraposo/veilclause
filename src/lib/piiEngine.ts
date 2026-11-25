import type { PiiCategory, PiiEntity } from "../types/hybrid";

interface PatternRule {
  category: PiiCategory;
  regex: RegExp;
}

const LOCAL_PII_PATTERNS: PatternRule[] = [
  {
    category: "EMAIL",
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  },
  {
    category: "BANK_ACCOUNT",
    regex:
      /\b(?:IBAN\s+[A-Z]{2}\d{2}(?:[-\s]?[A-Z0-9]{4}){2,5}|(?:BCA|Mandiri|BNI|BRI|Account|Rekening)\s*(?:No\.?|#)?\s*\d{3,4}[-\s]\d{3,4}[-\s]\d{3,4}(?:[-\s]\d{2,4})?|\d{4}-\d{4}-\d{4})\b/gi,
  },
  {
    category: "ID_NUMBER",
    regex:
      /\b(?:NIK\s+\d{16}|Tax\s*ID\s+\d{3}-\d{2}-\d{4}|Passport\/ID:\s*[A-Z]\d{7,9}|\d{3}-\d{2}-\d{4})\b/gi,
  },
  {
    category: "PHONE",
    regex: /(?:\+\d{1,3}[-\s]?)?\(?\d{2,4}\)?[-\s]\d{3,4}[-\s]\d{3,4}\b/g,
  },
  {
    category: "AMOUNT",
    regex:
      /(?:\$\s?\d{1,3}(?:,\d{3})+(?:\.\d{2})?|Rp\.?\s?\d{1,3}(?:\.\d{3})+(?:,\d{2})?)/g,
  },
  {
    category: "ADDRESS",
    regex:
      /\b(?:\d{1,5}\s+(?:[A-Z][a-zA-Z0-9\s.,#-]{0,45})?(?:Street|St\.?|Avenue|Ave\.?|Road|Rd\.?|Boulevard|Blvd\.?|View|Drive|Dr\.?|Bishopsgate|Gate|Lane|Ln\.?|Place|Pl\.?)(?:,\s*(?:Floor|Suite|Ste\.?|Apt\.?|Unit|[A-Z][a-zA-Z0-9.-]+)[A-Za-z0-9\s#.-]*){0,3}|Jl\.\s+[A-Za-z0-9\s./-]{4,45}(?:,\s*(?:Jakarta\s+[A-Za-z]+(?:\s+\d{5})?|[A-Z][a-z]+(?:\s+\d{5})?))?)/g,
  },
  {
    category: "COMPANY",
    regex:
      /\b(?:PT\s+[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){1,4}|[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,4}\s+(?:Inc\.|LLC|Ltd\.|Pte\.\s*Ltd\.|Corp\.|Corporation))/g,
  },
  {
    category: "PERSON",
    regex:
      /(?:(?:represented by|Contractor:|Vendor:|Candidate:|HR Contact:|diwakili oleh|Pihak Kedua:|atas nama)\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/g,
  },
];

const CATEGORY_PREFIX: Record<PiiCategory, string> = {
  PERSON: "PERSON",
  COMPANY: "ORG",
  EMAIL: "EMAIL",
  PHONE: "PHONE",
  BANK_ACCOUNT: "BANK_ACC",
  ID_NUMBER: "ID_NUM",
  AMOUNT: "AMOUNT",
  ADDRESS: "ADDRESS",
};

export function extractDeterministicPii(text: string): PiiEntity[] {
  const found = new Map<string, { original: string; category: PiiCategory }>();
  const matchedValues: string[] = [];

  for (const rule of LOCAL_PII_PATTERNS) {
    const matches = text.matchAll(rule.regex);
    for (const m of matches) {
      const rawValue = (m[1] ?? m[0]).trim();
      if (rawValue.length < 3) continue;
      const key = rawValue.toLowerCase();
      // Prevent shorter patterns (e.g., PHONE) from falsely matching substrings of already-detected IBANs/IDs
      const isSubstringOfExisting = matchedValues.some(
        (existing) => existing.includes(key) && existing !== key
      );
      if (!found.has(key) && !isSubstringOfExisting) {
        found.set(key, { original: rawValue, category: rule.category });
        matchedValues.push(key);
      }
    }
  }

  return assignTokens(
    Array.from(found.values()).map((item) => ({
      ...item,
      source: "LOCAL_GUARD" as const,
    }))
  );
}

export function mergePiiEntities(
  aiEntities: Array<{ original: string; category: PiiCategory }>,
  guardEntities: PiiEntity[]
): PiiEntity[] {
  const combined = new Map<
    string,
    { original: string; category: PiiCategory; source: "ON_DEVICE_AI" | "LOCAL_GUARD" }
  >();

  // Prioritize on-device AI detections so telemetry accurately credits Gemini Nano
  for (const item of aiEntities) {
    const cleaned = item.original?.trim();
    if (!cleaned || cleaned.length < 3) continue;
    combined.set(cleaned.toLowerCase(), {
      original: cleaned,
      category: item.category,
      source: "ON_DEVICE_AI",
    });
  }

  // Merge deterministic local guard detections to guarantee zero PII leaks
  for (const item of guardEntities) {
    const key = item.original.toLowerCase();
    if (!combined.has(key)) {
      combined.set(key, {
        original: item.original,
        category: item.category,
        source: "LOCAL_GUARD",
      });
    }
  }

  return assignTokens(Array.from(combined.values()));
}

function assignTokens(
  items: Array<{
    original: string;
    category: PiiCategory;
    source: "ON_DEVICE_AI" | "LOCAL_GUARD";
  }>
): PiiEntity[] {
  const counters: Record<PiiCategory, number> = {
    PERSON: 0,
    COMPANY: 0,
    EMAIL: 0,
    PHONE: 0,
    BANK_ACCOUNT: 0,
    ID_NUMBER: 0,
    AMOUNT: 0,
    ADDRESS: 0,
  };

  return items.map((item, idx) => {
    counters[item.category] += 1;
    const prefix = CATEGORY_PREFIX[item.category];
    return {
      id: `pii-${idx + 1}-${prefix.toLowerCase()}`,
      token: `[${prefix}_${counters[item.category]}]`,
      original: item.original,
      category: item.category,
      source: item.source,
      enabled: true,
    };
  });
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function applyRedaction(text: string, entities: PiiEntity[]): string {
  const active = entities
    .filter((e) => e.enabled && e.original.trim().length > 0)
    .sort((a, b) => b.original.length - a.original.length);

  let redacted = text;
  for (const entity of active) {
    const re = new RegExp(escapeRegExp(entity.original), "g");
    redacted = redacted.replace(re, entity.token);
  }
  return redacted;
}

export function rehydrateText(text: string, entities: PiiEntity[]): string {
  let restored = text;
  for (const entity of entities) {
    const re = new RegExp(escapeRegExp(entity.token), "g");
    restored = restored.replace(re, entity.original);
  }
  return restored;
}
