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
import employeesJson from "@/data/employees.json";
import { useGetAllEmployeesQuery } from "@/redux/features/employees/employees.api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Briefcase, Building2, Download, Edit, Eye, FileText, MapPin, MoreHorizontal, Plane, Power, Trash2Icon, UserCheck, Users, UserX } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

// Import these from your own types file instead if you already export them:
// import type { IEmployee, EMPLOYEE_STATUS } from "@/types/employee.type";

export type EMPLOYEE_STATUS = "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "TERMINATED";

export interface IEmployee {
 _id: string;
 name: string;
 jobTitle: string;
 idNumber: string;
 employeeId: string | number;
 dacoId?: string | null;
 group: string;
 joiningDate: Date | string;
 nationality: string;
 companyName: string;
 status: EMPLOYEE_STATUS;
 email?: string;
 phoneNumber?: string;
 gender?: "male" | "female";
 workLocation?: string | null;
 images?: string[];
 remark?: string | null;
}

interface IMeta {
 page: number;
 limit: number;
 total: number;
 totalPage: number;
}

interface IEmployeesResponse {
 data: IEmployee[];
 meta?: IMeta;
}

/* -------------------------------------------------------------------------- */
/*  Data source                                                                */
/* -------------------------------------------------------------------------- */

// true  = read from src/data/employees.json (no backend needed)
// false = read from the API (useGetAllEmployeesQuery)
const USE_MOCK = true;

const MOCK_RESPONSE: IEmployeesResponse = {
 data: employeesJson as unknown as IEmployee[],
 meta: {
  page: 1,
  limit: employeesJson.length,
  total: employeesJson.length,
  totalPage: 1,
 },
};

// If your backend paginates (usually 10 per page), ask for everything.
// Change the param name to match your API (limit, pageSize, per_page...).
// If the hook takes no arguments, set this to undefined.
const FETCH_ARGS: { limit: number } | undefined = { limit: 1000 };

/* -------------------------------------------------------------------------- */
/*  Static config                                                              */
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

const formatDate = (date: Date | string | undefined | null) => {
 if (!date) return "—";
 const d = new Date(date);
 if (Number.isNaN(d.getTime())) return "—";
 return d.toLocaleDateString("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC", // dates are stored as UTC midnight; avoids off-by-one days
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

/** Case/space-insensitive key so "labor" and "Labor" are treated as the same value. */
const norm = (s?: string | null) => (s ?? "").trim().toLowerCase();

/** Fixes known typos in remarks for display, search and export. */
const cleanRemark = (remark?: string | null) => {
 const r = (remark ?? "").trim();
 if (!r) return "";
 if (norm(r) === "complted") return "Completed";
 return r;
};

/** Unique, case-insensitive dropdown options. Keeps the first spelling found. */
const buildOptions = (values: (string | null | undefined)[]) => {
 const map = new Map<string, string>();
 values.forEach((v) => {
  const label = (v ?? "").trim();
  if (label && !map.has(norm(label))) map.set(norm(label), label);
 });
 return [...map.entries()]
  .map(([value, label]) => ({ value, label }))
  .sort((a, b) => a.label.localeCompare(b.label));
};

/** Accepts either `{ data: [...] }` or a bare `[...]` array. */
const extractEmployees = (payload: unknown): IEmployee[] => {
 if (Array.isArray(payload)) return payload as IEmployee[];
 const data = (payload as IEmployeesResponse | undefined)?.data;
 return Array.isArray(data) ? data : [];
};

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function Employees() {
 // API shape:
 // { statusCode, success, message, meta: { page, limit, total, totalPage }, data: IEmployee[] }
 const {
  data: apiResponse,
  isLoading: apiLoading,
  isError: apiError,
 } = useGetAllEmployeesQuery(FETCH_ARGS as never, { skip: USE_MOCK }) as {
  data?: IEmployeesResponse | IEmployee[];
  isLoading: boolean;
  isError: boolean;
 };

 const response = USE_MOCK ? MOCK_RESPONSE : apiResponse;
 const isLoading = USE_MOCK ? false : apiLoading;
 const isError = USE_MOCK ? false : apiError;

 const employees: IEmployee[] = useMemo(
  () => extractEmployees(response),
  [response],
 );

 const serverMeta = Array.isArray(response) ? undefined : response?.meta;
 // True when the server has more rows than we received (server-side pagination).
 const isPartial =
  !!serverMeta && serverMeta.total > employees.length && employees.length > 0;

 const [search, setSearch] = useState("");
 const [statusFilter, setStatusFilter] = useState("all");
 const [groupFilter, setGroupFilter] = useState("all");
 const [positionFilter, setPositionFilter] = useState("all");
 const [companyFilter, setCompanyFilter] = useState("all");
 const [pageSize, setPageSize] = useState(10); // 0 = show all
 const [page, setPage] = useState(1);


 /* ----- Action Handlers ----- */

 const handleViewDetails = (employee: IEmployee) => {
  // toast.info(`Viewing details for ${employee.name}`);
  // Open View Modal or Navigate to route
  window.location.href = `/EmployeeDetails/${employee._id}`;
 };

 const handleEdit = (employee: IEmployee) => {
  // toast.info(`Editing employee ${employee.name}`);

  window.location.href = `/EmployeeDetails/${employee._id}`;
 };

 const handleToggleStatus = (employee: IEmployee) => {
  const newStatus = employee.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  toast.success(`Updated status for ${employee.name} to ${newStatus}`);
  // Trigger RTK Query update mutation here
 };

 const handleDelete = (employee: IEmployee) => {
  if (confirm(`Are you sure you want to delete ${employee.name}?`)) {
   toast.success(`Deleted ${employee.name}`);
   // Trigger RTK Query delete mutation here
  }
 };


 /* ----- dropdown options built from the data ----- */

 const groupOptions = useMemo(
  () => buildOptions(employees.map((e) => e.group)),
  [employees],
 );
 const positionOptions = useMemo(
  () => buildOptions(employees.map((e) => e.jobTitle)),
  [employees],
 );
 const companyOptions = useMemo(
  () => buildOptions(employees.map((e) => e.companyName)),
  [employees],
 );

 // Only show the work location column when at least one record has a value.
 const hasWorkLocation = useMemo(
  () => employees.some((e) => !!e.workLocation),
  [employees],
 );

 /* ----- summary stats + card config ----- */
 /* INACTIVE employees are NOT counted in "Total Employees" */
 const stats = useMemo(() => {
  const inactive = employees.filter((e) => e.status === "INACTIVE").length;
  const onLeave = employees.filter((e) => e.status === "ON_LEAVE").length;
  const active = employees.filter((e) => e.status === "ACTIVE").length;
  return {
   total: employees.length - inactive, // excludes inactive
   active,
   onLeave,
   inactive,
  };
 }, [employees]);

 const statCards = [
  { label: "Total Employees", value: stats.total, hint: "Excluding inactive", icon: Users, color: "text-primary bg-primary/10 border-primary/20", filter: "all" },
  { label: "Active", value: stats.active, hint: "Currently working", icon: UserCheck, color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20", filter: "ACTIVE" },
  { label: "On Vacation", value: stats.onLeave, hint: "Currently on leave", icon: Plane, color: "text-amber-600 bg-amber-500/10 border-amber-500/20", filter: "ON_LEAVE" },
  { label: "Inactive", value: stats.inactive, hint: "Not counted in total", icon: UserX, color: "text-slate-600 bg-slate-500/10 border-slate-500/20", filter: "INACTIVE" },
 ];

 /* ----- filtering ----- */

 const filtered = useMemo(() => {
  const q = search.trim().toLowerCase();

  return employees.filter((e) => {
   const haystack = [
    e.name,
    e.email,
    String(e.employeeId ?? ""),
    e.idNumber,
    e.dacoId,
    e.jobTitle,
    e.group,
    e.companyName,
    e.nationality,
    e.workLocation,
    e.phoneNumber,
    cleanRemark(e.remark),
   ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

   return (
    (!q || haystack.includes(q)) &&
    (statusFilter === "all" || e.status === statusFilter) &&
    (groupFilter === "all" || norm(e.group) === groupFilter) &&
    (positionFilter === "all" || norm(e.jobTitle) === positionFilter) &&
    (companyFilter === "all" || norm(e.companyName) === companyFilter)
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

 /* >>>>>>>>>> NEW: serial numbers (INACTIVE employees are skipped and show "--") <<<<<<<<<< */
 // Numbers the whole filtered list (not just this page), so page 2 continues
 // from where page 1 ended. Inactive employees get no number.
 const serialMap = useMemo(() => {
  const map = new Map<string, number>();
  let n = 0;
  filtered.forEach((e) => {
   if (e.status !== "INACTIVE") map.set(e._id, ++n);
  });
  return map;
 }, [filtered]);
 /* >>>>>>>>>> END NEW <<<<<<<<<< */

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
   Remark: cleanRemark(e.remark),
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
    e.status.replace(/_/g, " "),
    cleanRemark(e.remark) || "—",
   ]),
   styles: { fontSize: 8, cellPadding: 2 },
   headStyles: { fillColor: [34, 34, 34] },
  });

  doc.save(`employees-${Date.now()}.pdf`);
  toast.success(`Exported ${filtered.length} employees to PDF`);
 };

 /* ----- columns ----- */

 const columns: Column<IEmployee>[] = [
  /* >>>>>>>>>> CHANGED: "#" column shows "--" for INACTIVE employees <<<<<<<<<< */
  {
   key: "sr",
   label: "#",
   render: (e) => {
    const sr = serialMap.get(e._id);
    return (
     <span className="text-xs text-muted-foreground font-mono">
      {sr ?? "--"}
     </span>
    );
   },
  },
  /* >>>>>>>>>> END CHANGED <<<<<<<<<< */
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
     <span className="text-xs font-semibold bg-accent/50 px-2 py-0.5 rounded-md border border-accent capitalize">
      {e.jobTitle}
     </span>
    </div>
   ),
  },
  {
   key: "group",
   label: "Department",
   render: (e) => (
    <span className="text-xs font-medium min-w-[120px] block">{e.group}</span>
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
  ...(hasWorkLocation
   ? [
    {
     key: "workLocation",
     label: "Work location",
     render: (e: IEmployee) => (
      <div className="flex items-center gap-1.5 min-w-[110px]">
       <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
       <span className="text-xs truncate">{e.workLocation || "—"}</span>
      </div>
     ),
    } as Column<IEmployee>,
   ]
   : []),
  {
   key: "joiningDate",
   label: "Joined",
   render: (e) => (
    <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
     {formatDate(e.joiningDate)}
    </span>
   ),
  },
  /* >>>>>>>>>> CHANGED: remark shows the full sentence (wraps, no truncate) <<<<<<<<<< */
  {
   key: "remark",
   label: "Remark",
   render: (e) => {
    const remark = cleanRemark(e.remark);
    return (
     <span
      className="text-xs text-muted-foreground italic block min-w-[180px] max-w-[300px] whitespace-normal break-words"
      title={remark}
     >
      {remark || "—"}
     </span>
    );
   },
  },
  /* >>>>>>>>>> END CHANGED <<<<<<<<<< */
  {
   key: "status",
   label: "Status",
   render: (e) => (
    <span
     className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold inline-block whitespace-nowrap ${statusBadge[e.status] ?? statusBadge.INACTIVE
      }`}
    >
     {e.status.replace(/_/g, " ")}
    </span>
   ),
  },
  /* ====================================================================== */
  /*  ACTION BUTTON COLUMN                                                  */
  /* ====================================================================== */
  {
   key: "actions",
   label: "Actions",
   render: (e) => (
    <DropdownMenu>
     <DropdownMenuTrigger asChild>
      <Button variant="ghost" className="h-8 w-8 p-0">
       <span className="sr-only">Open action menu</span>
       <MoreHorizontal className="h-4 w-4" />
      </Button>
     </DropdownMenuTrigger>
     <DropdownMenuContent align="end" className="w-[160px]">
      <DropdownMenuLabel>Actions</DropdownMenuLabel>
      <DropdownMenuItem onClick={() => handleViewDetails(e)}>
       <Eye className="mr-2 h-4 w-4 text-muted-foreground" />
       View Details
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => handleEdit(e)}>
       <Edit className="mr-2 h-4 w-4 text-blue-500" />
       Edit Profile
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => handleToggleStatus(e)}>
       <Power className="mr-2 h-4 w-4 text-amber-500" />
       Toggle Status
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
       onClick={() => handleDelete(e)}
       className="text-destructive focus:text-destructive"
      >
       <Trash2Icon className="mr-2 h-4 w-4" />
       Delete Record
      </DropdownMenuItem>
     </DropdownMenuContent>
    </DropdownMenu>
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
    <h1 className="text-2xl font-bold tracking-tight">Employee directory</h1>
    <p className="text-muted-foreground text-xs mt-0.5">
     <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
     of {stats.total} employees
    </p>
   </div>

   {/* Summary cards */}
   <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
    {statCards.map((c) => {
     const Icon = c.icon;
     return (
      <button
       key={c.label}
       type="button"
       onClick={() => {
        setStatusFilter(c.filter);
        resetPage();
       }}
       className={`text-left bg-card border rounded-xl shadow-sm p-4 flex items-center gap-3 transition hover:shadow-md ${statusFilter === c.filter && c.filter !== "all" ? "ring-2 ring-primary/40" : ""
        }`}
      >
       <div className={`h-10 w-10 rounded-lg border flex items-center justify-center shrink-0 ${c.color}`}>
        <Icon className="h-5 w-5" />
       </div>
       <div>
        <p className="text-2xl font-bold leading-none">{c.value}</p>
        <p className="text-xs font-medium mt-1.5">{c.label}</p>
        <p className="text-[11px] text-muted-foreground">{c.hint}</p>
       </div>
      </button>
     );
    })}
   </div>

   {isPartial && (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-700 dark:text-amber-400">
     Showing {employees.length} of {serverMeta?.total} employees. The server
     is paginating, so filters and exports only cover the loaded rows. Raise
     the limit in FETCH_ARGS to load everyone.
    </div>
   )}

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
        <SelectItem key={p.value} value={p.value}>
         {p.label}
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
        <SelectItem key={g.value} value={g.value}>
         {g.label}
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
        <SelectItem key={c.value} value={c.value}>
         {c.label}
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
      searchPlaceholder="Search name, ID, iqama, position, department, remark…"
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
