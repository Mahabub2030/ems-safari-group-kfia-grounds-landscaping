import { Button } from "@/components/ui/button";
import {
 DataTable,
 type Column,
 type FilterOption,
} from "@/components/ui/DataTable";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { useGetAllEmployeesQuery } from "@/redux/features/employees/employees.api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Briefcase, Building2, Download, FileText, MapPin } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

// Import this from your own types file instead if you already export it:
// import type { IEmployee, EMPLOYEE_STATUS } from "@/types/employee.type";

export type EMPLOYEE_STATUS =
 | "ACTIVE"
 | "INACTIVE"
 | "ON_LEAVE"
 | "TERMINATED";

export interface IEmployee {
 _id: string;
 name: string;
 jobTitle: string;
 idNumber: string;
 employeeId: string | number;
 dacoId?: string;
 group: string;
 joiningDate: Date | string;
 nationality: string;
 companyName: string;
 status: EMPLOYEE_STATUS;
 email?: string;
 phoneNumber?: string;
 gender?: "male" | "female";
 workLocation?: string;
 images?: string[];
 remark: string;
}

/* -------------------------------------------------------------------------- */
/*  Static config (outside the component - it never changes)                    */
/* -------------------------------------------------------------------------- */

const statusBadge: Record<string, string> = {
 ACTIVE:
  "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
 ON_LEAVE:
  "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
 TERMINATED:
  "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20",
 INACTIVE:
  "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/20",
};

const statusFilterOptions: FilterOption[] = [
 { label: "Active", value: "ACTIVE" },
 { label: "On leave", value: "ON_LEAVE" },
 { label: "Terminated", value: "TERMINATED" },
 { label: "Inactive", value: "INACTIVE" },
];

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const formatDate = (date: Date | string | undefined) => {
 if (!date) return "—";
 const d = new Date(date);
 if (Number.isNaN(d.getTime())) return "—";
 return d.toLocaleDateString("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
 });
};

const initials = (name: string) =>
 name
  .trim()
  .split(/\s+/)
  .slice(0, 2)
  .map((part) => part[0])
  .join("")
  .toUpperCase();

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function Employees() {
 // Confirmed API shape:
 // { statusCode, success, message, meta: { page, limit, total, totalPage }, data: IEmployee[] }
 const { data: response, isLoading, isError } = useGetAllEmployeesQuery(
  undefined,
 ) as {
  data?: {
   data: IEmployee[];
   meta?: { page: number; limit: number; total: number; totalPage: number };
  };
  isLoading: boolean;
  isError: boolean;
 };

 const employees: IEmployee[] = response?.data ?? [];
 // Not used yet, but here if you want to switch from client-side filtering
 // to real server-side pagination later (see note below).
 const serverMeta = response?.meta;

 const [search, setSearch] = useState("");
 const [statusFilter, setStatusFilter] = useState("all");
 const [groupFilter, setGroupFilter] = useState("all");
 const [positionFilter, setPositionFilter] = useState("all");
 const [companyFilter, setCompanyFilter] = useState("all");
 const [pageSize, setPageSize] = useState(10); // 0 = show all
 const [page, setPage] = useState(1);

 /* ----- dropdown options built from the data ----- */

 const groupOptions = useMemo(
  () => [...new Set(employees.map((e) => e.group).filter(Boolean))].sort(),
  [employees],
 );

 const positionOptions = useMemo(
  () => [...new Set(employees.map((e) => e.jobTitle).filter(Boolean))].sort(),
  [employees],
 );

 const companyOptions = useMemo(
  () =>
   [...new Set(employees.map((e) => e.companyName).filter(Boolean))].sort(),
  [employees],
 );

 /* ----- filtering ----- */

 const filtered = useMemo(() => {
  const q = search.trim().toLowerCase();

  return employees.filter((e) => {
   const haystack = [
    e.name,
    e.email,
    String(e.employeeId),
    e.idNumber,
    e.dacoId,
    e.jobTitle,
    e.group,
    e.companyName,
    e.nationality,
    e.workLocation,
    e.phoneNumber,
   ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

   return (
    (!q || haystack.includes(q)) &&
    (statusFilter === "all" || e.status === statusFilter) &&
    (groupFilter === "all" || e.group === groupFilter) &&
    (positionFilter === "all" || e.jobTitle === positionFilter) &&
    (companyFilter === "all" || e.companyName === companyFilter)
   );
  });
 }, [
  employees,
  search,
  statusFilter,
  groupFilter,
  positionFilter,
  companyFilter,
 ]);

 /* ----- pagination (slices `filtered`, not the raw list) ----- */

 const paginated = useMemo(() => {
  if (pageSize === 0) return filtered;
  return filtered.slice((page - 1) * pageSize, page * pageSize);
 }, [filtered, page, pageSize]);

 const resetPage = () => setPage(1);

 /* ----- exports (always export the filtered set, not just this page) ----- */

 const exportExcel = () => {
  if (!filtered.length) {
   toast.error("Nothing to export with these filters");
   return;
  }

  const rows = filtered.map((e) => ({
   "Employee ID": e.employeeId,
   "ID / Iqama": e.idNumber,
   "DACO ID": e.dacoId ?? "",
   Name: e.name,
   Email: e.email ?? "",
   Phone: e.phoneNumber ?? "",
   Gender: e.gender ?? "",
   Position: e.jobTitle,
   Department: e.group,
   Company: e.companyName,
   Nationality: e.nationality,
   "Work location": e.workLocation ?? "",
   Status: e.status,
   Remark: e.remark,
   "Joining date": formatDate(e.joiningDate),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = Object.keys(rows[0]).map(() => ({ wch: 18 }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");
  XLSX.writeFile(workbook, `employees-${Date.now()}.xlsx`);
  toast.success(`Exported ${filtered.length} employees to Excel`);
 };

 const exportPDF = () => {
  if (!filtered.length) {
   toast.error("Nothing to export with these filters");
   return;
  }

  const doc = new jsPDF("landscape");
  doc.setFontSize(14);
  doc.text("Employee directory", 14, 15);
  doc.setFontSize(9);
  doc.text(
   `${filtered.length} employees · generated ${formatDate(new Date())}`,
   14,
   21,
  );

  autoTable(doc, {
   startY: 26,
   head: [
    [
     "Emp ID",
     "ID / Iqama",
     "DACO ID",
     "Name",
     "Position",
     "Department",
     "Company",
     "Nationality",
     "Status",
     "Remark",
    ],
   ],
   body: filtered.map((e) => [
    String(e.employeeId),
    e.idNumber,
    e.dacoId ?? "—",
    e.name,
    e.jobTitle,
    e.group,
    e.companyName,
    e.nationality,
    e.status,
    e.remark || "—",
   ]),
   styles: { fontSize: 8, cellPadding: 2 },
   headStyles: { fillColor: [34, 34, 34] },
  });

  doc.save(`employees-${Date.now()}.pdf`);
  toast.success(`Exported ${filtered.length} employees to PDF`);
 };

 /* ----- columns ----- */

 const columns: Column<IEmployee>[] = [
  {
   key: "sr",
   label: "#",
   render: (_row, i) => (
    <span className="text-xs text-muted-foreground font-mono">
     {pageSize === 0 ? i + 1 : (page - 1) * pageSize + i + 1}
    </span>
   ),
  },
  {
   key: "employeeId",
   label: "Emp ID / Iqama",
   render: (e) => (
    <div className="min-w-[110px]">
     <p className="font-semibold text-xs text-primary">{e.employeeId}</p>
     <p className="text-[11px] text-muted-foreground font-mono">
      {e.idNumber}
     </p>
    </div>
   ),
  },
  {
   key: "name",
   label: "Employee",
   render: (e) => (
    <div className="flex items-center gap-2.5 min-w-[190px]">
     {e.images?.[0] ? (
      <img
       src={e.images[0]}
       alt={e.name}
       className="h-8 w-8 rounded-full object-cover shrink-0 border border-border"
      />
     ) : (
      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs border border-primary/20">
       {initials(e.name)}
      </div>
     )}
     <div className="truncate">
      <p className="font-medium text-xs leading-none text-foreground truncate">
       {e.name}
      </p>
      <p className="text-[11px] text-muted-foreground truncate mt-1">
       {e.email || e.phoneNumber || "—"}
      </p>
     </div>
    </div>
   ),
  },
  {
   key: "jobTitle",
   label: "Position",
   render: (e) => (
    <div className="flex items-center gap-1.5 min-w-[130px]">
     <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
     <span className="text-xs font-semibold bg-accent/50 px-2 py-0.5 rounded-md border border-accent">
      {e.jobTitle}
     </span>
    </div>
   ),
  },
  {
   key: "group",
   label: "Department",
   render: (e) => (
    <span className="text-xs font-medium min-w-[120px] block">
     {e.group}
    </span>
   ),
  },
  {
   key: "companyName",
   label: "Company",
   render: (e) => (
    <div className="flex items-center gap-1.5 min-w-[110px]">
     <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
     <span className="text-xs font-medium">{e.companyName}</span>
    </div>
   ),
  },
  {
   key: "dacoId",
   label: "DACO ID",
   render: (e) => (
    <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
     {e.dacoId || "—"}
    </span>
   ),
  },
  {
   key: "nationality",
   label: "Nationality",
   render: (e) => (
    <span className="text-xs font-medium whitespace-nowrap">
     {e.nationality}
    </span>
   ),
  },
  {
   key: "workLocation",
   label: "Work location",
   render: (e) => (
    <div className="flex items-center gap-1.5 min-w-[110px]">
     <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
     <span className="text-xs truncate">{e.workLocation || "—"}</span>
    </div>
   ),
  },
  {
   key: "joiningDate",
   label: "Joined",
   render: (e) => (
    <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
     {formatDate(e.joiningDate)}
    </span>
   ),
  },
  {
   key: "remark",
   label: "Remark",
   render: (e) => (
    <span
     className="text-xs text-muted-foreground italic truncate max-w-[140px] block"
     title={e.remark}
    >
     {e.remark || "—"}
    </span>
   ),
  },
  {
   key: "status",
   label: "Status",
   render: (e) => (
    <span
     className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold inline-block whitespace-nowrap ${statusBadge[e.status] ?? statusBadge.INACTIVE
      }`}
    >
     {e.status.replace("_", " ")}
    </span>
   ),
  },
 ];

 /* ----- loading / error ----- */

 if (isLoading) {
  return (
   <div className="p-6 space-y-3">
    <div className="h-7 w-52 rounded bg-muted animate-pulse" />
    <div className="h-64 w-full rounded-xl border bg-muted/40 animate-pulse" />
   </div>
  );
 }

 if (isError) {
  return (
   <div className="p-6">
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
     <p className="text-sm font-medium text-destructive">
      The employee list could not load.
     </p>
     <p className="text-xs text-muted-foreground mt-1">
      Check your connection and refresh the page.
     </p>
    </div>
   </div>
  );
 }

 /* ----- render ----- */

 return (
  <div className="space-y-4 p-4 md:p-6">
   <div>
    <h1 className="text-2xl font-bold tracking-tight">
     Employee directory
    </h1>
    <p className="text-muted-foreground text-xs mt-0.5">
     <span className="font-semibold text-foreground">
      {filtered.length}
     </span>{" "}
     of {employees.length} employees
    </p>
   </div>

   {/* Filter bar */}
   <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3 border rounded-xl shadow-sm">
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
     <span>Rows per page</span>
     <Select
      value={String(pageSize)}
      onValueChange={(v) => {
       setPageSize(Number(v));
       resetPage();
      }}
     >
      <SelectTrigger className="h-8 text-xs w-[80px]">
       <SelectValue />
      </SelectTrigger>
      <SelectContent>
       <SelectItem value="5">5</SelectItem>
       <SelectItem value="10">10</SelectItem>
       <SelectItem value="25">25</SelectItem>
       <SelectItem value="50">50</SelectItem>
       <SelectItem value="100">100</SelectItem>
       <SelectItem value="0">All</SelectItem>
      </SelectContent>
     </Select>
    </div>

    <div className="flex flex-wrap items-center gap-3">
     <Select
      value={positionFilter}
      onValueChange={(v) => {
       setPositionFilter(v);
       resetPage();
      }}
     >
      <SelectTrigger className="h-8 text-xs w-[160px]">
       <SelectValue placeholder="All positions" />
      </SelectTrigger>
      <SelectContent>
       <SelectItem value="all">All positions</SelectItem>
       {positionOptions.map((p) => (
        <SelectItem key={p} value={p}>
         {p}
        </SelectItem>
       ))}
      </SelectContent>
     </Select>

     <Select
      value={groupFilter}
      onValueChange={(v) => {
       setGroupFilter(v);
       resetPage();
      }}
     >
      <SelectTrigger className="h-8 text-xs w-[170px]">
       <SelectValue placeholder="All departments" />
      </SelectTrigger>
      <SelectContent>
       <SelectItem value="all">All departments</SelectItem>
       {groupOptions.map((g) => (
        <SelectItem key={g} value={g}>
         {g}
        </SelectItem>
       ))}
      </SelectContent>
     </Select>

     <Select
      value={companyFilter}
      onValueChange={(v) => {
       setCompanyFilter(v);
       resetPage();
      }}
     >
      <SelectTrigger className="h-8 text-xs w-[150px]">
       <SelectValue placeholder="All companies" />
      </SelectTrigger>
      <SelectContent>
       <SelectItem value="all">All companies</SelectItem>
       {companyOptions.map((c) => (
        <SelectItem key={c} value={c}>
         {c}
        </SelectItem>
       ))}
      </SelectContent>
     </Select>
    </div>
   </div>

   {/* Table */}
   <div className="border rounded-xl shadow-sm bg-card overflow-hidden">
    <div className="w-full overflow-x-auto">
     <DataTable<IEmployee>
      data={paginated}
      columns={columns}
      rowKey={(e) => e._id}
      search={search}
      onSearchChange={(v) => {
       setSearch(v);
       resetPage();
      }}
      searchPlaceholder="Search name, ID, iqama, position, department…"
      filterValue={statusFilter}
      onFilterChange={(v) => {
       setStatusFilter(v);
       resetPage();
      }}
      filterOptions={statusFilterOptions}
      filterPlaceholder="All statuses"
      page={page}
      pageSize={pageSize === 0 ? filtered.length || 1 : pageSize}
      total={filtered.length}
      onPageChange={setPage}
      emptyMessage="No employees match these filters"
      actions={
       <div className="flex items-center gap-2">
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
       </div>
      }
     />
    </div>
   </div>
  </div>
 );
}
