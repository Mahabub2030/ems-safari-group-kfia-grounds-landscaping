import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileSpreadsheet,
  FileText,
  Plus,
  RefreshCw,
  Search,
  UserCheck,
  UserX,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";

// ==========================================
// TYPES & INTERFACES
// ==========================================

export interface RawEmployeeData {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  jobTitle: string;
  group: string;
  status: "Active" | "ON_LEAVE" | "UPCOMING" | string;
  totalAllowance: number;
  usedDays: number;
  pendingDays: number;
  remainingDays: number;
  nextLeaveDate: string;
  avatarUrl?: string;
}

export interface EmployeeVacationRecord extends RawEmployeeData {
  formattedStatus: "Active" | "On Leave" | "Upcoming";
}

interface EmployeeVacationTablePageProps {
  dataUrl?: string;
  onAssignVacation?: () => void;
}

// ==========================================
// MOCK FALLBACK DATA
// ==========================================

const MOCK_EMPLOYEE_DATA: RawEmployeeData[] = [
  {
    _id: "65f01a9b1c2d3e4f5a6b7c01",
    employeeId: "EMP-1001",
    name: "Aamir Al-Mansoor",
    email: "aamir.mansoor@safari.com",
    jobTitle: "Lead Full Stack Developer",
    group: "Engineering",
    status: "Active",
    totalAllowance: 30,
    usedDays: 8,
    pendingDays: 2,
    remainingDays: 20,
    nextLeaveDate: "Sep 15, 2026",
    avatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
  },
  {
    _id: "65f01a9b1c2d3e4f5a6b7c02",
    employeeId: "EMP-1002",
    name: "Tariq Mahmood",
    email: "tariq.m@safari.com",
    jobTitle: "Administrative Officer",
    group: "Administrative",
    status: "ON_LEAVE",
    totalAllowance: 30,
    usedDays: 15,
    pendingDays: 0,
    remainingDays: 15,
    nextLeaveDate: "Returns Aug 28, 2026",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
  },
  {
    _id: "65f01a9b1c2d3e4f5a6b7c03",
    employeeId: "EMP-1003",
    name: "Sarah Jenkins",
    email: "sarah.j@safari.com",
    jobTitle: "UI/UX Designer",
    group: "Design",
    status: "UPCOMING",
    totalAllowance: 25,
    usedDays: 5,
    pendingDays: 5,
    remainingDays: 15,
    nextLeaveDate: "Oct 01, 2026",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
  },
  {
    _id: "65f01a9b1c2d3e4f5a6b7c04",
    employeeId: "EMP-1004",
    name: "Khaled Nabil",
    email: "khaled.n@safari.com",
    jobTitle: "DevOps Engineer",
    group: "Engineering",
    status: "Active",
    totalAllowance: 30,
    usedDays: 12,
    pendingDays: 0,
    remainingDays: 18,
    nextLeaveDate: "Dec 10, 2026",
  },
  {
    _id: "65f01a9b1c2d3e4f5a6b7c05",
    employeeId: "EMP-1005",
    name: "Fatima Hassan",
    email: "fatima.h@safari.com",
    jobTitle: "HR Specialist",
    group: "HR",
    status: "Active",
    totalAllowance: 30,
    usedDays: 22,
    pendingDays: 0,
    remainingDays: 8,
    nextLeaveDate: "None",
  },
  {
    _id: "65f01a9b1c2d3e4f5a6b7c06",
    employeeId: "EMP-1006",
    name: "Youssef Al-Harbi",
    email: "youssef.h@safari.com",
    jobTitle: "Operations Manager",
    group: "Operations",
    status: "ON_LEAVE",
    totalAllowance: 30,
    usedDays: 18,
    pendingDays: 0,
    remainingDays: 12,
    nextLeaveDate: "Returns Sep 02, 2026",
  },
];

// DATA TRANSFORMER
const transformEmployeeData = (
  raw: RawEmployeeData,
): EmployeeVacationRecord => {
  let formattedStatus: "Active" | "On Leave" | "Upcoming" = "Active";
  const upperStatus = raw.status?.toUpperCase() || "";

  if (upperStatus === "ON_LEAVE" || upperStatus === "ON LEAVE") {
    formattedStatus = "On Leave";
  } else if (upperStatus === "UPCOMING") {
    formattedStatus = "Upcoming";
  }

  return {
    ...raw,
    formattedStatus,
  };
};

// ==========================================
// MAIN COMPONENT
// ==========================================

export const EmployeeVacationTablePage: React.FC<
  EmployeeVacationTablePageProps
> = ({ dataUrl = "/api/em.json", onAssignVacation }) => {
  const [allEmployees, setAllEmployees] = useState<EmployeeVacationRecord[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [, setError] = useState<string | null>(null);

  // Filters & Pagination State
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedGroup, setSelectedGroup] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;

  // ------------------------------------------
  // Data Fetching
  // ------------------------------------------
  const fetchEmployeeData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(dataUrl);
      if (!response.ok) {
        throw new Error(`Failed to load data (Status: ${response.status})`);
      }
      const rawData: RawEmployeeData[] = await response.json();
      setAllEmployees(rawData.map(transformEmployeeData));
    } catch (err: any) {
      console.warn("API load failed, using fallback dataset:", err.message);
      setAllEmployees(MOCK_EMPLOYEE_DATA.map(transformEmployeeData));
    } finally {
      setIsLoading(false);
    }
  }, [dataUrl]);

  useEffect(() => {
    fetchEmployeeData();
  }, [fetchEmployeeData]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedGroup, selectedStatus]);

  // ------------------------------------------
  // Memoized Metrics & Department Options
  // ------------------------------------------
  const departments = useMemo(() => {
    const groups = Array.from(new Set(allEmployees.map((e) => e.group)));
    return ["All", ...groups.sort()];
  }, [allEmployees]);

  const metrics = useMemo(() => {
    return {
      total: allEmployees.length,
      active: allEmployees.filter((e) => e.formattedStatus === "Active").length,
      onLeave: allEmployees.filter((e) => e.formattedStatus === "On Leave")
        .length,
      upcoming: allEmployees.filter((e) => e.formattedStatus === "Upcoming")
        .length,
    };
  }, [allEmployees]);

  // ------------------------------------------
  // Filtering & Pagination Logic
  // ------------------------------------------
  const filteredEmployees = useMemo(() => {
    return allEmployees.filter((emp) => {
      const matchesSearch =
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.jobTitle.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesGroup =
        selectedGroup === "All" || emp.group === selectedGroup;
      const matchesStatus =
        selectedStatus === "All" || emp.formattedStatus === selectedStatus;

      return matchesSearch && matchesGroup && matchesStatus;
    });
  }, [allEmployees, searchTerm, selectedGroup, selectedStatus]);

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
      "Employee ID": emp.employeeId,
      Name: emp.name,
      Email: emp.email,
      "Job Title": emp.jobTitle,
      Department: emp.group,
      Status: emp.formattedStatus,
      "Total Allowance": emp.totalAllowance,
      "Used Days": emp.usedDays,
      "Pending Days": emp.pendingDays,
      "Remaining Days": emp.remainingDays,
      "Next / Return Date": emp.nextLeaveDate,
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
    const doc = new jsPDF("landscape");

    doc.setFontSize(16);
    doc.text("Employee Vacation Tracker Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

    const tableHeaders = [
      [
        "ID",
        "Name",
        "Job Title",
        "Department",
        "Status",
        "Allowance",
        "Used",
        "Pending",
        "Remaining",
        "Next Leave Date",
      ],
    ];

    const tableRows = filteredEmployees.map((emp) => [
      emp.employeeId,
      emp.name,
      emp.jobTitle,
      emp.group,
      emp.formattedStatus,
      `${emp.totalAllowance} d`,
      `${emp.usedDays} d`,
      `${emp.pendingDays} d`,
      `${emp.remainingDays} d`,
      emp.nextLeaveDate,
    ]);

    autoTable(doc, {
      head: tableHeaders,
      body: tableRows,
      startY: 28,
      theme: "striped",
      headStyles: { fillColor: [79, 70, 229] }, // Indigo color
      styles: { fontSize: 8 },
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
      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 dark:bg-slate-900 min-h-screen text-slate-900 dark:text-slate-100">
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
            onClick={fetchEmployeeData}
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

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, ID, or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
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
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">Status: All</option>
            <option value="Active">Status: Active</option>
            <option value="On Leave">Status: On Leave</option>
            <option value="Upcoming">Status: Upcoming</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100/75 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Allowance</th>
                <th className="py-3.5 px-4 text-center">Used</th>
                <th className="py-3.5 px-4 text-center">Pending</th>
                <th className="py-3.5 px-4 text-center">Remaining</th>
                <th className="py-3.5 px-4">Next / Return Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    Loading employee vacation records...
                  </td>
                </tr>
              ) : paginatedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No employee records match your selected criteria.
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map((employee) => (
                  <tr
                    key={employee._id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition"
                  >
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
                    <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {employee.group}
                    </td>
                    <td className="py-3.5 px-4">
                      {renderStatusBadge(employee.formattedStatus)}
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
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                      {employee.nextLeaveDate}
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
