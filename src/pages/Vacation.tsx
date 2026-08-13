import React, { useState, useMemo } from "react";
import {
  Search,
  Palmtree,
  Clock,
  CheckCircle2,
  FileText,
  UserCheck,
  Filter,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  FileSpreadsheet
} from "lucide-react";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Employee Vacation Interface
interface EmployeeVacation {
  id: string;
  name: string;
  role: string;
  department: string;
  avatarUrl?: string;
  totalAllowance: number;
  usedDays: number;
  pendingDays: number;
  remainingDays: number;
  status: "Active" | "On Leave" | "Upcoming";
  nextLeaveDate?: string;
}

// Generates sample mock data
const generateMockData = (): EmployeeVacation[] => {
  const departments = ["Engineering", "Design", "Operations", "HR", "Marketing"];
  const statuses: ("Active" | "On Leave" | "Upcoming")[] = ["Active", "On Leave", "Upcoming"];
  const roles = ["Developer", "Designer", "Manager", "Analyst", "Lead"];

  return Array.from({ length: 120 }, (_, i) => {
    const idNum = String(i + 1).padStart(3, "0");
    const total = 25;
    const used = Math.floor(Math.random() * 15);
    const pending = Math.floor(Math.random() * 4);
    const remaining = total - used;
    const status = statuses[i % 3];

    return {
      id: `EMP-${idNum}`,
      name: `Employee ${i + 1}`,
      role: `${roles[i % roles.length]}`,
      department: departments[i % departments.length],
      totalAllowance: total,
      usedDays: used,
      pendingDays: pending,
      remainingDays: remaining,
      status: status,
      nextLeaveDate: status === "On Leave" ? "Currently On Leave" : `2026-09-${(i % 28) + 1}`,
    };
  });
};

const allEmployees = generateMockData();

export default function EmployeeVacationTablePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  // Pagination States ("10" | "50" | "100" | "all")
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<string>("10");

  // Filter Logic
  const filteredEmployees = useMemo(() => {
    return allEmployees.filter((emp) => {
      const matchesSearch =
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDept =
        departmentFilter === "all" ||
        emp.department.toLowerCase() === departmentFilter.toLowerCase();

      return matchesSearch && matchesDept;
    });
  }, [searchTerm, departmentFilter]);

  // Numerical Page Size Helper
  const numericPageSize = pageSize === "all" ? filteredEmployees.length || 1 : Number(pageSize);

  // Pagination Calculations
  const totalItems = filteredEmployees.length;
  const totalPages = Math.ceil(totalItems / numericPageSize) || 1;

  // Paginated Data Chunk
  const paginatedEmployees = useMemo(() => {
    if (pageSize === "all") return filteredEmployees;
    const start = (currentPage - 1) * numericPageSize;
    return filteredEmployees.slice(start, start + numericPageSize);
  }, [filteredEmployees, currentPage, pageSize, numericPageSize]);

  // Export to Excel Function
  const exportToExcel = () => {
    const dataToExport = filteredEmployees.map((emp) => ({
      "Employee ID": emp.id,
      "Name": emp.name,
      "Role": emp.role,
      "Department": emp.department,
      "Status": emp.status,
      "Total Allowed": emp.totalAllowance,
      "Used Days": emp.usedDays,
      "Pending Days": emp.pendingDays,
      "Remaining Days": emp.remainingDays,
      "Next Leave / Note": emp.nextLeaveDate || "None",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Employee Vacations");
    XLSX.writeFile(workbook, `employee_vacations_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Export to PDF Function
  const exportToPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Employee Vacations Directory", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

    const tableHeaders = [
      ["ID", "Name", "Role", "Department", "Status", "Allowed", "Used", "Pending", "Remaining"]
    ];

    const tableData = filteredEmployees.map((emp) => [
      emp.id,
      emp.name,
      emp.role,
      emp.department,
      emp.status,
      `${emp.totalAllowance} Days`,
      `${emp.usedDays} Days`,
      emp.pendingDays > 0 ? `${emp.pendingDays} Days` : "-",
      `${emp.remainingDays} Days`
    ]);

    autoTable(doc, {
      head: tableHeaders,
      body: tableData,
      startY: 28,
      theme: "striped",
      headStyles: { fillColor: [16, 185, 129] }, // Emerald header color
      styles: { fontSize: 8, cellPadding: 3 }
    });

    doc.save(`employee_vacations_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // Reset to page 1 on filter/pageSize change
  const handlePageSizeChange = (value: string) => {
    setPageSize(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (value: string) => {
    setDepartmentFilter(value);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const getStatusBadge = (status: EmployeeVacation["status"]) => {
    switch (status) {
      case "Active":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border-emerald-500/20">
            <UserCheck className="w-3 h-3 mr-1" /> Active
          </Badge>
        );
      case "On Leave":
        return (
          <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 border-amber-500/20">
            <Palmtree className="w-3 h-3 mr-1" /> On Leave
          </Badge>
        );
      case "Upcoming":
        return (
          <Badge className="bg-blue-500/15 text-blue-600 hover:bg-blue-500/25 border-blue-500/20">
            <Clock className="w-3 h-3 mr-1" /> Scheduled
          </Badge>
        );
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employee Vacations</h1>
          <p className="text-muted-foreground mt-1">
            Overview of team leave balances, active leaves, and upcoming time off.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Excel Export */}
          <Button
            variant="outline"
            onClick={exportToExcel}
            className="gap-2 border-emerald-600/30 hover:bg-emerald-500/10 text-emerald-700"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Excel
          </Button>

          {/* PDF Export */}
          <Button
            variant="outline"
            onClick={exportToPDF}
            className="gap-2 border-rose-600/30 hover:bg-rose-500/10 text-rose-700"
          >
            <Download className="w-4 h-4 text-rose-600" /> PDF
          </Button>

          {/* Assign Action */}
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
            <Plus className="w-4 h-4" /> Assign Vacation
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Currently On Leave</CardTitle>
            <Palmtree className="w-5 h-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">
              {allEmployees.filter((e) => e.status === "On Leave").length} Employees
            </div>
            <p className="text-xs text-muted-foreground mt-1">Out of {allEmployees.length} total staff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="w-5 h-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">
              {allEmployees.reduce((acc, curr) => acc + (curr.pendingDays > 0 ? 1 : 0), 0)} Requests
            </div>
            <p className="text-xs text-muted-foreground mt-1">Requires manager action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Remaining Balance</CardTitle>
            <CheckCircle2 className="w-5 h-5 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">18.2 Days</div>
            <p className="text-xs text-muted-foreground mt-1">Average per employee</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader className="gap-4">
          <div>
            <CardTitle>Team Vacation Directory</CardTitle>
            <CardDescription>Track leave balances and statuses across all departments</CardDescription>
          </div>

          {/* Search & Filter Tools */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-2">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employee, ID, or role..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={departmentFilter} onValueChange={handleFilterChange}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="engineering">Engineering</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {paginatedEmployees.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>No matching employee vacation records found.</p>
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-center">Total Allowed</th>
                    <th className="px-4 py-3 text-center">Used</th>
                    <th className="px-4 py-3 text-center">Pending</th>
                    <th className="px-4 py-3 text-center">Remaining</th>
                    <th className="px-4 py-3">Next Leave / Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedEmployees.map((emp) => {
                    const remainingPct = (emp.remainingDays / emp.totalAllowance) * 100;

                    return (
                      <tr key={emp.id} className="hover:bg-muted/30 transition-colors">
                        {/* Employee Details */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={emp.avatarUrl} alt={emp.name} />
                              <AvatarFallback className="bg-emerald-600 text-white font-semibold text-xs">
                                {emp.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-semibold text-foreground flex items-center gap-2">
                                {emp.name}
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  ({emp.id})
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {emp.role} • <span className="font-medium text-slate-500">{emp.department}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          {getStatusBadge(emp.status)}
                        </td>

                        {/* Total Allowed */}
                        <td className="px-4 py-4 text-center font-medium">
                          {emp.totalAllowance} Days
                        </td>

                        {/* Used */}
                        <td className="px-4 py-4 text-center font-medium text-slate-600">
                          {emp.usedDays} Days
                        </td>

                        {/* Pending */}
                        <td className="px-4 py-4 text-center font-medium">
                          {emp.pendingDays > 0 ? (
                            <span className="text-amber-600 font-semibold">{emp.pendingDays} Days</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>

                        {/* Remaining & Custom Bar */}
                        <td className="px-4 py-4 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="font-bold text-emerald-600">{emp.remainingDays} Days</span>
                            <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                              <div
                                className="bg-emerald-600 h-full rounded-full"
                                style={{ width: `${remainingPct}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Next Leave Date */}
                        <td className="px-4 py-4 whitespace-nowrap text-xs text-muted-foreground">
                          {emp.nextLeaveDate || "None"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls Section */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 mt-4 border-t border-border">
            {/* Rows Per Page Dropdown & Record Counter */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Rows per page</span>
                <Select value={pageSize} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className="h-8 w-[80px]">
                    <SelectValue placeholder={pageSize} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="all">ALL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <span className="text-xs text-muted-foreground">
                Showing {totalItems > 0 ? (pageSize === "all" ? 1 : (currentPage - 1) * numericPageSize + 1) : 0} to{" "}
                {pageSize === "all" ? totalItems : Math.min(currentPage * numericPageSize, totalItems)} of {totalItems} entries
              </span>
            </div>

            {/* Page Controls */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground mr-2">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1 || pageSize === "all"}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || pageSize === "all"}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || pageSize === "all"}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || pageSize === "all"}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
