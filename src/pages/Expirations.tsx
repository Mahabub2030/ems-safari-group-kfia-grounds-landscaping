import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Clock,
  Copy,
  Eye,
  FileDown,
  FileSpreadsheet,
  FileText,
  Filter,
  FilterX,
  Hourglass,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Users,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
// "xlsx-js-style" = same API as "xlsx" but it also supports colours, fonts and borders.
// The normal "xlsx" package CANNOT style cells.  Install once:  npm i xlsx-js-style
import * as XLSX from "xlsx-js-style";

// Data file: src/data/Expiration.json  (needs "resolveJsonModule": true in tsconfig.json)
// Component: src/pages/Expiration.tsx
// "@" must point to "src". If it doesn't, use the relative path: "../data/Expiration.json"
import expiryJson from "@/data/Expiration.json";

// NOTE: there is NO slNo any more. `employeeId` is the unique key of every record.
// The "Sr No" column in the table is only a running row number (1, 2, 3 ...).
export interface MockDocumentExpiry {
  employeeId: string; // UNIQUE key (used for row key, edit, remark save, duplicate check)
  name: string;
  email?: string;
  status: string;
  designation: string;
  idNumber: string; // Iqama / National ID
  dacoId?: string;
  group: string;
  companyName: string;
  iqamaExpiryDate?: string; // YYYY-MM-DD
  dacoExpiryDate?: string; // YYYY-MM-DD
  workLocation?: string;
  nationality: string;
  remark?: string;
  medicalInsurance?: string;
}

// Converts many date formats to YYYY-MM-DD:
//  2027-04-27 | 2027-Apr-27 | 27-Apr-2027 | 27/04/2027
// Returns undefined when it can't understand the value (e.g. Hijri text like 1448/08/21).
const MONTH_NAMES = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
];
const toIsoDate = (value?: string): string | undefined => {
  if (!value) return undefined;
  const s = String(value).trim();
  const pad = (n: number) => String(n).padStart(2, "0");
  const monthFromName = (name: string) =>
    MONTH_NAMES.indexOf(name.slice(0, 3).toLowerCase()) + 1;

  let y = 0, m = 0, d = 0;
  let r: RegExpExecArray | null;

  if ((r = /^(\d{4})[-/ ](\d{1,2})[-/ ](\d{1,2})/.exec(s))) {
    y = +r[1]; m = +r[2]; d = +r[3]; // 2027-04-27
  } else if ((r = /^(\d{4})[-/ ]([A-Za-z]{3,})[-/ ](\d{1,2})$/.exec(s))) {
    y = +r[1]; m = monthFromName(r[2]); d = +r[3]; // 2027-Apr-27
  } else if ((r = /^(\d{1,2})[-/ ]([A-Za-z]{3,})[-/ ](\d{4})$/.exec(s))) {
    d = +r[1]; m = monthFromName(r[2]); y = +r[3]; // 27-Apr-2027
  } else if ((r = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(s))) {
    d = +r[1]; m = +r[2]; y = +r[3]; // 27/04/2027 (day first)
  } else {
    return undefined;
  }

  // Hijri years (e.g. 1448/08/21) look like a valid yyyy/mm/dd but are NOT Gregorian.
  // Without this guard they were read as the year 1448 and showed as "Expired".
  if (y < 1900) return undefined;

  if (m < 1 || m > 12 || d < 1 || d > 31) return undefined;
  return `${y}-${pad(m)}-${pad(d)}`;
};

// Works with both [ ... ] and { "data": [ ... ] } JSON files
const RAW_ROWS: Partial<MockDocumentExpiry>[] = Array.isArray(expiryJson)
  ? (expiryJson as unknown as Partial<MockDocumentExpiry>[])
  : (((expiryJson as unknown as { data?: unknown[] }).data ??
    []) as Partial<MockDocumentExpiry>[]);

// Seed data = JSON rows with dates normalised to YYYY-MM-DD
// (also needed by the <input type="date"> in the form). No slNo is generated.
const SEED_DATA: MockDocumentExpiry[] = RAW_ROWS.map((item) => ({
  ...item,
  iqamaExpiryDate: toIsoDate(item.iqamaExpiryDate) ?? item.iqamaExpiryDate,
  dacoExpiryDate: toIsoDate(item.dacoExpiryDate) ?? item.dacoExpiryDate,
})) as MockDocumentExpiry[];
const STORAGE_KEY = "expiryData";

/* ------------------------------------------------------------------ */
/* Dynamic status logic                                                */
/* ------------------------------------------------------------------ */

// Change these numbers to move the thresholds
const URGENT_DAYS = 30;
const SOON_DAYS = 60;
const NEAR_DAYS = 120; // e.g. 115 days left => "Near Expiry"

type StatusKey = "EXPIRED" | "URGENT" | "SOON" | "NEAR" | "VALID" | "UNKNOWN";

// Remaining days from today (negative = already expired)
const getDaysRemaining = (expiryDateString?: string) => {
  if (!expiryDateString) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Parse YYYY-MM-DD as a LOCAL date (new Date("2026-10-29") is UTC and can be off by a day)
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(toIsoDate(expiryDateString) ?? "");
  if (!m) return null; // Hijri / unknown formats
  const expiry = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));

  return Math.round(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
};

const getStatusKey = (days: number | null): StatusKey => {
  if (days === null) return "UNKNOWN";
  if (days < 0) return "EXPIRED";
  if (days <= URGENT_DAYS) return "URGENT";
  if (days <= SOON_DAYS) return "SOON";
  if (days <= NEAR_DAYS) return "NEAR";
  return "VALID";
};

// Short label for the status cell
const SHORT_LABEL: Record<StatusKey, string> = {
  EXPIRED: "Expired",
  URGENT: "Urgent",
  SOON: "Expiring Soon",
  NEAR: "Near Expiry",
  VALID: "Valid",
  UNKNOWN: "No Date",
};

// Colour of the days text
const REMAINING_STYLES: Record<StatusKey, string> = {
  EXPIRED: "text-purple-600 dark:text-purple-400",
  URGENT: "text-rose-600 dark:text-rose-400",
  SOON: "text-orange-600 dark:text-orange-400",
  NEAR: "text-amber-600 dark:text-amber-400",
  VALID: "text-emerald-600 dark:text-emerald-400",
  UNKNOWN: "text-muted-foreground",
};

// Whole STATUS cell is filled with colour (like the "Pending" cell in the reference)
const STATUS_CELL: Record<StatusKey, string> = {
  EXPIRED: "bg-purple-600 text-white",
  URGENT: "bg-rose-500 text-white",
  SOON: "bg-orange-500 text-white",
  NEAR: "bg-amber-400 text-amber-950",
  VALID: "bg-emerald-500 text-white",
  UNKNOWN: "bg-slate-300 text-slate-700 dark:bg-slate-600 dark:text-slate-100",
};

// Light tint for the REMAINING cell
const REMAINING_TINT: Record<StatusKey, string> = {
  EXPIRED: "bg-purple-500/10",
  URGENT: "bg-rose-500/10",
  SOON: "bg-orange-500/10",
  NEAR: "bg-amber-500/10",
  VALID: "bg-emerald-500/10",
  UNKNOWN: "",
};

// "26 days" / "1 day" / "Today" / "12 days overdue"
const getRemainingText = (days: number | null) => {
  if (days === null) return "—";
  const n = Math.abs(days);
  const unit = n === 1 ? "day" : "days";
  if (days < 0) return `${n} ${unit} overdue`;
  if (days === 0) return "Today";
  return `${days} ${unit}`;
};

// Plain text version (for Excel / PDF)
const getStatusText = (days: number | null): string => {
  if (days === null) return "N/A";
  if (days < 0) return `EXPIRED (${Math.abs(days)} days ago)`;
  if (days === 0) return "EXPIRES TODAY";
  const key = getStatusKey(days);
  const name =
    key === "URGENT" ? "Urgent" : key === "SOON" ? "Expiring Soon" : key === "NEAR" ? "Near Expiry" : "Valid";
  return `${name} (${days} days)`;
};

// Worst (smallest) days between Iqama and DACO => overall employee status
const getOverallDays = (item: MockDocumentExpiry): number | null => {
  const list = [
    getDaysRemaining(item.iqamaExpiryDate),
    getDaysRemaining(item.dacoExpiryDate),
  ].filter((d): d is number => d !== null);
  return list.length ? Math.min(...list) : null;
};

// Date + days left in the same line (used for Iqama / DACO expiry columns)
const renderExpiryCell = (date?: string) => {
  const days = getDaysRemaining(date);
  if (days === null) {
    // No usable date: show the raw text (e.g. "Saudi", Hijri date) or a dash if empty
    return date ? (
      <span className="text-muted-foreground">{date}</span>
    ) : (
      <span className="text-muted-foreground">—</span>
    );
  }
  const key = getStatusKey(days);
  return (
    <span className="whitespace-nowrap">
      <span className="font-mono">{date}</span>
      <span
        className={`ml-2 text-[11px] font-semibold ${REMAINING_STYLES[key]}`}
      >
        ({getRemainingText(days)})
      </span>
    </span>
  );
};

type FilterOpt = { label: string; value: string };

const filterStatusOptions: FilterOpt[] = [
  { label: "Expired", value: "EXPIRED" },
  { label: `Urgent (≤ ${URGENT_DAYS} Days)`, value: "URGENT" },
  { label: `Expiring Soon (≤ ${SOON_DAYS} Days)`, value: "SOON" },
  { label: `Near Expiry (≤ ${NEAR_DAYS} Days)`, value: "NEAR" },
  { label: "Valid", value: "VALID" },
];

/* ------------------------------------------------------------------ */
/* Table column definitions                                            */
/* ------------------------------------------------------------------ */

type ColKey =
  | "srNo"
  | "employeeId"
  | "name"
  | "designation"
  | "idNumber"
  | "iqamaExpiryDate"
  | "dacoId"
  | "dacoExpiryDate"
  | "remaining"
  | "status"
  | "remark"
  | "actions";

type ColMeta = {
  key: ColKey;
  label: string;
  sortable: boolean;
  filter: "text" | "select" | "none";
  minW?: string;
  // text used by the column filter box
  text?: (e: MockDocumentExpiry) => string;
  // value used for sorting
  sortValue?: (e: MockDocumentExpiry) => string | number | null;
  // extra classes for the whole cell (full-cell colour)
  cellClass?: (e: MockDocumentExpiry) => string;
};

const s = (v: unknown) => String(v ?? "");

const COL_META: ColMeta[] = [
  // "Sr No" = running row number only (not stored in the data)
  { key: "srNo", label: "Sr No", sortable: true, filter: "none", minW: "min-w-[70px]" },
  {
    key: "employeeId",
    label: "Emp ID",
    sortable: true,
    filter: "text",
    minW: "min-w-[100px]",
    text: (e) => s(e.employeeId),
    sortValue: (e) => s(e.employeeId),
  },
  {
    key: "name",
    label: "Employee",
    sortable: true,
    filter: "text",
    minW: "min-w-[200px]",
    text: (e) => s(e.name),
    sortValue: (e) => s(e.name),
  },
  {
    key: "designation",
    label: "Designation",
    sortable: true,
    filter: "text",
    minW: "min-w-[150px]",
    text: (e) => s(e.designation),
    sortValue: (e) => s(e.designation),
  },
  {
    key: "idNumber",
    label: "Iqama No.",
    sortable: true,
    filter: "text",
    minW: "min-w-[130px]",
    text: (e) => s(e.idNumber),
    sortValue: (e) => s(e.idNumber),
  },
  {
    key: "iqamaExpiryDate",
    label: "Iqama Expiry",
    sortable: true,
    filter: "text",
    minW: "min-w-[190px]",
    text: (e) =>
      `${s(e.iqamaExpiryDate)} ${getRemainingText(getDaysRemaining(e.iqamaExpiryDate))}`,
    sortValue: (e) => getDaysRemaining(e.iqamaExpiryDate),
  },
  {
    key: "dacoId",
    label: "DACO ID",
    sortable: true,
    filter: "text",
    minW: "min-w-[110px]",
    text: (e) => s(e.dacoId),
    sortValue: (e) => s(e.dacoId),
  },
  {
    key: "dacoExpiryDate",
    label: "DACO Expiry",
    sortable: true,
    filter: "text",
    minW: "min-w-[190px]",
    text: (e) =>
      `${s(e.dacoExpiryDate)} ${getRemainingText(getDaysRemaining(e.dacoExpiryDate))}`,
    sortValue: (e) => getDaysRemaining(e.dacoExpiryDate),
  },
  {
    key: "remaining",
    label: "Remaining",
    sortable: true,
    filter: "text",
    minW: "min-w-[140px]",
    text: (e) => getRemainingText(getOverallDays(e)),
    sortValue: (e) => getOverallDays(e),
    cellClass: (e) => REMAINING_TINT[getStatusKey(getOverallDays(e))],
  },
  {
    key: "status",
    label: "Status",
    sortable: true,
    filter: "select",
    minW: "min-w-[150px]",
    sortValue: (e) => getOverallDays(e),
    cellClass: (e) =>
      `text-center ${STATUS_CELL[getStatusKey(getOverallDays(e))]}`,
  },
  {
    key: "remark",
    label: "Remark",
    sortable: true,
    filter: "text",
    minW: "min-w-[220px]",
    text: (e) => s(e.remark),
    sortValue: (e) => s(e.remark),
  },
  { key: "actions", label: "", sortable: false, filter: "none", minW: "min-w-[56px]" },
];

// Summary cards shown above the table (click a card to filter the table)
const STAT_CARDS: {
  key: StatusKey | "ALL";
  label: string;
  icon: typeof Users;
  iconClass: string;
  valueClass: string;
  accentClass: string;
}[] = [
    {
      key: "ALL",
      label: "Total Employees",
      icon: Users,
      iconClass: "bg-primary/10 text-primary",
      valueClass: "text-foreground",
      accentClass: "bg-primary",
    },
    {
      key: "VALID",
      label: "Valid",
      icon: CheckCircle2,
      iconClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      valueClass: "text-emerald-600 dark:text-emerald-400",
      accentClass: "bg-emerald-500",
    },
    {
      key: "NEAR",
      label: `Near Expiry (≤ ${NEAR_DAYS}d)`,
      icon: Clock,
      iconClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      valueClass: "text-amber-600 dark:text-amber-400",
      accentClass: "bg-amber-500",
    },
    {
      key: "SOON",
      label: `Expiring Soon (≤ ${SOON_DAYS}d)`,
      icon: Hourglass,
      iconClass: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
      valueClass: "text-orange-600 dark:text-orange-400",
      accentClass: "bg-orange-500",
    },
    {
      key: "URGENT",
      label: `Urgent (≤ ${URGENT_DAYS}d)`,
      icon: AlertTriangle,
      iconClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
      valueClass: "text-rose-600 dark:text-rose-400",
      accentClass: "bg-rose-500",
    },
    {
      key: "EXPIRED",
      label: "Expired",
      icon: XCircle,
      iconClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
      valueClass: "text-purple-600 dark:text-purple-400",
      accentClass: "bg-purple-500",
    },
  ];

// Default values of the Add form
const emptyForm: Partial<MockDocumentExpiry> = {
  name: "",
  email: "",
  employeeId: "",
  idNumber: "",
  dacoId: "",
  group: "Administrative / Management",
  companyName: "Safari Group",
  iqamaExpiryDate: "",
  dacoExpiryDate: "",
  workLocation: "",
  remark: "",
  designation: "",
  nationality: "Saudi",
  status: "Active",
};

// Small ghost button used in the top-right toolbar (Print / Excel / CSV / Copy ...)
const toolBtn =
  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-slate-600 transition-colors hover:bg-purple-500/10 hover:text-purple-700 dark:text-slate-300 dark:hover:text-purple-300";

// Small native select used in the toolbar / filter row
const selectCls =
  "h-8 w-full appearance-none rounded-md border border-input bg-background text-xs text-foreground focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20";

export default function Expiration() {
  // Load from localStorage; if empty/corrupted, fall back to Expiration.json
  // (old saved data that still has slNo is harmless, but click "Reset" once to clean it)
  const [data, setData] = useState<MockDocumentExpiry[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as MockDocumentExpiry[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore and use JSON
    }
    return SEED_DATA;
  });

  // Persist every change (add / edit / remark)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [expiryStatusFilter, setExpiryStatusFilter] = useState("all");
  const [colFilters, setColFilters] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState<ColKey>("srNo");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [hiddenCols, setHiddenCols] = useState<Record<string, boolean>>({});
  const [colMenuOpen, setColMenuOpen] = useState(false);
  const [pageSize, setPageSize] = useState<number>(25);
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MockDocumentExpiry | null>(
    null,
  );
  const [form, setForm] = useState<Partial<MockDocumentExpiry>>(emptyForm);

  // Reset table back to Expiration.json
  const resetToJson = () => {
    localStorage.removeItem(STORAGE_KEY);
    setData(SEED_DATA);
    setPage(1);
    toast.success("Data reset from Expiration.json");
  };

  // Dynamic Group filter options
  const groupOptions = useMemo(() => {
    const uniqueGroups = Array.from(
      new Set(data.map((e) => e.group).filter(Boolean)),
    );
    return uniqueGroups.map((g) => ({ label: g, value: g }));
  }, [data]);

  // Counts for the summary cards (based on ALL records)
  const stats = useMemo(() => {
    const counts: Record<StatusKey | "ALL", number> = {
      ALL: data.length,
      EXPIRED: 0,
      URGENT: 0,
      SOON: 0,
      NEAR: 0,
      VALID: 0,
      UNKNOWN: 0,
    };
    data.forEach((item) => {
      counts[getStatusKey(getOverallDays(item))] += 1;
    });
    return counts;
  }, [data]);

  // Search + column filters + status / group filters
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data.filter((item) => {
      // String(...) so numbers / missing fields in the JSON never crash the search
      const has = (v: unknown) => String(v ?? "").toLowerCase().includes(q);
      const matchSearch =
        has(item.name) ||
        has(item.email) ||
        has(item.employeeId) ||
        has(item.idNumber) ||
        has(item.dacoId) ||
        has(item.designation) ||
        has(item.group) ||
        has(item.companyName) ||
        has(item.remark);

      const matchGroup = groupFilter === "all" || item.group === groupFilter;

      // Overall status = worst of Iqama / DACO
      const matchExpiry =
        expiryStatusFilter === "all" ||
        getStatusKey(getOverallDays(item)) === expiryStatusFilter;

      // Filter boxes under the column headers
      const matchColumns = COL_META.every((c) => {
        const f = (colFilters[c.key] ?? "").trim().toLowerCase();
        if (!f || !c.text) return true;
        return c.text(item).toLowerCase().includes(f);
      });

      return matchSearch && matchGroup && matchExpiry && matchColumns;
    });
  }, [data, search, groupFilter, expiryStatusFilter, colFilters]);

  // Original position of every record, keyed by employeeId
  // (used when sorting by "Sr No" so the order matches the JSON order)
  const orderMap = useMemo(
    () => new Map(data.map((d, i) => [d.employeeId, i])),
    [data],
  );

  // Sorting (click a column header)
  const sorted = useMemo(() => {
    const meta = COL_META.find((c) => c.key === sortKey);
    if (!meta || !meta.sortable) return filtered;
    const dir = sortDir === "asc" ? 1 : -1;
    const val = (e: MockDocumentExpiry): string | number | null =>
      sortKey === "srNo"
        ? (orderMap.get(e.employeeId) ?? 0)
        : (meta.sortValue?.(e) ?? null);

    return [...filtered].sort((a, b) => {
      const va = val(a);
      const vb = val(b);
      if (va === null && vb === null) return 0;
      if (va === null) return 1; // empty values always go to the bottom
      if (vb === null) return -1;
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return (
        String(va).localeCompare(String(vb), undefined, {
          numeric: true,
          sensitivity: "base",
        }) * dir
      );
    });
  }, [filtered, sortKey, sortDir, orderMap]);

  // Pagination
  const total = sorted.length;
  const totalPages = pageSize === 0 ? 1 : Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIdx = pageSize === 0 ? 0 : (safePage - 1) * pageSize;
  const pageRows =
    pageSize === 0 ? sorted : sorted.slice(startIdx, startIdx + pageSize);

  const pageNumbers: number[] = [];
  {
    const first = Math.max(1, Math.min(safePage - 2, totalPages - 4));
    const last = Math.min(totalPages, first + 4);
    for (let p = first; p <= last; p++) pageNumbers.push(p);
  }

  const visibleCols = COL_META.filter((c) => !hiddenCols[c.key]);

  const toggleSort = (key: ColKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const setColFilter = (key: string, value: string) => {
    setColFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setColFilters({});
    setGroupFilter("all");
    setExpiryStatusFilter("all");
    setSortKey("srNo");
    setSortDir("asc");
    setPage(1);
  };

  const openAdd = () => {
    setEditingRecord(null);
    setForm({ ...emptyForm });
    setDialogOpen(true);
  };

  const openEdit = (record: MockDocumentExpiry) => {
    setEditingRecord(record);
    setForm({ ...record });
    setDialogOpen(true);
  };

  // Save a comment typed directly in the table (record is found by employeeId)
  const updateRemark = (employeeId: string, value: string) => {
    const trimmed = value.trim();
    const current = data.find((d) => d.employeeId === employeeId);
    if (!current || (current.remark ?? "") === trimmed) return;
    setData((prev) =>
      prev.map((item) =>
        item.employeeId === employeeId ? { ...item, remark: trimmed } : item,
      ),
    );
    toast.success("Remark saved");
  };

  const handleSave = () => {
    if (
      !form.name?.trim() ||
      !form.employeeId?.trim() ||
      !form.iqamaExpiryDate
    ) {
      toast.error("Name, Employee ID, and Iqama Expiry Date are required");
      return;
    }

    const id = form.employeeId.trim();

    // employeeId must stay unique (ignore the record that is currently being edited)
    const duplicate = data.some(
      (d) => d.employeeId === id && d.employeeId !== editingRecord?.employeeId,
    );
    if (duplicate) {
      toast.error(`Employee ID ${id} already exists`);
      return;
    }

    if (editingRecord) {
      // EDIT: find the old record by its ORIGINAL employeeId, then apply the form
      setData((prev) =>
        prev.map((item) =>
          item.employeeId === editingRecord.employeeId
            ? ({ ...item, ...form, employeeId: id } as MockDocumentExpiry)
            : item,
        ),
      );
      toast.success("Document expiry dates updated");
    } else {
      // ADD: no slNo / Date.now() needed any more, employeeId is the key
      const newRec: MockDocumentExpiry = {
        ...form,
        employeeId: id,
        name: form.name || "",
        idNumber: form.idNumber || "",
        iqamaExpiryDate: form.iqamaExpiryDate || "",
        status: form.status || "Active",
        designation: form.designation || "Staff",
        group: form.group || "Administrative / Management",
        companyName: form.companyName || "Safari Group",
        nationality: form.nationality || "Saudi",
      };
      setData((prev) => [newRec, ...prev]);
      toast.success("New expiration tracking record created");
    }
    setDialogOpen(false);
  };

  /* ---------------- Export / print / copy (uses current filter + sort) ---------------- */

  const buildExportRows = () =>
    sorted.map((e, i) => ({
      "Sr No": i + 1,
      "Employee ID": e.employeeId,
      Name: e.name,
      Designation: e.designation || "",
      "Iqama / ID": e.idNumber,
      "Iqama Expiry": e.iqamaExpiryDate || "N/A",
      "Iqama Days Left": getDaysRemaining(e.iqamaExpiryDate) ?? "N/A",
      "Iqama Status": getStatusText(getDaysRemaining(e.iqamaExpiryDate)),
      "DACO ID": e.dacoId || "",
      "DACO Expiry": e.dacoExpiryDate || "",
      "DACO Days Left": getDaysRemaining(e.dacoExpiryDate) ?? "N/A",
      "DACO Status": getStatusText(getDaysRemaining(e.dacoExpiryDate)),
      Remaining: getRemainingText(getOverallDays(e)),
      "Overall Status": getStatusText(getOverallDays(e)),
      Group: e.group,
      Company: e.companyName,
      Location: e.workLocation || "",
      Remark: e.remark || "",
    }));

  // Professional Excel export: title banner, coloured header, serif font,
  // thin borders, zebra rows, coloured status cells, auto column width, filter buttons.
  const exportExcel = () => {
    const rows = buildExportRows() as Record<string, string | number>[];
    if (rows.length === 0) {
      toast.error("Nothing to export");
      return;
    }
    const headers = Object.keys(rows[0]);
    const colCount = headers.length;

    const FONT = "Times New Roman"; // serif font used for every cell
    const HEADER_ROW = 3; // 0 = title, 1 = info line, 2 = spacer, 3 = column headers

    // Thin dark-grey border around every table cell
    const line = { style: "thin", color: { rgb: "475569" } };
    const border = { top: line, bottom: line, left: line, right: line };

    // Status cell colours (same colours as the web table), chosen from the status text
    const statusStyle = (text: string) => {
      if (text.startsWith("EXPIRED")) return { fill: "7C3AED", font: "FFFFFF" }; // purple
      if (text.startsWith("Urgent")) return { fill: "F43F5E", font: "FFFFFF" }; // red
      if (text.startsWith("Expiring Soon")) return { fill: "F97316", font: "FFFFFF" }; // orange
      if (text.startsWith("Near Expiry")) return { fill: "FBBF24", font: "451A03" }; // amber
      if (text.startsWith("Valid")) return { fill: "10B981", font: "FFFFFF" }; // green
      return null; // N/A etc. => normal row colour
    };
    const STATUS_COLS = new Set(["Iqama Status", "DACO Status", "Overall Status"]);

    // Columns that look better centred (everything else is left aligned)
    const CENTER_COLS = new Set([
      "Sr No",
      "Employee ID",
      "Iqama Expiry",
      "Iqama Days Left",
      "DACO Expiry",
      "DACO Days Left",
      "Remaining",
      ...STATUS_COLS,
    ]);

    // Sheet layout: title row, info row, empty row, header row, then data
    const fullRow = (text: string) => [text, ...Array(colCount - 1).fill("")];
    const asOf = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const aoa: (string | number)[][] = [
      fullRow("Safari Group - Iqama & DACO Expiry Monitoring Report"),
      fullRow(`As of ${asOf}   |   Total records: ${rows.length}`),
      Array(colCount).fill(""),
      headers,
      ...rows.map((r) => headers.map((h) => r[h])),
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // Apply a style to every cell
    aoa.forEach((rowArr, r) => {
      rowArr.forEach((_, c) => {
        const cell = ws[XLSX.utils.encode_cell({ r, c })];
        if (!cell) return;
        const header = headers[c];
        let style: Record<string, unknown>;

        if (r === 0) {
          // Title banner (dark navy)
          style = {
            font: { name: FONT, sz: 16, bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "1E293B" } },
            alignment: { horizontal: "center", vertical: "center" },
          };
        } else if (r === 1) {
          // Info line (light grey)
          style = {
            font: { name: FONT, sz: 11, italic: true, color: { rgb: "1E293B" } },
            fill: { fgColor: { rgb: "E2E8F0" } },
            alignment: { horizontal: "center", vertical: "center" },
          };
        } else if (r === 2) {
          return; // spacer row stays empty
        } else if (r === HEADER_ROW) {
          // Column headers (purple, white bold text)
          style = {
            font: { name: FONT, sz: 12, bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "6D28D9" } },
            alignment: { horizontal: "center", vertical: "center", wrapText: true },
            border,
          };
        } else {
          // Data rows: zebra colour, status cells coloured by status
          const zebra = r % 2 === 0 ? "F1F5F9" : "FFFFFF";
          const st = STATUS_COLS.has(header)
            ? statusStyle(String(cell.v ?? ""))
            : null;
          style = {
            font: {
              name: FONT,
              sz: 11,
              bold: !!st,
              color: { rgb: st ? st.font : "0F172A" },
            },
            fill: { fgColor: { rgb: st ? st.fill : zebra } },
            alignment: {
              horizontal: CENTER_COLS.has(header) ? "center" : "left",
              vertical: "center",
              wrapText: true,
            },
            border,
          };
        }
        (cell as { s?: unknown }).s = style;
      });
    });

    // Merge the title + info rows across the whole table
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: colCount - 1 } },
    ];

    // Column width = longest text in the column (min 10, max 45)
    ws["!cols"] = headers.map((h) => {
      const longest = rows.reduce(
        (max, r) => Math.max(max, String(r[h] ?? "").length),
        h.length,
      );
      return { wch: Math.min(Math.max(longest + 3, 10), 45) };
    });

    // Row heights (pixels): title, info, spacer, header
    ws["!rows"] = [{ hpx: 32 }, { hpx: 22 }, { hpx: 8 }, { hpx: 34 }];

    // Filter drop-downs on the header row
    ws["!autofilter"] = {
      ref: XLSX.utils.encode_range({
        s: { r: HEADER_ROW, c: 0 },
        e: { r: aoa.length - 1, c: colCount - 1 },
      }),
    };

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expiry_Report");
    XLSX.writeFile(wb, "iqama_daco_expiry_report.xlsx");
    toast.success("Excel report downloaded");
  };

  const exportCSV = () => {
    const ws = XLSX.utils.json_to_sheet(buildExportRows());
    const csv = XLSX.utils.sheet_to_csv(ws);
    // BOM so Excel opens Arabic / special characters correctly
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "iqama_daco_expiry_report.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded");
  };

  const copyTable = async () => {
    const rows = buildExportRows() as Record<string, unknown>[];
    if (rows.length === 0) {
      toast.error("Nothing to copy");
      return;
    }
    const headers = Object.keys(rows[0]);
    const text = [
      headers.join("\t"),
      ...rows.map((r) => headers.map((h) => String(r[h] ?? "")).join("\t")),
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${rows.length} rows copied`);
    } catch {
      toast.error("Copy failed");
    }
  };

  const printTable = () => {
    const rows = buildExportRows() as Record<string, unknown>[];
    const w = window.open("", "_blank");
    if (!w) {
      toast.error("Please allow pop-ups to print");
      return;
    }
    const headers = rows.length ? Object.keys(rows[0]) : [];
    const esc = (v: unknown) =>
      String(v ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    w.document.write(
      `<html><head><title>Iqama &amp; DACO Expiry Report</title>
<style>
 body{font-family:Arial,sans-serif;padding:16px}
 h2{margin:0 0 12px}
 table{border-collapse:collapse;width:100%;font-size:11px}
 th,td{border:1px solid #999;padding:4px 6px;text-align:left}
 th{background:#eee}
</style></head><body>
<h2>Safari Group - Iqama &amp; DACO Expiry Monitoring Report</h2>
<table><thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>
<tbody>${rows
        .map(
          (r) =>
            `<tr>${headers.map((h) => `<td>${esc(r[h])}</td>`).join("")}</tr>`,
        )
        .join("")}</tbody></table></body></html>`,
    );
    w.document.close();
    w.focus();
    w.print();
  };

  const exportPDF = () => {
    const doc = new jsPDF("landscape");
    doc.setFontSize(14);
    doc.text("Safari Group - Iqama & DACO Expiry Monitoring Report", 14, 15);
    autoTable(doc, {
      startY: 22,
      head: [
        [
          "Sr No",
          "Emp ID",
          "Name",
          "Iqama No.",
          "Iqama Expiry",
          "Iqama Status",
          "DACO ID",
          "DACO Expiry",
          "DACO Status",
          "Remark",
        ],
      ],
      body: sorted.map((e, i) => [
        i + 1,
        e.employeeId,
        e.name,
        e.idNumber,
        e.iqamaExpiryDate || "—",
        getStatusText(getDaysRemaining(e.iqamaExpiryDate)),
        e.dacoId || "—",
        e.dacoExpiryDate || "—",
        getStatusText(getDaysRemaining(e.dacoExpiryDate)),
        e.remark || "",
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 41, 59] },
    });
    doc.save("iqama_daco_expiry_report.pdf");
    toast.success("PDF report downloaded");
  };

  /* ---------------- Cell content ---------------- */

  const renderCell = (
    key: ColKey,
    emp: MockDocumentExpiry,
    rowNo: number,
  ): ReactNode => {
    switch (key) {
      case "srNo":
        // running row number (1, 2, 3 ...), not stored in the data
        return (
          <span className="font-mono text-xs text-muted-foreground">{rowNo}</span>
        );
      case "employeeId":
        return (
          <span className="font-mono font-semibold text-primary">
            {emp.employeeId}
          </span>
        );
      case "name":
        return (
          <div className="max-w-[260px] truncate font-medium" title={emp.name}>
            {emp.name}
          </div>
        );
      case "designation":
        return (
          <div className="max-w-[200px] truncate" title={emp.designation}>
            {emp.designation}
          </div>
        );
      case "idNumber":
        return <span className="font-mono">{emp.idNumber}</span>;
      case "iqamaExpiryDate":
        return renderExpiryCell(emp.iqamaExpiryDate);
      case "dacoId":
        return <span className="font-mono">{emp.dacoId || "—"}</span>;
      case "dacoExpiryDate":
        return renderExpiryCell(emp.dacoExpiryDate);
      case "remaining": {
        const days = getOverallDays(emp); // worst of Iqama / DACO
        return (
          <span
            className={`font-mono font-semibold ${REMAINING_STYLES[getStatusKey(days)]}`}
          >
            {getRemainingText(days)}
          </span>
        );
      }
      case "status":
        return (
          <span className="font-semibold">
            {SHORT_LABEL[getStatusKey(getOverallDays(emp))]}
          </span>
        );
      case "remark":
        // Type a comment and press Enter (or click outside) to save.
        // key + save both use employeeId.
        return (
          <input
            key={`${emp.employeeId}-${emp.remark ?? ""}`}
            defaultValue={emp.remark ?? ""}
            placeholder="Add comment..."
            onBlur={(e) => updateRemark(emp.employeeId, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
            className="h-7 w-full rounded border border-dashed border-transparent bg-transparent px-1.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 hover:border-border focus:border-solid focus:border-purple-600 focus:bg-background focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        );
      case "actions":
        return (
          <button
            onClick={() => openEdit(emp)}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-purple-500/10 hover:text-purple-700"
            title="Update Expiry Dates"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        );
      default:
        return null;
    }
  };

  const todayLabel = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5 p-4 md:p-6"
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight leading-tight">
              Iqama & DACO Expiry Tracker
            </h1>
            <p className="text-muted-foreground text-xs mt-0.5">
              Monitoring document expiration dates and remaining countdown days
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
          <CalendarDays className="h-3.5 w-3.5" />
          <span>As of</span>
          <span className="font-semibold text-foreground">{todayLabel}</span>
        </div>
      </div>

      {/* Summary Cards (click to filter) */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {STAT_CARDS.map((card) => {
          const Icon = card.icon;
          const value = filterValueFor(card.key);
          const active = expiryStatusFilter === value;
          const share =
            stats.ALL > 0 ? Math.round((stats[card.key] / stats.ALL) * 100) : 0;
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => {
                setExpiryStatusFilter(active ? "all" : value);
                setPage(1);
              }}
              className={`group relative overflow-hidden rounded-xl border bg-card p-3.5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${active ? "ring-2 ring-primary border-primary" : ""
                }`}
            >
              <span
                className={`absolute inset-x-0 top-0 h-0.5 ${card.accentClass}`}
              />
              <div className="flex items-start justify-between">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.iconClass}`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </div>
                {card.key !== "ALL" && (
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {share}%
                  </span>
                )}
              </div>
              <p
                className={`mt-3 text-3xl font-bold leading-none tracking-tight ${card.valueClass}`}
              >
                {stats[card.key]}
              </p>
              <p className="mt-1.5 truncate text-[11px] font-medium text-muted-foreground">
                {card.label}
              </p>
            </button>
          );
        })}
      </div>

      {/* Table card */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        {/* Row 1: left = Add / Reset, right = Clear Filters, Columns, Print, Excel, CSV, Copy, PDF */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={openAdd} className="h-8 text-xs bg-primary">
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Track Record
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetToJson}
              className="h-8 text-xs"
              title="Reload data from Expiration.json"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-0.5">
            <button type="button" onClick={clearFilters} className={toolBtn}>
              <FilterX className="h-4 w-4" /> Clear Filters
            </button>

            {/* Columns show / hide */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setColMenuOpen((o) => !o)}
                className={toolBtn}
              >
                <Eye className="h-4 w-4" /> Columns
              </button>
              {colMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setColMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-30 mt-1 w-52 rounded-lg border bg-popover p-2 text-popover-foreground shadow-lg">
                    {COL_META.filter((c) => c.label).map((c) => (
                      <label
                        key={c.key}
                        className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-muted"
                      >
                        <input
                          type="checkbox"
                          checked={!hiddenCols[c.key]}
                          onChange={() =>
                            setHiddenCols((prev) => ({ ...prev, [c.key]: !prev[c.key] }))
                          }
                          className="accent-purple-600"
                        />
                        {c.label}
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button type="button" onClick={printTable} className={toolBtn}>
              <Printer className="h-4 w-4" /> Print
            </button>
            <button type="button" onClick={exportExcel} className={toolBtn}>
              <FileSpreadsheet className="h-4 w-4" /> Excel
            </button>
            <button type="button" onClick={exportCSV} className={toolBtn}>
              <FileText className="h-4 w-4" /> CSV
            </button>
            <button type="button" onClick={exportPDF} className={toolBtn}>
              <FileDown className="h-4 w-4" /> PDF
            </button>
            <button type="button" onClick={copyTable} className={toolBtn}>
              <Copy className="h-4 w-4" /> Copy
            </button>
          </div>
        </div>

        {/* Row 2: Show N entries + Group  |  Search */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-bold">Show</span>
              <div className="relative w-[84px]">
                <select
                  value={String(pageSize)}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className={`${selectCls} pl-3 pr-7`}
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                  <option value="0">All</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              </div>
              <span className="font-bold">entries</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span className="font-bold">Group:</span>
              <div className="relative w-[190px]">
                <select
                  value={groupFilter}
                  onChange={(e) => {
                    setGroupFilter(e.target.value);
                    setPage(1);
                  }}
                  className={`${selectCls} pl-3 pr-7`}
                >
                  <option value="all">All Groups</option>
                  {groupOptions.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="font-bold">Search:</span>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Employee, Iqama, DACO ID, Remark..."
              className="h-8 w-[260px] border-0 border-b border-border bg-transparent px-1 text-sm placeholder:text-muted-foreground/60 focus:border-purple-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Table */}
        <div className="mt-4 overflow-hidden rounded-xl border border-foreground/70">
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                {/* Header row (click to sort) */}
                <tr>
                  {visibleCols.map((c) => {
                    const active = sortKey === c.key;
                    return (
                      <th
                        key={c.key}
                        onClick={c.sortable ? () => toggleSort(c.key) : undefined}
                        className={`border border-border border-b-2 border-b-slate-300 bg-card px-3 py-3.5 text-left text-[13px] font-bold text-purple-700 dark:border-b-slate-600 dark:text-purple-300 whitespace-nowrap select-none ${c.minW ?? ""} ${c.sortable ? "cursor-pointer hover:bg-purple-500/5" : ""
                          }`}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          {c.label}
                          {c.sortable &&
                            (active ? (
                              sortDir === "asc" ? (
                                <ChevronUp className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5" />
                              )
                            ) : (
                              <ChevronsUpDown className="h-3 w-3 opacity-30" />
                            ))}
                        </span>
                      </th>
                    );
                  })}
                </tr>

                {/* Filter row (box under each header) */}
                <tr>
                  {visibleCols.map((c) => (
                    <th
                      key={c.key}
                      className="border border-border bg-card px-3 py-2.5 text-left font-normal"
                    >
                      {c.filter === "text" && (
                        <input
                          value={colFilters[c.key] ?? ""}
                          onChange={(e) => setColFilter(c.key, e.target.value)}
                          placeholder={c.label}
                          className="h-7 w-full border-0 border-b border-border bg-transparent px-0.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-purple-600 focus:outline-none"
                        />
                      )}
                      {c.filter === "select" && (
                        <div className="relative">
                          <Filter className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                          <select
                            value={expiryStatusFilter}
                            onChange={(e) => {
                              setExpiryStatusFilter(e.target.value);
                              setPage(1);
                            }}
                            className={`${selectCls} pl-7 pr-2`}
                          >
                            <option value="all">All Statuses</option>
                            {filterStatusOptions.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      {c.filter === "none" && c.key === "srNo" && (
                        <span className="text-xs text-muted-foreground/70">{c.label}</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {pageRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleCols.length}
                      className="border border-border px-3 py-10 text-center text-sm text-muted-foreground"
                    >
                      No matching document expiration records found
                    </td>
                  </tr>
                ) : (
                  pageRows.map((emp, i) => (
                    // row key = employeeId (unique)
                    <tr
                      key={emp.employeeId}
                      className="bg-card transition-colors even:bg-muted/40 hover:bg-purple-500/5"
                    >
                      {visibleCols.map((c) => (
                        <td
                          key={c.key}
                          className={`border border-border px-3 py-2.5 align-middle text-foreground ${c.cellClass ? c.cellClass(emp) : ""
                            }`}
                        >
                          {/* startIdx + i + 1 = running row number for the "Sr No" column */}
                          {renderCell(c.key, emp, startIdx + i + 1)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer: info + pagination */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>
            Showing{" "}
            <span className="font-semibold text-foreground">
              {total === 0 ? 0 : startIdx + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-foreground">
              {startIdx + pageRows.length}
            </span>{" "}
            of <span className="font-semibold text-foreground">{total}</span>{" "}
            entries
            {total !== data.length && (
              <span> (filtered from {data.length} total entries)</span>
            )}
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage(safePage - 1)}
              className="h-8 rounded-md border px-3 text-xs transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            {pageNumbers.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`h-8 min-w-8 rounded-md border px-2.5 text-xs transition-colors ${p === safePage
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:bg-muted"
                  }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage(safePage + 1)}
              className="h-8 rounded-md border px-3 text-xs transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingRecord ? "Update Expiry Dates" : "Add Expiry Track Record"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-3 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-muted-foreground mb-1 block">
                  Employee Name *
                </label>
                <Input
                  value={form.name || ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Full Name"
                />
              </div>
              <div>
                <label className="font-medium text-muted-foreground mb-1 block">
                  Employee ID * (unique)
                </label>
                <Input
                  value={form.employeeId || ""}
                  onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                  placeholder="67712"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-muted-foreground mb-1 block">
                  Designation
                </label>
                <Input
                  value={form.designation || ""}
                  onChange={(e) => setForm({ ...form, designation: e.target.value })}
                  placeholder="Engineer"
                />
              </div>
              <div>
                <label className="font-medium text-muted-foreground mb-1 block">
                  Iqama / ID Number
                </label>
                <Input
                  value={form.idNumber || ""}
                  onChange={(e) => setForm({ ...form, idNumber: e.target.value })}
                  placeholder="1063800229"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-muted-foreground mb-1 block">
                  Iqama Expiry Date *
                </label>
                <Input
                  type="date"
                  value={form.iqamaExpiryDate || ""}
                  onChange={(e) =>
                    setForm({ ...form, iqamaExpiryDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="font-medium text-muted-foreground mb-1 block">
                  DACO ID
                </label>
                <Input
                  value={form.dacoId || ""}
                  onChange={(e) => setForm({ ...form, dacoId: e.target.value })}
                  placeholder="DAC-9011"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-muted-foreground mb-1 block">
                  DACO Expiry Date
                </label>
                <Input
                  type="date"
                  value={form.dacoExpiryDate || ""}
                  onChange={(e) =>
                    setForm({ ...form, dacoExpiryDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="font-medium text-muted-foreground mb-1 block">
                  Group / Department
                </label>
                <Input
                  value={form.group || ""}
                  onChange={(e) => setForm({ ...form, group: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="font-medium text-muted-foreground mb-1 block">
                Company Name
              </label>
              <Input
                value={form.companyName || ""}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              />
            </div>

            <div>
              <label className="font-medium text-muted-foreground mb-1 block">
                Renewal Remark
              </label>
              <Input
                value={form.remark || ""}
                onChange={(e) => setForm({ ...form, remark: e.target.value })}
                placeholder="e.g. Iqama renewal fees paid"
              />
            </div>

            <Button onClick={handleSave} className="w-full mt-2 bg-primary">
              <RefreshCw className="h-4 w-4 mr-1.5" />
              {editingRecord ? "Update Record" : "Save Record"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// "ALL" card => filter value "all", other cards => their status key
function filterValueFor(key: StatusKey | "ALL"): string {
  return key === "ALL" ? "all" : key;
}
