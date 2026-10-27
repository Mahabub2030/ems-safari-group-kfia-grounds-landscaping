import { Button } from "@/components/ui/button";
import {
 DataTable,
 type Column,
 type FilterOption,
} from "@/components/ui/DataTable";
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
 AlertTriangle,
 CalendarDays,
 CheckCircle2,
 Clock,
 Download,
 FileText,
 Hourglass,
 Pencil,
 Plus,
 RefreshCw,
 RotateCcw,
 ShieldAlert,
 Users,
 XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

// Data file: src/data/Expiration.json  (needs "resolveJsonModule": true in tsconfig.json)
// Component: src/pages/Expiration.tsx
// "@" must point to "src". If it doesn't, use the relative path: "../data/Expiration.json"
import expiryJson from "@/data/Expiration.json";

export interface MockDocumentExpiry {
 slNo: number;
 name: string;
 email?: string;
 status: string;
 employeeId: string;
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
// Returns undefined when it can't understand the value (e.g. Hijri text).
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

 if (m < 1 || m > 12 || d < 1 || d > 31) return undefined;
 return `${y}-${pad(m)}-${pad(d)}`;
};

// Works with both [ ... ] and { "data": [ ... ] } JSON files
const RAW_ROWS: Partial<MockDocumentExpiry>[] = Array.isArray(expiryJson)
 ? (expiryJson as unknown as Partial<MockDocumentExpiry>[])
 : (((expiryJson as unknown as { data?: unknown[] }).data ??
  []) as Partial<MockDocumentExpiry>[]);

const SEED_DATA: MockDocumentExpiry[] = RAW_ROWS.map((item, index) => ({
 ...item,
 slNo: item.slNo ?? index + 1, // JSON has no slNo, so generate one
 // normalise dates to YYYY-MM-DD (also needed by the <input type="date"> in the form)
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

// Short label for the status pill
const SHORT_LABEL: Record<StatusKey, string> = {
 EXPIRED: "Expired",
 URGENT: "Urgent",
 SOON: "Expiring Soon",
 NEAR: "Near Expiry",
 VALID: "Valid",
 UNKNOWN: "No Date",
};

// Colour of the "Remaining" text
const REMAINING_STYLES: Record<StatusKey, string> = {
 EXPIRED: "text-purple-600 dark:text-purple-400",
 URGENT: "text-rose-600 dark:text-rose-400",
 SOON: "text-orange-600 dark:text-orange-400",
 NEAR: "text-amber-600 dark:text-amber-400",
 VALID: "text-emerald-600 dark:text-emerald-400",
 UNKNOWN: "text-muted-foreground",
};

// Soft pill (background + text + thin border)
const PILL_STYLES: Record<StatusKey, string> = {
 EXPIRED:
  "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20",
 URGENT:
  "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
 SOON: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20",
 NEAR: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
 VALID:
  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
 UNKNOWN: "bg-muted text-muted-foreground border border-border",
};

// Small dot inside the status pill
const DOT_STYLES: Record<StatusKey, string> = {
 EXPIRED: "bg-purple-500",
 URGENT: "bg-rose-500",
 SOON: "bg-orange-500",
 NEAR: "bg-amber-500",
 VALID: "bg-emerald-500",
 UNKNOWN: "bg-muted-foreground/50",
};

// Progress bar colour
const BAR_STYLES: Record<StatusKey, string> = {
 EXPIRED: "bg-purple-500",
 URGENT: "bg-rose-500",
 SOON: "bg-orange-500",
 NEAR: "bg-amber-500",
 VALID: "bg-emerald-500",
 UNKNOWN: "bg-muted-foreground/30",
};

// "20753d overdue" / "45d left" / "Today"
const getRemainingText = (days: number | null) => {
 if (days === null) return "—";
 if (days < 0) return `${Math.abs(days)}d overdue`;
 if (days === 0) return "Today";
 return `${days}d left`;
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

// Initials for the avatar (e.g. "Shoeib Abou Zied" => "SA")
const getInitials = (name?: string) => {
 const parts = String(name ?? "").trim().split(/\s+/).filter(Boolean);
 if (parts.length === 0) return "?";
 if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
 return (parts[0][0] + parts[1][0]).toUpperCase();
};

// Date + small days-left chip (used for Iqama / DACO expiry columns)
const renderExpiryCell = (date?: string) => {
 const days = getDaysRemaining(date);
 if (days === null) {
  return <span className="text-muted-foreground">—</span>;
 }
 const key = getStatusKey(days);
 return (
  <div className="flex flex-col gap-1">
   <span className="font-mono text-[13px] text-foreground">{date}</span>
   <span
    className={`inline-flex w-fit items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${PILL_STYLES[key]}`}
   >
    {getRemainingText(days)}
   </span>
  </div>
 );
};

const filterStatusOptions: FilterOption[] = [
 { label: "Expired", value: "EXPIRED" },
 { label: `Urgent (≤ ${URGENT_DAYS} Days)`, value: "URGENT" },
 { label: `Expiring Soon (≤ ${SOON_DAYS} Days)`, value: "SOON" },
 { label: `Near Expiry (≤ ${NEAR_DAYS} Days)`, value: "NEAR" },
 { label: "Valid", value: "VALID" },
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

export default function Expiration() {
 // Load from localStorage; if empty/corrupted, fall back to Expiration.json
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
 const [pageSize, setPageSize] = useState<number>(10);
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

 // Search + filters
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
    has(item.group) ||
    has(item.companyName) ||
    has(item.remark);

   const matchGroup = groupFilter === "all" || item.group === groupFilter;

   // Overall status = worst of Iqama / DACO
   const matchExpiry =
    expiryStatusFilter === "all" ||
    getStatusKey(getOverallDays(item)) === expiryStatusFilter;

   return matchSearch && matchGroup && matchExpiry;
  });
 }, [data, search, groupFilter, expiryStatusFilter]);

 const paginated = useMemo(() => {
  if (pageSize === 0) return filtered;
  return filtered.slice((page - 1) * pageSize, page * pageSize);
 }, [filtered, page, pageSize]);

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

 // Save a comment typed directly in the table
 const updateRemark = (slNo: number, value: string) => {
  const trimmed = value.trim();
  const current = data.find((d) => d.slNo === slNo);
  if (!current || (current.remark ?? "") === trimmed) return;
  setData((prev) =>
   prev.map((item) =>
    item.slNo === slNo ? { ...item, remark: trimmed } : item,
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

  if (editingRecord) {
   setData((prev) =>
    prev.map((item) =>
     item.slNo === editingRecord.slNo
      ? ({ ...item, ...form } as MockDocumentExpiry)
      : item,
    ),
   );
   toast.success("Document expiry dates updated");
  } else {
   const newRec: MockDocumentExpiry = {
    ...form,
    slNo: Date.now(),
    name: form.name || "",
    employeeId: form.employeeId || "",
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

 const exportExcel = () => {
  const ws = XLSX.utils.json_to_sheet(
   filtered.map((e, i) => ({
    "Sr No": i + 1,
    "Employee ID": e.employeeId,
    Name: e.name,
    "Iqama / ID": e.idNumber,
    "Iqama Expiry": e.iqamaExpiryDate || "N/A",
    "Iqama Days Left": getDaysRemaining(e.iqamaExpiryDate) ?? "N/A",
    "Iqama Status": getStatusText(getDaysRemaining(e.iqamaExpiryDate)),
    "DACO ID": e.dacoId || "",
    "DACO Expiry": e.dacoExpiryDate || "",
    "DACO Days Left": getDaysRemaining(e.dacoExpiryDate) ?? "N/A",
    "DACO Status": getStatusText(getDaysRemaining(e.dacoExpiryDate)),
    "Overall Status": getStatusText(getOverallDays(e)),
    Group: e.group,
    Company: e.companyName,
    Location: e.workLocation || "",
    Remark: e.remark || "",
   })),
  );
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Expiry_Report");
  XLSX.writeFile(wb, "iqama_daco_expiry_report.xlsx");
  toast.success("Excel report downloaded");
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
   body: filtered.map((e, i) => [
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

 const columns: Column<MockDocumentExpiry>[] = [
  {
   // Running serial number (1, 2, 3 ...) that follows search / filters / pages
   key: "srNo",
   label: "SR NO",
   render: (emp) => (
    <span className="inline-flex h-6 min-w-[28px] items-center justify-center rounded-md bg-muted/60 px-1.5 text-[11px] font-mono font-semibold text-muted-foreground">
     {filtered.findIndex((x) => x.slNo === emp.slNo) + 1}
    </span>
   ),
  },
  {
   key: "name",
   label: "EMPLOYEE",
   render: (emp) => {
    const key = getStatusKey(getOverallDays(emp));
    return (
     <div className="flex items-center gap-3 min-w-[220px]">
      <div
       className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${PILL_STYLES[key]}`}
      >
       {getInitials(emp.name)}
      </div>
      <div className="min-w-0">
       <p className="truncate text-sm font-semibold leading-tight text-foreground">
        {emp.name}
       </p>
       <p className="mt-0.5 truncate text-xs text-muted-foreground">
        <span className="font-mono">{emp.employeeId}</span>
        <span className="mx-1.5 text-muted-foreground/40">•</span>
        {emp.designation}
       </p>
      </div>
     </div>
    );
   },
  },
  {
   key: "idNumber",
   label: "IQAMA NO.",
   render: (emp) => (
    <span className="font-mono text-[13px] tracking-wide text-foreground/80">
     {emp.idNumber}
    </span>
   ),
  },
  {
   key: "iqamaExpiryDate",
   label: "IQAMA EXPIRY",
   render: (emp) => renderExpiryCell(emp.iqamaExpiryDate),
  },
  {
   key: "dacoId",
   label: "DACO ID",
   render: (emp) => (
    <span className="font-mono text-[13px] tracking-wide text-foreground/80">
     {emp.dacoId || "—"}
    </span>
   ),
  },
  {
   key: "dacoExpiryDate",
   label: "DACO EXPIRY",
   render: (emp) => renderExpiryCell(emp.dacoExpiryDate),
  },
  {
   key: "remaining",
   label: "REMAINING",
   render: (emp) => {
    const days = getOverallDays(emp); // worst of Iqama / DACO
    const key = getStatusKey(days);
    // bar = how much of a 365 day window is left (full bar when overdue)
    const pct =
     days === null
      ? 0
      : days < 0
       ? 100
       : Math.max(4, Math.min(100, (days / 365) * 100));
    return (
     <div className="min-w-[120px]">
      <span
       className={`font-mono text-[13px] font-semibold ${REMAINING_STYLES[key]}`}
      >
       {getRemainingText(days)}
      </span>
      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
       <div
        className={`h-full rounded-full ${BAR_STYLES[key]}`}
        style={{ width: `${pct}%` }}
       />
      </div>
     </div>
    );
   },
  },
  {
   key: "status",
   label: "STATUS",
   render: (emp) => {
    const key = getStatusKey(getOverallDays(emp));
    return (
     <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${PILL_STYLES[key]}`}
     >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT_STYLES[key]}`} />
      {SHORT_LABEL[key]}
     </span>
    );
   },
  },
  {
   // Type a comment and press Enter (or click outside) to save
   key: "remark",
   label: "REMARK",
   render: (emp) => (
    <input
     key={`${emp.slNo}-${emp.remark ?? ""}`}
     defaultValue={emp.remark ?? ""}
     placeholder="Add comment..."
     onClick={(e) => e.stopPropagation()}
     onBlur={(e) => updateRemark(emp.slNo, e.target.value)}
     onKeyDown={(e) => {
      if (e.key === "Enter") (e.target as HTMLInputElement).blur();
     }}
     className="h-8 w-[200px] rounded-md border border-dashed border-transparent bg-transparent px-2 text-xs text-foreground placeholder:text-muted-foreground/50 hover:border-border focus:border-solid focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
    />
   ),
  },
  {
   key: "actions",
   label: "",
   className: "text-right",
   render: (emp) => (
    <div
     className="flex items-center justify-end"
     onClick={(e) => e.stopPropagation()}
    >
     <button
      onClick={() => openEdit(emp)}
      className="rounded-md border border-transparent p-1.5 text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-primary"
      title="Update Expiry Dates"
     >
      <Pencil className="h-3.5 w-3.5" />
     </button>
    </div>
   ),
  },
 ];

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

   {/* Control Bar */}
   <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3 border rounded-xl shadow-sm">
    <div className="flex flex-wrap items-center gap-4">
     <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground font-medium">
       Group:
      </span>
      <Select
       value={groupFilter}
       onValueChange={(v) => {
        setGroupFilter(v);
        setPage(1);
       }}
      >
       <SelectTrigger className="h-8 text-xs w-[180px]">
        <SelectValue placeholder="All Groups" />
       </SelectTrigger>
       <SelectContent>
        <SelectItem value="all">All Groups</SelectItem>
        {groupOptions.map((g) => (
         <SelectItem key={g.value} value={g.value}>
          {g.label}
         </SelectItem>
        ))}
       </SelectContent>
      </Select>
     </div>
    </div>

    <div className="flex items-center gap-2 text-xs text-muted-foreground">
     <span>Rows per page:</span>
     <Select
      value={String(pageSize)}
      onValueChange={(v) => {
       setPageSize(Number(v));
       setPage(1);
      }}
     >
      <SelectTrigger className="h-8 text-xs w-[80px]">
       <SelectValue />
      </SelectTrigger>
      <SelectContent>
       <SelectItem value="10">10</SelectItem>
       <SelectItem value="50">50</SelectItem>
       <SelectItem value="100">100</SelectItem>
       <SelectItem value="0">All</SelectItem>
      </SelectContent>
     </Select>
    </div>
   </div>

   {/* Main Table
       The [&_...] classes style the table inside DataTable: grey sticky header,
       uppercase labels, row hover and comfortable row height. */}
   <div className="border rounded-xl shadow-sm bg-card overflow-hidden">
    <div
     className={`w-full overflow-x-auto
      [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10
      [&_thead_th]:bg-muted/60 [&_thead_th]:backdrop-blur
      [&_thead_th]:whitespace-nowrap [&_thead_th]:text-[11px] [&_thead_th]:font-semibold
      [&_thead_th]:uppercase [&_thead_th]:tracking-wider [&_thead_th]:text-muted-foreground
      [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-muted/40
      [&_tbody_td]:py-3 [&_tbody_td]:align-middle
      ${paginated.length > 10
       ? "max-h-[560px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20"
       : "overflow-y-visible"
      }`}
    >
     <DataTable<MockDocumentExpiry>
      data={paginated}
      columns={columns}
      rowKey={(e) => String(e.slNo)}
      search={search}
      onSearchChange={(v) => {
       setSearch(v);
       setPage(1);
      }}
      searchPlaceholder="Search Employee, Iqama, DACO ID, Remark..."
      filterValue={expiryStatusFilter}
      onFilterChange={(v) => {
       setExpiryStatusFilter(v);
       setPage(1);
      }}
      filterOptions={filterStatusOptions}
      filterPlaceholder="All Expiry Statuses"
      page={page}
      pageSize={pageSize === 0 ? filtered.length || 1 : pageSize}
      total={filtered.length}
      onPageChange={setPage}
      emptyMessage="No matching document expiration records found"
      actions={
       <div className="flex items-center gap-2">
        <Button
         variant="outline"
         size="sm"
         onClick={resetToJson}
         className="h-8 text-xs"
         title="Reload data from Expiration.json"
        >
         <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset
        </Button>
        <Button
         variant="outline"
         size="sm"
         onClick={exportExcel}
         className="h-8 text-xs"
        >
         <Download className="h-3.5 w-3.5 mr-1.5" /> Excel
        </Button>
        <Button
         variant="outline"
         size="sm"
         onClick={exportPDF}
         className="h-8 text-xs"
        >
         <FileText className="h-3.5 w-3.5 mr-1.5" /> PDF
        </Button>
        <Button
         size="sm"
         onClick={openAdd}
         className="h-8 text-xs bg-primary"
        >
         <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Track Record
        </Button>
       </div>
      }
     />
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
         Employee ID *
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
         Iqama / ID Number
        </label>
        <Input
         value={form.idNumber || ""}
         onChange={(e) => setForm({ ...form, idNumber: e.target.value })}
         placeholder="1063800229"
        />
       </div>
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
      </div>

      <div className="grid grid-cols-2 gap-3">
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
      </div>

      <div className="grid grid-cols-2 gap-3">
       <div>
        <label className="font-medium text-muted-foreground mb-1 block">
         Group / Department
        </label>
        <Input
         value={form.group || ""}
         onChange={(e) => setForm({ ...form, group: e.target.value })}
        />
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
