import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
 Briefcase,
 Check,
 ChevronLeft,
 ChevronRight,
 Clock,
 FileSpreadsheet,
 FileText,
 Hourglass,
 Plus,
 RefreshCw,
 Search,
 UserCheck,
 UserPlus,
 UserX,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";

// Local JSON source: src/data/Vacations.json
// Requires "resolveJsonModule": true in tsconfig.json
import vacationsJson from "@/data/Vacations.json";

// ==========================================
// TYPES & INTERFACES
// ==========================================

// Document status values used in the JSON:
// "Received" | "Pending" | "Not Required" | ""  (empty = not recorded yet)
export type DocStatus = "Received" | "Pending" | "Not Required" | "-";

export type DocKey = "visa" | "guaranteeForm" | "ticket" | "other";

export interface RawEmployeeData {
 _id: string;
 serialNo?: number | string;
 employeeId: string;
 emdId?: string;
 iqamaNumber?: string;
 name: string;
 email: string;
 jobTitle: string;
 group: string;
 nationality?: "Saudi" | "Non-Saudi" | string;
 vacationType?: string;
 status: "Active" | "ON_LEAVE" | "UPCOMING" | string;
 applyDate?: string;
 leaveDate?: string;
 month?: string;
 returnDate?: string;
 joiningDate?: string;
 // Travel documents
 visaStatus?: string;
 guaranteeFormStatus?: string;
 ticketStatus?: string;
 otherDocStatus?: string;
 totalVacationDays?: number;
 totalAllowance: number;
 usedDays: number;
 pendingDays: number;
 remainingDays: number;
 nextLeaveDate?: string;
 remark?: string;
 avatarUrl?: string;
}

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

export interface EmployeeVacationRecord extends RawEmployeeData {
 formattedStatus: VacationStatus;
 formattedNationality: "Saudi" | "Non-Saudi" | "-";
 serial: number | string;
 vacationDays: number | string;
 monthLabel: string;
 visa: DocStatus;
 guaranteeForm: DocStatus;
 ticket: DocStatus;
 other: DocStatus;
}

interface EmployeeVacationTablePageProps {
 onAssignVacation?: () => void;
}

// ==========================================
// HELPERS
// ==========================================

const DASH = "-";
const show = (v: unknown): string =>
 v === undefined || v === null || v === "" ? DASH : String(v);

const MONTHS: Record<string, number> = {
 jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
 jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

// Parses "2026-09-01", "01-Sep-2026", "1 Sep 2026" and "01/09/2026" (DD/MM/YYYY).
// Returns a UTC timestamp (so daylight saving never shifts the day count).
const parseDate = (value?: string): number | null => {
 if (!value) return null;
 const s = value.trim();
 let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/); // ISO
 if (m) return Date.UTC(+m[1], +m[2] - 1, +m[3]);
 m = s.match(/^(\d{1,2})[-\s/]([A-Za-z]{3})[A-Za-z]*[-\s/,]*(\d{4})$/); // 01-Sep-2026
 if (m) {
  const mon = MONTHS[m[2].toLowerCase()];
  if (mon !== undefined) return Date.UTC(+m[3], mon, +m[1]);
 }
 m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); // 01/09/2026
 if (m) return Date.UTC(+m[3], +m[2] - 1, +m[1]);
 const t = new Date(s).getTime();
 return Number.isNaN(t) ? null : t;
};

// Total vacation days, counting BOTH the leave day and the return day.
// 01-Sep-2026 to 30-Sep-2026 = 30 days.
const diffDays = (from?: string, to?: string): number | null => {
 const a = parseDate(from);
 const b = parseDate(to);
 if (a === null || b === null || b < a) return null;
 return Math.round((b - a) / 86400000) + 1;
};

const getMonthLabel = (date?: string): string => {
 if (!date) return DASH;
 const t = parseDate(date);
 if (t === null) return DASH;
 return new Date(t).toLocaleString("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
 });
};

const extractRecords = (json: unknown): RawEmployeeData[] => {
 if (Array.isArray(json)) return json as RawEmployeeData[];
 if (json && typeof json === "object") {
  const obj = json as Record<string, unknown>;
  if (Array.isArray(obj.data)) return obj.data as RawEmployeeData[];
  if (Array.isArray(obj.employees)) return obj.employees as RawEmployeeData[];
 }
 return [];
};

// "received", "done", "ready" -> Received | "pending" -> Pending | "n/a" -> Not Required
const normalizeDoc = (v?: string): DocStatus => {
 const k = (v ?? "").toLowerCase().replace(/[\s_-]/g, "");
 if (["received", "done", "ready", "issued", "yes"].includes(k)) return "Received";
 if (k === "pending" || k === "waiting") return "Pending";
 if (["notrequired", "na", "none", "no"].includes(k) && k !== "") {
  return k === "no" ? "-" : "Not Required";
 }
 return "-";
};

// Click order for a document button: - -> Pending -> Received -> Not Required -> -
const DOC_CYCLE: DocStatus[] = ["-", "Pending", "Received", "Not Required"];
const nextDoc = (c: DocStatus): DocStatus =>
 DOC_CYCLE[(DOC_CYCLE.indexOf(c) + 1) % DOC_CYCLE.length];

// Document changes are saved in the browser (Vacations.json is static)
const STORAGE_KEY = "vacation-doc-overrides";

// Inactive and Cancelled rows cannot be edited
const isLocked = (s: VacationStatus) => s === "Inactive" || s === "Cancelled";

const transformEmployeeData = (
 raw: RawEmployeeData,
 index: number,
): EmployeeVacationRecord => {
 let formattedStatus: VacationStatus = "Active";
 const statusKey = (raw.status ?? "").toUpperCase().replace(/[\s_-]/g, "");

 if (statusKey === "ONLEAVE") formattedStatus = "On Leave";
 else if (statusKey === "PENDING") formattedStatus = "Pending";
 else if (statusKey === "UPCOMING") formattedStatus = "Upcoming";
 else if (
  ["REJOINED", "REJOINING", "REJOIN", "RETURNED"].includes(statusKey)
 )
  formattedStatus = "Re-joined";
 else if (statusKey === "FINALEXIT") formattedStatus = "Final Exit";
 else if (statusKey === "TERMINATED" || statusKey === "TERMINATE")
  formattedStatus = "Terminated";
 else if (statusKey === "INACTIVE") formattedStatus = "Inactive";
 else if (
  statusKey === "CANCELLED" ||
  statusKey === "CANCELED" ||
  statusKey === "CENCELLED"
 )
  formattedStatus = "Cancelled";

 const nat = raw.nationality?.toLowerCase().replace(/[\s_-]/g, "") || "";
 let formattedNationality: "Saudi" | "Non-Saudi" | "-" = "-";
 if (nat === "saudi") formattedNationality = "Saudi";
 else if (nat === "nonsaudi") formattedNationality = "Non-Saudi";

 const leaveDate = raw.leaveDate ?? raw.nextLeaveDate;
 const computedDays = diffDays(leaveDate, raw.returnDate);
 const vacationDays =
  computedDays !== null ? computedDays : (raw.totalVacationDays ?? DASH);

 return {
  ...raw,
  leaveDate,
  formattedStatus,
  formattedNationality,
  serial: raw.serialNo ?? index + 1,
  vacationDays,
  monthLabel: raw.month || getMonthLabel(leaveDate),
  visa: normalizeDoc(raw.visaStatus),
  guaranteeForm: normalizeDoc(raw.guaranteeFormStatus),
  ticket: normalizeDoc(raw.ticketStatus),
  other: normalizeDoc(raw.otherDocStatus),
 };
};

// ==========================================
// MAIN COMPONENT
// ==========================================

export const EmployeeVacationTablePage: React.FC<
 EmployeeVacationTablePageProps
> = ({ onAssignVacation }) => {
 const [allEmployees, setAllEmployees] = useState<EmployeeVacationRecord[]>(
  [],
 );
 const [isLoading, setIsLoading] = useState<boolean>(true);
 const [error, setError] = useState<string | null>(null);

 const [searchTerm, setSearchTerm] = useState<string>("");
 const [selectedGroup, setSelectedGroup] = useState<string>("All");
 const [selectedStatus, setSelectedStatus] = useState<string>("All");
 const [selectedNationality, setSelectedNationality] = useState<string>("All");
 const [selectedVacationType, setSelectedVacationType] =
  useState<string>("All");
 const [selectedMonth, setSelectedMonth] = useState<string>("All");
 const [selectedDocs, setSelectedDocs] = useState<string>("All");
 const [currentPage, setCurrentPage] = useState<number>(1);
 const [rowsPerPage, setRowsPerPage] = useState<number | "All">(10);

 const loadEmployeeData = useCallback(() => {
  setIsLoading(true);
  setError(null);
  try {
   const records = extractRecords(vacationsJson);

   // Re-apply document changes saved in the browser
   let saved: Record<string, Partial<Record<DocKey, DocStatus>>> = {};
   try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
   } catch {
    saved = {};
   }

   setAllEmployees(
    records
     .map(transformEmployeeData)
     .map((e) => ({ ...e, ...(saved[e._id] ?? {}) })),
   );
  } catch (err: any) {
   console.error("Failed to read Vacations.json:", err);
   setError(err?.message ?? "Failed to load vacation data");
   setAllEmployees([]);
  } finally {
   setIsLoading(false);
  }
 }, []);

 useEffect(() => {
  loadEmployeeData();
 }, [loadEmployeeData]);

 useEffect(() => {
  setCurrentPage(1);
 }, [
  searchTerm,
  selectedGroup,
  selectedStatus,
  selectedNationality,
  selectedVacationType,
  selectedMonth,
  selectedDocs,
 ]);

 // ------------------------------------------
 // UPDATE A DOCUMENT STATUS (button click)
 // ------------------------------------------
 const updateDoc = (id: string, key: DocKey, value: DocStatus) => {
  setAllEmployees((prev) =>
   prev.map((e) => (e._id === id ? { ...e, [key]: value } : e)),
  );
  try {
   const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
   saved[id] = { ...saved[id], [key]: value };
   localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch {
   /* storage unavailable: change stays in memory only */
  }
 };

 const departments = useMemo(() => {
  const groups = Array.from(new Set(allEmployees.map((e) => e.group)));
  return ["All", ...groups.sort()];
 }, [allEmployees]);

 const vacationTypes = useMemo(() => {
  const types = Array.from(
   new Set(allEmployees.map((e) => e.vacationType).filter(Boolean)),
  ) as string[];
  return ["All", ...types.sort()];
 }, [allEmployees]);

 const months = useMemo(() => {
  const sortKey = new Map<string, number>();
  allEmployees.forEach((e) => {
   if (!e.monthLabel || e.monthLabel === DASH) return;
   let t = parseDate(e.leaveDate) ?? NaN;
   if (Number.isNaN(t)) t = new Date(`1 ${e.monthLabel}`).getTime();
   if (Number.isNaN(t)) t = Number.MAX_SAFE_INTEGER;
   const prev = sortKey.get(e.monthLabel);
   if (prev === undefined || t < prev) sortKey.set(e.monthLabel, t);
  });
  const labels = Array.from(sortKey.entries())
   .sort((a, b) => a[1] - b[1])
   .map(([label]) => label);
  return ["All", ...labels];
 }, [allEmployees]);

 const metrics = useMemo(() => {
  const count = (s: VacationStatus) =>
   allEmployees.filter((e) => e.formattedStatus === s).length;
  return {
   total: allEmployees.length,
   active: count("Active"),
   pending: count("Pending"),
   onLeave: count("On Leave"),
   upcoming: count("Upcoming"),
   rejoined: count("Re-joined"),
  };
 }, [allEmployees]);

 const filteredEmployees = useMemo(() => {
  const term = searchTerm.toLowerCase();
  const has = (v?: string | number) =>
   v !== undefined && String(v).toLowerCase().includes(term);

  return allEmployees.filter((emp) => {
   const matchesSearch =
    has(emp.name) ||
    has(emp.employeeId) ||
    has(emp.email) ||
    has(emp.jobTitle) ||
    has(emp.emdId) ||
    has(emp.iqamaNumber) ||
    has(emp.serial);

   const matchesGroup =
    selectedGroup === "All" || emp.group === selectedGroup;
   const matchesStatus =
    selectedStatus === "All" || emp.formattedStatus === selectedStatus;
   const matchesNationality =
    selectedNationality === "All" ||
    emp.formattedNationality === selectedNationality;
   const matchesVacationType =
    selectedVacationType === "All" ||
    emp.vacationType === selectedVacationType;
   const matchesMonth =
    selectedMonth === "All" || emp.monthLabel === selectedMonth;

   // Documents filter: "Missing" = any document not yet received
   const docs = [emp.visa, emp.guaranteeForm, emp.ticket, emp.other];
   const matchesDocs =
    selectedDocs === "All" ||
    (selectedDocs === "Missing" &&
     docs.some((d) => d !== "Received" && d !== "Not Required")) ||
    (selectedDocs === "Complete" &&
     docs.every((d) => d === "Received" || d === "Not Required"));

   return (
    matchesSearch &&
    matchesGroup &&
    matchesStatus &&
    matchesNationality &&
    matchesVacationType &&
    matchesMonth &&
    matchesDocs
   );
  });
 }, [
  allEmployees,
  searchTerm,
  selectedGroup,
  selectedStatus,
  selectedNationality,
  selectedVacationType,
  selectedMonth,
  selectedDocs,
 ]);

 const itemsPerPage =
  rowsPerPage === "All" ? Math.max(filteredEmployees.length, 1) : rowsPerPage;
 const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage) || 1;

 const paginatedEmployees = useMemo(() => {
  const start = (currentPage - 1) * itemsPerPage;
  return filteredEmployees.slice(start, start + itemsPerPage);
 }, [filteredEmployees, currentPage, itemsPerPage]);

 // ------------------------------------------
 // EXPORT TO EXCEL
 // ------------------------------------------
 const handleExportExcel = () => {
  const exportData = filteredEmployees.map((emp) => ({
   "Serial No": emp.serial,
   "Employee ID": emp.employeeId,
   "EMD ID": show(emp.emdId),
   "Iqama Number": show(emp.iqamaNumber),
   Name: emp.name,
   Email: emp.email,
   "Job Title": emp.jobTitle,
   Department: emp.group,
   Nationality: emp.formattedNationality,
   "Vacation Type": show(emp.vacationType),
   Status: emp.formattedStatus,
   Month: emp.monthLabel,
   "Apply Date": show(emp.applyDate),
   "Leave Date": show(emp.leaveDate),
   "Returning Date": show(emp.returnDate),
   "Joining Date": show(emp.joiningDate),
   Visa: emp.visa,
   "Guarantee Form": emp.guaranteeForm,
   Ticket: emp.ticket,
   "Other Docs": emp.other,
   "Total Vacation Days": emp.vacationDays,
   "Total Allowance": emp.totalAllowance,
   "Used Days": emp.usedDays,
   "Pending Days": emp.pendingDays,
   "Remaining Days": emp.remainingDays,
   Remark: show(emp.remark),
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Vacation Report");
  XLSX.writeFile(workbook, `Employee_Vacation_Report_${Date.now()}.xlsx`);
 };

 // ------------------------------------------
 // EXPORT TO PDF
 // ------------------------------------------
 const handleExportPDF = () => {
  const doc = new jsPDF("landscape", "mm", "a3");

  doc.setFontSize(16);
  doc.text("Employee Vacation Tracker Report", 14, 15);
  doc.setFontSize(10);
  doc.text(
   `Generated on: ${new Date().toLocaleDateString()}${
    selectedMonth !== "All" ? `  |  Month: ${selectedMonth}` : ""
   }`,
   14,
   22,
  );

  const tableHeaders = [
   [
    "S.No",
    "Emp ID",
    "EMD ID",
    "Iqama No",
    "Name",
    "Job Title",
    "Dept",
    "Nationality",
    "Vac. Type",
    "Status",
    "Month",
    "Apply Date",
    "Leave Date",
    "Return Date",
    "Joining Date",
    "Visa",
    "Guarantee",
    "Ticket",
    "Other",
    "Vac. Days",
    "Allow.",
    "Used",
    "Pend.",
    "Rem.",
    "Remark",
   ],
  ];

  const tableRows = filteredEmployees.map((emp) => [
   emp.serial,
   emp.employeeId,
   show(emp.emdId),
   show(emp.iqamaNumber),
   emp.name,
   emp.jobTitle,
   emp.group,
   emp.formattedNationality,
   show(emp.vacationType),
   emp.formattedStatus,
   emp.monthLabel,
   show(emp.applyDate),
   show(emp.leaveDate),
   show(emp.returnDate),
   show(emp.joiningDate),
   emp.visa,
   emp.guaranteeForm,
   emp.ticket,
   emp.other,
   emp.vacationDays,
   `${emp.totalAllowance} d`,
   `${emp.usedDays} d`,
   `${emp.pendingDays} d`,
   `${emp.remainingDays} d`,
   show(emp.remark),
  ]);

  autoTable(doc, {
   head: tableHeaders,
   body: tableRows,
   startY: 28,
   theme: "striped",
   headStyles: { fillColor: [51, 65, 85] }, // neutral slate
   styles: { fontSize: 7, overflow: "linebreak" },
   columnStyles: { 24: { cellWidth: 60 } }, // Remark column
  });

  doc.save(`Employee_Vacation_Report_${Date.now()}.pdf`);
 };

 // ------------------------------------------
 // STATUS BUTTON
 //  Pending    -> yellow
 //  On Leave   -> green
 //  Re-joined  -> purple
 //  Final Exit -> red
 //  Cancelled  -> red
 //  Inactive   -> faded grey (whole row is disabled)
 //  others     -> plain neutral
 // ------------------------------------------
 const renderStatusBadge = (status: VacationStatus) => {
  const base =
   "inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold border";
  let cls =
   "bg-white text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600";

  if (status === "Pending")
   cls = "bg-yellow-400 text-yellow-950 border-yellow-500";
  else if (status === "On Leave")
   cls = "bg-green-600 text-white border-green-700";
  else if (status === "Re-joined")
   cls = "bg-purple-600 text-white border-purple-700";
  else if (status === "Final Exit")
   cls = "bg-red-600 text-white border-red-700";
  else if (status === "Cancelled")
   cls = "bg-red-500 text-white border-red-600";
  else if (status === "Inactive")
   cls = "bg-slate-200 text-slate-500 border-slate-300";

  return <span className={`${base} ${cls}`}>{status}</span>;
 };

 // Row color:
 //  Cancelled -> red row
 //  Inactive  -> whole row disabled (faded, greyscale, not clickable)
 const getRowClasses = (status: VacationStatus) => {
  if (status === "Cancelled")
   return "bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 [&>td]:text-red-800 dark:[&>td]:text-red-200";
  if (status === "Inactive")
   return "bg-slate-100 dark:bg-slate-800 opacity-50 grayscale pointer-events-none select-none";
  return "hover:bg-slate-50 dark:hover:bg-slate-700/30";
 };

 // Plain text nationality / vacation type (no colors)
 const renderPlainTag = (value?: string) =>
  !value || value === DASH ? (
   <span className="text-slate-400">{DASH}</span>
  ) : (
   <span className="inline-flex px-2.5 py-0.5 rounded-md text-xs font-medium border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200">
    {value}
   </span>
  );

 // Document cell as a button. Click to cycle:
 // Add (-) -> Pending -> Received -> N/A (Not Required) -> Add
 const renderDocButton = (emp: EmployeeVacationRecord, key: DocKey) => {
  const value = emp[key];
  const locked = isLocked(emp.formattedStatus);

  let cls =
   "border-dashed border-slate-300 text-slate-500 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700";
  let content: React.ReactNode = (
   <>
    <Plus className="w-3 h-3" /> Add
   </>
  );

  if (value === "Received") {
   cls = "border-green-600 bg-green-600 text-white hover:bg-green-700";
   content = (
    <>
     <Check className="w-3.5 h-3.5" /> Received
    </>
   );
  } else if (value === "Pending") {
   cls = "border-yellow-500 bg-yellow-400 text-yellow-950 hover:bg-yellow-300";
   content = "Pending";
  } else if (value === "Not Required") {
   cls =
    "border-slate-300 bg-slate-100 text-slate-500 hover:bg-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300";
   content = "N/A";
  }

  return (
   <button
    type="button"
    disabled={locked}
    onClick={() => updateDoc(emp._id, key, nextDoc(value))}
    title={locked ? "Row is locked" : "Click to change status"}
    className={`inline-flex items-center justify-center gap-1 min-w-[84px] px-2.5 py-1 rounded-md text-xs font-semibold border transition disabled:cursor-not-allowed disabled:opacity-60 ${cls}`}
   >
    {content}
   </button>
  );
 };

 const TABLE_COLUMNS = 23;

 const metricCards = [
  { label: "Total Employees", value: metrics.total, Icon: Briefcase },
  { label: "Active On-Duty", value: metrics.active, Icon: UserCheck },
  { label: "Currently On Leave", value: metrics.onLeave, Icon: UserX },
  { label: "Upcoming Leave", value: metrics.upcoming, Icon: Clock },
  { label: "Pending", value: metrics.pending, Icon: Hourglass },
  { label: "Re-joined", value: metrics.rejoined, Icon: UserPlus },
 ];

 const selectCls =
  "px-3 py-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400";

 return (
  <div className="p-6 w-full mx-auto space-y-6 bg-slate-50 dark:bg-slate-900 min-h-screen text-slate-900 dark:text-slate-100">
   {/* Header */}
   <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <div>
     <h1 className="text-2xl font-bold tracking-tight">
      Employee Vacation Tracker
     </h1>
     <p className="text-sm text-slate-500 dark:text-slate-400">
      Monitor allowance balances, leaves, and travel documents.
     </p>
    </div>
    <div className="flex flex-wrap items-center gap-3">
     <button
      onClick={loadEmployeeData}
      className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
      title="Refresh Data"
     >
      <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
     </button>

     <button
      onClick={handleExportExcel}
      className="flex items-center gap-2 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 px-3.5 py-2 rounded-lg text-sm font-medium transition"
     >
      <FileSpreadsheet className="w-4 h-4" /> Excel
     </button>

     <button
      onClick={handleExportPDF}
      className="flex items-center gap-2 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 px-3.5 py-2 rounded-lg text-sm font-medium transition"
     >
      <FileText className="w-4 h-4" /> PDF
     </button>

     <button
      onClick={onAssignVacation}
      className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"
     >
      <Plus className="w-4 h-4" /> Assign Vacation
     </button>
    </div>
   </div>

   {error && (
    <div className="p-3 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200">
     {error}
    </div>
   )}

   {/* Metrics Cards (neutral) */}
   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
    {metricCards.map(({ label, value, Icon }) => (
     <div
      key={label}
      className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4"
     >
      <div className="p-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg">
       <Icon className="w-6 h-6" />
      </div>
      <div>
       <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
        {label}
       </p>
       <p className="text-2xl font-semibold">{value}</p>
      </div>
     </div>
    ))}
   </div>

   {/* Filter Bar */}
   <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-center">
    <div className="relative w-full lg:w-80">
     <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
     <input
      type="text"
      placeholder="Search name, ID, EMD, Iqama, title..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
     />
    </div>

    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
     <select
      value={selectedMonth}
      onChange={(e) => setSelectedMonth(e.target.value)}
      className={selectCls}
     >
      {months.map((m) => (
       <option key={m} value={m}>
        Month: {m}
       </option>
      ))}
     </select>

     <select
      value={selectedGroup}
      onChange={(e) => setSelectedGroup(e.target.value)}
      className={selectCls}
     >
      {departments.map((dept) => (
       <option key={dept} value={dept}>
        Department: {dept}
       </option>
      ))}
     </select>

     <select
      value={selectedNationality}
      onChange={(e) => setSelectedNationality(e.target.value)}
      className={selectCls}
     >
      <option value="All">Nationality: All</option>
      <option value="Saudi">Nationality: Saudi</option>
      <option value="Non-Saudi">Nationality: Non-Saudi</option>
     </select>

     <select
      value={selectedVacationType}
      onChange={(e) => setSelectedVacationType(e.target.value)}
      className={selectCls}
     >
      {vacationTypes.map((type) => (
       <option key={type} value={type}>
        Vacation Type: {type}
       </option>
      ))}
     </select>

     <select
      value={selectedDocs}
      onChange={(e) => setSelectedDocs(e.target.value)}
      className={selectCls}
     >
      <option value="All">Documents: All</option>
      <option value="Missing">Documents: Missing</option>
      <option value="Complete">Documents: Complete</option>
     </select>

     <select
      value={selectedStatus}
      onChange={(e) => setSelectedStatus(e.target.value)}
      className={selectCls}
     >
      <option value="All">Status: All</option>
      <option value="Active">Status: Active</option>
      <option value="Pending">Status: Pending</option>
      <option value="On Leave">Status: On Leave</option>
      <option value="Upcoming">Status: Upcoming</option>
      <option value="Re-joined">Status: Re-joined</option>
      <option value="Final Exit">Status: Final Exit</option>
      <option value="Terminated">Status: Terminated</option>
      <option value="Inactive">Status: Inactive</option>
      <option value="Cancelled">Status: Cancelled</option>
     </select>
    </div>
   </div>

   {/* Main Table */}
   <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
    <div className="overflow-x-auto">
     <table className="w-full text-left text-sm whitespace-nowrap">
      <thead className="bg-slate-100/75 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
       <tr>
        <th className="py-3.5 px-4">Serial No</th>
        <th className="py-3.5 px-4">Employee</th>
        <th className="py-3.5 px-4">EMD ID</th>
        <th className="py-3.5 px-4">Iqama No</th>
        <th className="py-3.5 px-4">Nationality</th>
        <th className="py-3.5 px-4">Department</th>
        <th className="py-3.5 px-4">Vacation Type</th>
        <th className="py-3.5 px-4">Status</th>
        <th className="py-3.5 px-4">Month</th>
        <th className="py-3.5 px-4">Apply Date</th>
        <th className="py-3.5 px-4">Leave Date</th>
        <th className="py-3.5 px-4">Returning Date</th>
        <th className="py-3.5 px-4">Joining Date</th>
        <th className="py-3.5 px-4">Visa</th>
        <th className="py-3.5 px-4">Guarantee Form</th>
        <th className="py-3.5 px-4">Ticket</th>
        <th className="py-3.5 px-4">Other</th>
        <th className="py-3.5 px-4 text-center">Total Vacation Days</th>
        <th className="py-3.5 px-4 text-center">Allowance</th>
        <th className="py-3.5 px-4 text-center">Used</th>
        <th className="py-3.5 px-4 text-center">Pending</th>
        <th className="py-3.5 px-4 text-center">Remaining</th>
        <th className="py-3.5 px-4 min-w-[280px]">Remark</th>
       </tr>
      </thead>
      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
       {isLoading ? (
        <tr>
         <td
          colSpan={TABLE_COLUMNS}
          className="py-12 text-center text-slate-500"
         >
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-500" />
          Loading employee vacation records...
         </td>
        </tr>
       ) : paginatedEmployees.length === 0 ? (
        <tr>
         <td
          colSpan={TABLE_COLUMNS}
          className="py-12 text-center text-slate-500"
         >
          No employee records match your selected criteria.
         </td>
        </tr>
       ) : (
        paginatedEmployees.map((employee) => (
         <tr
          key={employee._id}
          className={`transition ${getRowClasses(employee.formattedStatus)}`}
          aria-disabled={employee.formattedStatus === "Inactive"}
         >
          <td className="py-3.5 px-4 font-medium">{employee.serial}</td>
          <td className="py-3.5 px-4">
           <div className="flex items-center gap-3">
            {employee.avatarUrl ? (
             <img
              src={employee.avatarUrl}
              alt={employee.name}
              className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
             />
            ) : (
             <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-xs">
              {employee.name.slice(0, 2).toUpperCase()}
             </div>
            )}
            <div>
             <div className="font-semibold">{employee.name}</div>
             <div className="text-xs text-slate-500 dark:text-slate-400">
              {employee.employeeId} • {employee.jobTitle}
             </div>
            </div>
           </div>
          </td>
          <td className="py-3.5 px-4 font-medium">{show(employee.emdId)}</td>
          <td className="py-3.5 px-4 font-medium">
           {show(employee.iqamaNumber)}
          </td>
          <td className="py-3.5 px-4">
           {renderPlainTag(employee.formattedNationality)}
          </td>
          <td className="py-3.5 px-4 font-medium">{employee.group}</td>
          <td className="py-3.5 px-4">
           {renderPlainTag(employee.vacationType)}
          </td>
          <td className="py-3.5 px-4">
           {renderStatusBadge(employee.formattedStatus)}
          </td>
          <td className="py-3.5 px-4 font-medium">{employee.monthLabel}</td>
          <td className="py-3.5 px-4 text-xs font-medium">
           {show(employee.applyDate)}
          </td>
          <td className="py-3.5 px-4 text-xs font-medium">
           {show(employee.leaveDate)}
          </td>
          <td className="py-3.5 px-4 text-xs font-medium">
           {show(employee.returnDate)}
          </td>
          <td className="py-3.5 px-4 text-xs font-medium">
           {show(employee.joiningDate)}
          </td>
          <td className="py-3.5 px-4">{renderDocButton(employee, "visa")}</td>
          <td className="py-3.5 px-4">
           {renderDocButton(employee, "guaranteeForm")}
          </td>
          <td className="py-3.5 px-4">
           {renderDocButton(employee, "ticket")}
          </td>
          <td className="py-3.5 px-4">{renderDocButton(employee, "other")}</td>
          <td className="py-3.5 px-4 text-center font-semibold">
           {employee.vacationDays}
           {typeof employee.vacationDays === "number" ? " d" : ""}
          </td>
          <td className="py-3.5 px-4 text-center font-medium">
           {employee.totalAllowance} d
          </td>
          <td className="py-3.5 px-4 text-center font-medium">
           {employee.usedDays} d
          </td>
          <td className="py-3.5 px-4 text-center font-medium">
           {employee.pendingDays} d
          </td>
          <td className="py-3.5 px-4 text-center font-bold">
           {employee.remainingDays} d
          </td>
          <td className="py-3.5 px-4 text-xs min-w-[280px] max-w-[420px] whitespace-normal break-words">
           {show(employee.remark)}
          </td>
         </tr>
        ))
       )}
      </tbody>
     </table>
    </div>

    {/* Pagination Footer */}
    <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
     <div>
      Showing{" "}
      <span className="font-semibold text-slate-900 dark:text-slate-100">
       {filteredEmployees.length === 0
        ? 0
        : (currentPage - 1) * itemsPerPage + 1}
      </span>{" "}
      to{" "}
      <span className="font-semibold text-slate-900 dark:text-slate-100">
       {Math.min(currentPage * itemsPerPage, filteredEmployees.length)}
      </span>{" "}
      of{" "}
      <span className="font-semibold text-slate-900 dark:text-slate-100">
       {filteredEmployees.length}
      </span>{" "}
      records
     </div>

     <div className="flex items-center gap-2">
      <label className="flex items-center gap-2 mr-2">
       <span>Rows per page:</span>
       <select
        value={rowsPerPage}
        onChange={(e) => {
         const v = e.target.value;
         setRowsPerPage(v === "All" ? "All" : Number(v));
        }}
        className="px-2 py-1 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400"
       >
        <option value={10}>10</option>
        <option value={50}>50</option>
        <option value={100}>100</option>
        <option value="All">All</option>
       </select>
      </label>
      <button
       onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
       disabled={currentPage === 1}
       className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
      >
       <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="font-medium">
       Page {currentPage} of {totalPages}
      </span>
      <button
       onClick={() =>
        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
       }
       disabled={currentPage === totalPages}
       className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
      >
       <ChevronRight className="w-4 h-4" />
      </button>
     </div>
    </div>
   </div>
  </div>
 );
};

export default EmployeeVacationTablePage;
