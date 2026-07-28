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
  if (typeof v !== "string") return false;
  // Matches YYYY-MM-DD or ISO strings
  return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/.test(v);
}

// ✅ KSA standard: dd/MM/yyyy (e.g. 24/02/2026)
export const formatDateKSA = (
  value: string | Date | null | undefined,
): string => {
  if (!value) return "";

  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear());

  return `${dd}/${mm}/${yyyy}`;
};

// ✅ If you need KSA timestamp: dd/MM/yyyy HH:mm (e.g. 24/02/2026 14:05)
export const formatDateTimeKSA = (
  value: string | Date | null | undefined,
): string => {
  if (!value) return "";

  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear());

  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");

  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
};
