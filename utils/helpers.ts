// src/utils/helpers.ts

export function toStr(v: unknown): string {
  return v === null || v === undefined ? "" : String(v);
}

export function isActive(v: unknown): boolean {
  return v === true || v === 1 || v === "1";
}

export function toNum(
  v: unknown,
  fallback: number | null = null,
): number | null {
  if (v === "" || v === null || v === undefined) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function toBool(v: unknown, fallback = false): boolean {
  if (v === true || v === "true" || v === 1 || v === "1") return true;
  if (v === false || v === "false" || v === 0 || v === "0") return false;
  return fallback;
}

export function pick<T = unknown>(...vals: T[]): T | "" {
  for (const v of vals) {
    if (v !== null && v !== undefined && String(v).trim() !== "") return v;
  }
  return "";
}

export function toYMD(v: unknown): string {
  if (!v) return "";
  if (typeof v === "string") return v.slice(0, 10);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).slice(0, 10);
}

export function toIso(v: unknown): string | null {
  const d = toYMD(v);
  return d ? `${d}T00:00:00` : null;
}

export function isDateString(v: unknown): v is string {
  if (!v || typeof v !== "string") return false;
  const str = v.trim();
  // Don't treat pure numbers or short strings as dates
  if (/^\d+$/.test(str) || str.length < 8) return false;
  // Matches YYYY-MM-DD or ISO strings
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return true;
  // Matches DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}/.test(str)) return true;
  // Matches DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}/.test(str)) return true;
  return false;
}

export function parseDateFlexible(val: unknown): Date | undefined {
  if (!val || val === "null" || val === "undefined" || val === "—" || val === "-") return undefined;
  if (val instanceof Date) return isNaN(val.getTime()) ? undefined : val;
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed) return undefined;

    // Matches DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const month = parseInt(dmyMatch[2], 10) - 1;
      const year = parseInt(dmyMatch[3], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime()) && d.getDate() === day && d.getMonth() === month) {
        return d;
      }
    }

    // Matches YYYY-MM-DD or YYYY/MM/DD
    const ymdMatch = trimmed.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (ymdMatch) {
      const year = parseInt(ymdMatch[1], 10);
      const month = parseInt(ymdMatch[2], 10) - 1;
      const day = parseInt(ymdMatch[3], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }

    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d;
  }
  return undefined;
}

export function parseDateToISO(val: unknown, fallback?: string): string {
  const d = parseDateFlexible(val);
  if (d) return d.toISOString();
  return fallback ?? new Date().toISOString();
}

// ✅ KSA standard date format: DD/MM/YYYY (e.g. 24/02/2026)
export const formatDateKSA = (
  value: string | Date | null | undefined,
): string => {
  if (!value || value === "null" || value === "undefined" || value === "—" || value === "-") return "-";

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) return trimmed;
    if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) return trimmed.replace(/-/g, "/");
  }

  const d = parseDateFlexible(value);
  if (!d || Number.isNaN(d.getTime())) {
    return typeof value === "string" ? value : "-";
  }

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear());

  return `${dd}/${mm}/${yyyy}`;
};

// ✅ KSA timestamp: DD/MM/YYYY HH:mm (e.g. 24/02/2026 14:05)
export const formatDateTimeKSA = (
  value: string | Date | null | undefined,
): string => {
  if (!value || value === "null" || value === "undefined" || value === "—" || value === "-") return "-";

  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) {
    return typeof value === "string" ? value : "-";
  }

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear());

  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");

  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
};

// ✅ Standard currency / amount format with .00 (e.g. 1,234.50, 0.00)
export const formatAmountKSA = (value: unknown): string => {
  if (value === null || value === undefined || value === "" || value === "—" || value === "-") return "-";
  const str = String(value).replace(/,/g, "").trim();
  const num = Number(str);
  if (!Number.isFinite(num)) return String(value);
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// ✅ Helper to check if a field/column name corresponds to an amount
export const isAmountField = (fieldName?: string): boolean => {
  if (!fieldName || typeof fieldName !== "string") return false;
  const lower = fieldName.toLowerCase();

  // Exclude non-amount identifiers
  if (
    lower.includes("id") ||
    lower.includes("date") ||
    lower.includes("type") ||
    lower.includes("count") ||
    lower.includes("status") ||
    lower.includes("code") ||
    lower.includes("no") ||
    lower.includes("num") ||
    lower.includes("rate") ||
    lower.includes("percent") ||
    lower.includes("score") ||
    lower.includes("dpd") ||
    lower.includes("version")
  ) {
    return false;
  }

  return (
    lower.includes("amount") ||
    lower.includes("balance") ||
    lower.includes("installment") ||
    lower.includes("instalment") ||
    lower.includes("receivable") ||
    lower.includes("salary") ||
    lower.includes("rent") ||
    lower.includes("charges") ||
    lower.includes("fee") ||
    lower.includes("overdue") ||
    lower.includes("paid") ||
    lower.includes("limit") ||
    lower.includes("cost") ||
    lower.includes("price") ||
    lower.includes("total")
  );
};
