import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
 Briefcase,
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

export interface RawEmployeeData {
 _id: string;
 serialNo?: number | string; // Serial number
 employeeId: string;
 emdId?: string; // EMD ID number
 iqamaNumber?: string; // Iqama number
 name: string;
 email: string;
 jobTitle: string;
 group: string;
 nationality?: "Saudi" | "Non-Saudi" | string;
 vacationType?: string; // Annual, Sick, Emergency, Unpaid ...
 status: "Active" | "ON_LEAVE" | "UPCOMING" | string;
 applyDate?: string;
 leaveDate?: string;
 month?: string; // optional; derived from leaveDate when missing
 returnDate?: string;
 joiningDate?: string;
 totalVacationDays?: number;
 totalAllowance: number;
 usedDays: number;
 pendingDays: number;
 remainingDays: number;
 nextLeaveDate?: string; // legacy field (fallback for leaveDate)
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

// Calendar days from leave date up to return date.
const diffDays = (from?: string, to?: string): number | null => {
 if (!from || !to) return null;
 const a = new Date(from).getTime();
 const b = new Date(to).getTime();
 if (Number.isNaN(a) || Number.isNaN(b) || b < a) return null;
 return Math.round((b - a) / 86400000);
};

// Month name + year from a date string, e.g. "2026-09-20" -> "September 2026"
const getMonthLabel = (date?: string): string => {
 if (!date) return DASH;
 const d = new Date(date);
 if (Number.isNaN(d.getTime())) return DASH;
 return d.toLocaleString("en-US", { month: "long", year: "numeric" });
};

// Supports both a plain array: [ {...}, {...} ]
// and a wrapped object: { "data": [ {...} ] } or { "employees": [ {...} ] }
const extractRecords = (json: unknown): RawEmployeeData[] => {
 if (Array.isArray(json)) return json as RawEmployeeData[];
 if (json && typeof json === "object") {
  const obj = json as Record<string, unknown>;
  if (Array.isArray(obj.data)) return obj.data as RawEmployeeData[];
  if (Array.isArray(obj.employees)) return obj.employees as RawEmployeeData[];
 }
 return [];
};

// DATA TRANSFORMER
const transformEmployeeData = (
 raw: RawEmployeeData,
 index: number,
): EmployeeVacationRecord => {
 let formattedStatus: VacationStatus = "Active";
 // "Final Exit", "final-exit", "FINAL_EXIT" -> "FINALEXIT"
 const statusKey = (raw.status ?? "").toUpperCase().replace(/[\s_-]/g, "");

 if (statusKey === "ONLEAVE") {
  formattedStatus = "On Leave";
 } else if (statusKey === "PENDING") {
  formattedStatus = "Pending";
 } else if (statusKey === "UPCOMING") {
  formattedStatus = "Upcoming";
 } else if (
  statusKey === "REJOINED" ||
  statusKey === "REJOINING" ||
  statusKey === "REJOIN" ||
  statusKey === "RETURNED"
 ) {
  formattedStatus = "Re-joined";
 } else if (statusKey === "FINALEXIT") {
  formattedStatus = "Final Exit";
 } else if (statusKey === "TERMINATED" || statusKey === "TERMINATE") {
  formattedStatus = "Terminated";
 } else if (statusKey === "INACTIVE") {
  formattedStatus = "Inactive";
 } else if (
  statusKey === "CANCELLED" ||
  statusKey === "CANCELED" ||
  statusKey === "CENCELLED"
 ) {
  formattedStatus = "Cancelled";
 }

 // Normalize nationality: "saudi" -> Saudi, "non saudi"/"non-saudi" -> Non-Saudi
 const nat = raw.nationality?.toLowerCase().replace(/[\s_-]/g, "") || "";
 let formattedNationality: "Saudi" | "Non-Saudi" | "-" = "-";
 if (nat === "saudi") formattedNationality = "Saudi";
 else if (nat === "nonsaudi") formattedNationality = "Non-Saudi";

 const leaveDate = raw.leaveDate ?? raw.nextLeaveDate;
 const computedDays = diffDays(leaveDate, raw.returnDate);
 const vacationDays =
  raw.totalVacationDays ?? (computedDays !== null ? computedDays : DASH);

 return {
  ...raw,
  leaveDate,
  formattedStatus,
  formattedNationality,
  serial: raw.serialNo ?? index + 1,
  vacationDays,
  monthLabel: raw.month || getMonthLabel(leaveDate),
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

 // Filters & Pagination State
 const [searchTerm, setSearchTerm] = useState<string>("");
 const [selectedGroup, setSelectedGroup] = useState<string>("All");
 const [selectedStatus, setSelectedStatus] = useState<string>("All");
 const [selectedNationality, setSelectedNationality] = useState<string>("All");
 const [selectedVacationType, setSelectedVacationType] =
  useState<string>("All");
 const [selectedMonth, setSelectedMonth] = useState<string>("All");
 const [currentPage, setCurrentPage] = useState<number>(1);
 const [rowsPerPage, setRowsPerPage] = useState<number | "All">(10);

 // ------------------------------------------
 // Data Loading (from src/data/Vacations.json)
 // ------------------------------------------
 const loadEmployeeData = useCallback(() => {
  setIsLoading(true);
  setError(null);

  try {
   const records = extractRecords(vacationsJson);
   setAllEmployees(records.map(transformEmployeeData));
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

 // Reset pagination on filter change
 useEffect(() => {
  setCurrentPage(1);
 }, [
  searchTerm,
  selectedGroup,
  selectedStatus,
  selectedNationality,
  selectedVacationType,
  selectedMonth,
 ]);

 // ------------------------------------------
 // Memoized Metrics & Filter Options
 // ------------------------------------------
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

 // Month options (e.g. "August 2026", "September 2026"), oldest -> newest
 const months = useMemo(() => {
  const sortKey = new Map<string, number>();
  allEmployees.forEach((e) => {
   if (!e.monthLabel || e.monthLabel === DASH) return;
   let t = e.leaveDate ? new Date(e.leaveDate).getTime() : NaN;
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
   finalExit: count("Final Exit"),
   cancelled: count("Cancelled"),
  };
 }, [allEmployees]);

 // ------------------------------------------
 // Filtering & Pagination Logic
 // ------------------------------------------
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

   return (
    matchesSearch &&
    matchesGroup &&
    matchesStatus &&
    matchesNationality &&
    matchesVacationType &&
    matchesMonth
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
   `Generated on: ${new Date().toLocaleDateString()}${selectedMonth !== "All" ? `  |  Month: ${selectedMonth}` : ""
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
   headStyles: { fillColor: [79, 70, 229] }, // Indigo color
   styles: { fontSize: 7, overflow: "linebreak" },
   // Full remark text, wrapped over several lines
   columnStyles: { 20: { cellWidth: 70 } },
  });

  doc.save(`Employee_Vacation_Report_${Date.now()}.pdf`);
 };

 // Helper for Status Badge Styling
 const renderStatusBadge = (
  status: EmployeeVacationRecord["formattedStatus"],
 ) => {
  switch (status) {
   case "Active":
    return (
     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-500"></span>
      Active
     </span>
    );
   case "Pending":
    return (
     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-orange-500"></span>
      Pending
     </span>
    );
   case "On Leave":
    return (
     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-amber-500"></span>
      On Leave
     </span>
    );
   case "Upcoming":
    return (
     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-blue-500"></span>
      Upcoming
     </span>
    );
   case "Re-joined":
    return (
     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400">
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-teal-500"></span>
      Re-joined
     </span>
    );
   case "Final Exit":
    return (
     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-900 text-white">
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-white"></span>
      Final Exit
     </span>
    );
   case "Terminated":
    return (
     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-700 text-white">
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-white"></span>
      Terminated
     </span>
    );
   case "Inactive":
    return (
     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-400 text-yellow-950">
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-yellow-900"></span>
      Inactive
     </span>
    );
   case "Cancelled":
    return (
     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-300 text-slate-600 dark:bg-slate-600 dark:text-slate-300">
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-slate-500"></span>
      Cancelled
     </span>
    );
   default:
    return null;
  }
 };

 // Row color per status:
 // Final Exit = full red row, Terminated = dark gray, Inactive = yellow,
 // Pending = orange, On Leave = amber, Upcoming = blue, Re-joined = teal
 const getRowClasses = (status: VacationStatus) => {
  switch (status) {
   case "Final Exit":
    // Full red row, all plain text turns white (badges keep their own colors)
    return "bg-red-600 hover:bg-red-700 [&_*:not([class*=bg-])]:!text-white [&>td]:text-white";
   case "Terminated":
    return "bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 [&>td]:text-slate-500 dark:[&>td]:text-slate-400";
   case "Inactive":
    return "bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50";
   case "Pending":
    return "bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40";
   case "On Leave":
    return "bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40";
   case "Upcoming":
    return "bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40";
   case "Re-joined":
    return "bg-teal-50 dark:bg-teal-900/20 hover:bg-teal-100 dark:hover:bg-teal-900/40";
   case "Cancelled":
    // Disabled row: faded, grayscale, no hover or click, text not selectable
    return "bg-slate-100 dark:bg-slate-800 opacity-50 grayscale pointer-events-none select-none [&>td]:text-slate-400 dark:[&>td]:text-slate-500";
   default:
    return "hover:bg-slate-50 dark:hover:bg-slate-700/30";
  }
 };

 // Helper for Nationality Badge Styling
 const renderNationalityBadge = (
  nationality: EmployeeVacationRecord["formattedNationality"],
 ) => {
  if (nationality === "Saudi") {
   return (
    <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
     Saudi
    </span>
   );
  }
  if (nationality === "Non-Saudi") {
   return (
    <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
     Non-Saudi
    </span>
   );
  }
  return <span className="text-slate-400">{DASH}</span>;
 };

 // Helper for Vacation Type Badge:
 // Emergency = red bg + white text, Annual = green bg + white text,
 // any other type = neutral gray
 const renderVacationTypeBadge = (type?: string) => {
  if (!type) return <span className="text-slate-400">{DASH}</span>;

  const key = type.trim().toLowerCase();
  let colorClasses =
   "bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-slate-100";
  if (key === "emergency") colorClasses = "bg-red-600 text-white ring-1 ring-white";
  else if (key === "annual") colorClasses = "bg-green-600 text-white";

  return (
   <span
    className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${colorClasses}`}
   >
    {type}
   </span>
  );
 };

 const TABLE_COLUMNS = 19;

 return (
  <div className="p-6 w-full mx-auto space-y-6 bg-slate-50 dark:bg-slate-900 min-h-screen text-slate-900 dark:text-slate-100">
   {/* Header */}
   <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <div>
     <h1 className="text-2xl font-bold tracking-tight">
      Employee Vacation Tracker
     </h1>
     <p className="text-sm text-slate-500 dark:text-slate-400">
      Monitor allowance balances, active leaves, and upcoming schedules.
     </p>
    </div>
    <div className="flex flex-wrap items-center gap-3">
     <button
      onClick={loadEmployeeData}
      className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
      title="Refresh Data"
     >
      <RefreshCw
       className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
      />
     </button>

     {/* Export Buttons */}
     <button
      onClick={handleExportExcel}
      className="flex items-center gap-2 border border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 px-3.5 py-2 rounded-lg text-sm font-medium transition"
     >
      <FileSpreadsheet className="w-4 h-4" /> Excel
     </button>

     <button
      onClick={handleExportPDF}
      className="flex items-center gap-2 border border-rose-600 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 px-3.5 py-2 rounded-lg text-sm font-medium transition"
     >
      <FileText className="w-4 h-4" /> PDF
     </button>

     <button
      onClick={onAssignVacation}
      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"
     >
      <Plus className="w-4 h-4" /> Assign Vacation
     </button>
    </div>
   </div>

   {error && (
    <div className="p-3 rounded-lg border border-rose-300 bg-rose-50 text-rose-700 text-sm dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-300">
     {error}
    </div>
   )}

   {/* Metrics Cards */}
   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
    <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
     <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
      <Briefcase className="w-6 h-6" />
     </div>
     <div>
      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
       Total Employees
      </p>
      <p className="text-2xl font-semibold">{metrics.total}</p>
     </div>
    </div>

    <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
     <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
      <UserCheck className="w-6 h-6" />
     </div>
     <div>
      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
       Active On-Duty
      </p>
      <p className="text-2xl font-semibold">{metrics.active}</p>
     </div>
    </div>

    <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
     <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
      <UserX className="w-6 h-6" />
     </div>
     <div>
      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
       Currently On Leave
      </p>
      <p className="text-2xl font-semibold">{metrics.onLeave}</p>
     </div>
    </div>

    <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
     <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
      <Clock className="w-6 h-6" />
     </div>
     <div>
      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
       Upcoming Leave
      </p>
      <p className="text-2xl font-semibold">{metrics.upcoming}</p>
     </div>
    </div>

    <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
     <div className="p-3 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg">
      <Hourglass className="w-6 h-6" />
     </div>
     <div>
      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
       Pending
      </p>
      <p className="text-2xl font-semibold">{metrics.pending}</p>
     </div>
    </div>

    <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
     <div className="p-3 bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-lg">
      <UserPlus className="w-6 h-6" />
     </div>
     <div>
      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
       Re-joined
      </p>
      <p className="text-2xl font-semibold">{metrics.rejoined}</p>
     </div>
    </div>
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
      className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
     />
    </div>

    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
     <select
      value={selectedMonth}
      onChange={(e) => setSelectedMonth(e.target.value)}
      className="px-3 py-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
      className="px-3 py-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
      className="px-3 py-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
     >
      <option value="All">Nationality: All</option>
      <option value="Saudi">Nationality: Saudi</option>
      <option value="Non-Saudi">Nationality: Non-Saudi</option>
     </select>

     <select
      value={selectedVacationType}
      onChange={(e) => setSelectedVacationType(e.target.value)}
      className="px-3 py-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
     >
      {vacationTypes.map((type) => (
       <option key={type} value={type}>
        Vacation Type: {type}
       </option>
      ))}
     </select>

     <select
      value={selectedStatus}
      onChange={(e) => setSelectedStatus(e.target.value)}
      className="px-3 py-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
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
         >
          <td className="py-3.5 px-4 font-medium text-slate-600 dark:text-slate-300">
           {employee.serial}
          </td>
          <td className="py-3.5 px-4">
           <div className="flex items-center gap-3">
            {employee.avatarUrl ? (
             <img
              src={employee.avatarUrl}
              alt={employee.name}
              className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
             />
            ) : (
             <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs">
              {employee.name.slice(0, 2).toUpperCase()}
             </div>
            )}
            <div>
             <div className="font-semibold text-slate-900 dark:text-slate-100">
              {employee.name}
             </div>
             <div className="text-xs text-slate-500 dark:text-slate-400">
              {employee.employeeId} • {employee.jobTitle}
             </div>
            </div>
           </div>
          </td>
          <td className="py-3.5 px-4 font-medium">
           {show(employee.emdId)}
          </td>
          <td className="py-3.5 px-4 font-medium">
           {show(employee.iqamaNumber)}
          </td>
          <td className="py-3.5 px-4">
           {renderNationalityBadge(employee.formattedNationality)}
          </td>
          <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
           {employee.group}
          </td>
          <td className="py-3.5 px-4">
           {renderVacationTypeBadge(employee.vacationType)}
          </td>
          <td className="py-3.5 px-4">
           {renderStatusBadge(employee.formattedStatus)}
          </td>
          <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
           {employee.monthLabel}
          </td>
          <td className="py-3.5 px-4 text-xs font-medium text-slate-600 dark:text-slate-300">
           {show(employee.applyDate)}
          </td>
          <td className="py-3.5 px-4 text-xs font-medium text-slate-600 dark:text-slate-300">
           {show(employee.leaveDate)}
          </td>
          <td className="py-3.5 px-4 text-xs font-medium text-slate-600 dark:text-slate-300">
           {show(employee.returnDate)}
          </td>
          <td className="py-3.5 px-4 text-xs font-medium text-slate-600 dark:text-slate-300">
           {show(employee.joiningDate)}
          </td>
          <td className="py-3.5 px-4 text-center font-semibold text-indigo-600 dark:text-indigo-400">
           {employee.vacationDays}
           {typeof employee.vacationDays === "number" ? " d" : ""}
          </td>
          <td className="py-3.5 px-4 text-center font-medium">
           {employee.totalAllowance} d
          </td>
          <td className="py-3.5 px-4 text-center text-amber-600 dark:text-amber-400 font-medium">
           {employee.usedDays} d
          </td>
          <td className="py-3.5 px-4 text-center text-blue-600 dark:text-blue-400 font-medium">
           {employee.pendingDays} d
          </td>
          <td className="py-3.5 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
           {employee.remainingDays} d
          </td>
          {/* Full remark: wraps onto several lines, never cut with "..." */}
          <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300 min-w-[280px] max-w-[420px] whitespace-normal break-words">
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
        className="px-2 py-1 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
