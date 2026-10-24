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
 Building2,
 Download,
 FileText,
 Pencil,
 Plus,
 RefreshCw,
 RotateCcw,
 ShieldAlert,
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

const STATUS_STYLES: Record<StatusKey, string> = {
 EXPIRED:
  "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20 animate-pulse",
 URGENT: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20",
 SOON: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/20",
 NEAR: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
 VALID:
  "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
 UNKNOWN: "bg-muted text-muted-foreground border-border",
};

// Text shown in the badge
const getStatusLabel = (days: number | null): string => {
 const key = getStatusKey(days);
 if (days === null) return "No Date";
 if (key === "EXPIRED") return `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`;
 if (days === 0) return "Expires Today";
 if (key === "URGENT") return `Urgent • ${days} Days Left`;
 if (key === "SOON") return `Expiring Soon • ${days} Days Left`;
 if (key === "NEAR") return `Near Expiry • ${days} Days Left`;
 return `Valid • ${days} Days Left`;
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

// Badge with date + dynamic status
const renderExpiryBadge = (dateString?: string) => {
 const days = getDaysRemaining(dateString);
 if (days === null) return <span className="text-muted-foreground">—</span>;

 return (
  <div className="flex flex-col gap-0.5">
   <span className="text-xs font-mono font-medium">{dateString}</span>
   <span
    className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold inline-block text-center w-fit ${STATUS_STYLES[getStatusKey(days)]}`}
   >
    {getStatusLabel(days)}
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

 // Persist every change (add / edit)
 useEffect(() => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
 }, [data]);

 const [search, setSearch] = useState("");
 const [groupFilter, setGroupFilter] = useState("all");
 const [expiryStatusFilter, setExpiryStatusFilter] = useState("all");
 const [pageSize, setPageSize] = useState<number>(10);
 const [page, setPage] = useState(1); // FIX: was 2, so table opened on an empty page
 const [dialogOpen, setDialogOpen] = useState(false);
 const [editingRecord, setEditingRecord] = useState<MockDocumentExpiry | null>(
  null,
 );
 const [form, setForm] = useState<Partial<MockDocumentExpiry>>(emptyForm);

 // Reset table back to Expiration.json
 const resetToJson = () => {
  localStorage.removeItem(STORAGE_KEY);
  setData(SEED_DATA);
  setPage(1); // FIX: was 2
  toast.success("Data reset from Expiration.json");
 };

 // Dynamic Group filter options
 const groupOptions = useMemo(() => {
  const uniqueGroups = Array.from(
   new Set(data.map((e) => e.group).filter(Boolean)),
  );
  return uniqueGroups.map((g) => ({ label: g, value: g }));
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
    has(item.companyName);

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
   filtered.map((e) => ({
    "SL No": e.slNo,
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
     "#",
     "Emp ID",
     "Name",
     "Iqama No.",
     "Iqama Expiry",
     "Iqama Status",
     "DACO ID",
     "DACO Expiry",
     "DACO Status",
     "Group",
    ],
   ],
   body: filtered.map((e) => [
    e.slNo,
    e.employeeId,
    e.name,
    e.idNumber,
    e.iqamaExpiryDate || "—",
    getStatusText(getDaysRemaining(e.iqamaExpiryDate)),
    e.dacoId || "—",
    e.dacoExpiryDate || "—",
    getStatusText(getDaysRemaining(e.dacoExpiryDate)),
    e.group,
   ]),
   styles: { fontSize: 8 },
  });
  doc.save("iqama_daco_expiry_report.pdf");
  toast.success("PDF report downloaded");
 };

 const columns: Column<MockDocumentExpiry>[] = [
  {
   key: "slNo",
   label: "#",
   render: (emp) => (
    <span className="text-xs text-muted-foreground font-mono font-medium">
     {emp.slNo}
    </span>
   ),
  },
  {
   key: "employeeId",
   label: "Emp ID",
   render: (emp) => (
    <span className="font-semibold text-xs text-primary font-mono">
     {emp.employeeId}
    </span>
   ),
  },
  {
   key: "name",
   label: "Employee",
   render: (emp) => (
    <div className="flex items-center gap-2.5 min-w-[170px]">
     <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs border border-primary/20">
      {emp.name.slice(0, 2).toUpperCase()}
     </div>
     <div className="truncate">
      <p className="font-medium text-xs leading-none text-foreground">
       {emp.name}
      </p>
      <p className="text-[11px] text-muted-foreground truncate mt-1">
       {emp.designation} • {emp.nationality}
      </p>
     </div>
    </div>
   ),
  },
  {
   key: "iqamaExpiryDate",
   label: "Iqama / ID Expiry",
   render: (emp) => (
    <div className="min-w-[140px]">
     <p className="text-[11px] text-muted-foreground font-mono mb-0.5">
      ID: {emp.idNumber}
     </p>
     {renderExpiryBadge(emp.iqamaExpiryDate)}
    </div>
   ),
  },
  {
   key: "dacoExpiryDate",
   label: "DACO ID Expiry",
   render: (emp) => (
    <div className="min-w-[140px]">
     <p className="text-[11px] text-muted-foreground font-mono mb-0.5">
      DACO: {emp.dacoId || "—"}
     </p>
     {renderExpiryBadge(emp.dacoExpiryDate)}
    </div>
   ),
  },
  {
   key: "group",
   label: "Group & Company",
   render: (emp) => (
    <div className="min-w-[150px]">
     <p className="text-xs font-medium text-foreground">{emp.group}</p>
     <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
      <Building2 className="h-3 w-3 shrink-0" />
      <span className="truncate">{emp.companyName}</span>
     </div>
    </div>
   ),
  },
  {
   // Dynamic overall status (calculated from dates, not from JSON "status")
   key: "status",
   label: "Status / Remark",
   render: (emp) => {
    const days = getOverallDays(emp);
    return (
     <div className="flex flex-col gap-1 min-w-[150px]">
      <span
       className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold w-fit ${STATUS_STYLES[getStatusKey(days)]}`}
      >
       {getStatusLabel(days)}
      </span>
      {emp.remark && (
       <span className="text-[11px] text-muted-foreground italic truncate max-w-[150px] block">
        {emp.remark}
       </span>
      )}
     </div>
    );
   },
  },
  {
   key: "actions",
   label: "Actions",
   className:
    "text-right sticky right-0 bg-background/95 backdrop-blur-sm z-10",
   render: (emp) => (
    <div
     className="flex items-center justify-end gap-1"
     onClick={(e) => e.stopPropagation()}
    >
     <button
      onClick={() => openEdit(emp)}
      className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
      title="Update Expiry Dates"
     >
      <Pencil className="h-3.5 w-3.5" />
     </button>
    </div>
   ),
  },
 ];

 return (
  <motion.div
   initial={{ opacity: 0 }}
   animate={{ opacity: 1 }}
   className="space-y-4 p-4 md:p-6"
  >
   {/* Header Bar */}
   <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
    <div>
     <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
      <ShieldAlert className="h-6 w-6 text-amber-500" />
      Iqama & DACO Expiry Tracker
     </h1>
     <p className="text-muted-foreground text-xs mt-0.5">
      Monitoring document expiration dates and remaining countdown days
     </p>
    </div>
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

   {/* Main Table */}
   <div className="border rounded-xl shadow-sm bg-card overflow-hidden">
    <div
     className={`w-full overflow-x-auto ${paginated.length > 10
      ? "max-h-[520px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20"
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
      searchPlaceholder="Search Employee, Iqama, DACO ID, Group..."
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
