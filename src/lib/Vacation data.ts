// src/lib/vacation-data.ts
// One place that reads src/data/Vacations.json and turns it into numbers
// for the dashboard. Change the JSON and every card / chart updates.
import vacationsJson from "@/data/Vacations.json";

export type VacationStatus =
  | "Active"
  | "Pending"
  | "On Leave"
  | "Upcoming"
  | "Re-joined"
  | "Final Exit"
  | "Terminated"
  | "Inactive"
  | "Cancelled";

export const ALL_STATUSES: VacationStatus[] = [
  "Active",
  "Pending",
  "On Leave",
  "Upcoming",
  "Re-joined",
  "Final Exit",
  "Terminated",
  "Inactive",
  "Cancelled",
];

interface RawVacation {
  _id?: string;
  serialNo?: number | string;
  employeeId?: string;
  name?: string;
  jobTitle?: string;
  group?: string;
  nationality?: string;
  vacationType?: string;
  status?: string;
  leaveDate?: string;
  nextLeaveDate?: string;
  returnDate?: string;
  usedDays?: number;
  pendingDays?: number;
  remainingDays?: number;
  totalAllowance?: number;
}

export interface VacationRecord extends RawVacation {
  formattedStatus: VacationStatus;
  leave?: string; // leaveDate with legacy fallback
}

// ---------- status normalizer (same rules as the tracker page) ----------
export const normalizeStatus = (raw?: string): VacationStatus => {
  const key = (raw ?? "").toUpperCase().replace(/[\s_-]/g, "");
  if (key === "ONLEAVE") return "On Leave";
  if (key === "PENDING") return "Pending";
  if (key === "UPCOMING") return "Upcoming";
  if (["REJOINED", "REJOINING", "REJOIN", "RETURNED"].includes(key))
    return "Re-joined";
  if (key === "FINALEXIT") return "Final Exit";
  if (key === "TERMINATED" || key === "TERMINATE") return "Terminated";
  if (key === "INACTIVE") return "Inactive";
  if (["CANCELLED", "CANCELED", "CENCELLED"].includes(key)) return "Cancelled";
  return "Active";
};

// Supports [ {...} ] or { data: [ {...} ] } or { employees: [ {...} ] }
const extractRecords = (json: unknown): RawVacation[] => {
  if (Array.isArray(json)) return json as RawVacation[];
  if (json && typeof json === "object") {
    const o = json as Record<string, unknown>;
    if (Array.isArray(o.data)) return o.data as RawVacation[];
    if (Array.isArray(o.employees)) return o.employees as RawVacation[];
  }
  return [];
};

// Replace this with a fetch() later and nothing else has to change.
export const loadVacations = (): VacationRecord[] =>
  extractRecords(vacationsJson).map((r) => ({
    ...r,
    leave: r.leaveDate ?? r.nextLeaveDate,
    formattedStatus: normalizeStatus(r.status),
  }));

// ---------- numbers for the cards ----------
export const computeStats = (records: VacationRecord[]) => {
  const counts = Object.fromEntries(ALL_STATUSES.map((s) => [s, 0])) as Record<
    VacationStatus,
    number
  >;

  let usedDays = 0;
  let remainingDays = 0;
  let pendingDays = 0;
  const departments = new Set<string>();

  records.forEach((r) => {
    counts[r.formattedStatus] += 1;
    usedDays += Number(r.usedDays) || 0;
    remainingDays += Number(r.remainingDays) || 0;
    pendingDays += Number(r.pendingDays) || 0;
    if (r.group) departments.add(r.group);
  });

  return {
    total: records.length,
    counts,
    usedDays,
    remainingDays,
    pendingDays,
    departments: departments.size,
  };
};

export type VacationStats = ReturnType<typeof computeStats>;

export const percentOf = (n: number, total: number) =>
  total ? Math.round((n / total) * 1000) / 10 : 0;

// ---------- monthly chart data (stacked by vacation type) ----------
export const monthlyByType = (records: VacationRecord[]) => {
  const typeKey = (t?: string) =>
    (t || "other").toLowerCase().replace(/[^a-z0-9]/g, "_");

  const types = new Map<string, string>(); // key -> label
  const months = new Map<
    number,
    { label: string; row: Record<string, number> }
  >();

  records.forEach((r) => {
    if (!r.leave) return;
    const d = new Date(r.leave);
    if (Number.isNaN(d.getTime())) return;
    const sort = d.getFullYear() * 12 + d.getMonth();
    const label = d.toLocaleString("en-US", {
      month: "short",
      year: "2-digit",
    });
    const key = typeKey(r.vacationType);
    types.set(key, r.vacationType || "Other");
    const m = months.get(sort) ?? { label, row: {} };
    m.row[key] = (m.row[key] ?? 0) + 1;
    months.set(sort, m);
  });

  const rows = Array.from(months.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, m]) => ({ month: m.label, ...m.row }));

  return {
    rows: rows as Record<string, string | number>[],
    types: Array.from(types.entries()).map(([key, label]) => ({ key, label })),
  };
};
