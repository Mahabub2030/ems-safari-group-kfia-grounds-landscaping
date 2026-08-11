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
  Trash2,
  UserCheck,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export interface MockEmployee {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  jobTitle: string;
  idNumber: string;
  employeeId: string;
  dacoId?: string;
  group: string;
  joiningDate: string;
  nationality: string;
  companyName: string;
  status: "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "TERMINATED" | string;
  workLocation?: string;
  remark?: string;
  updatedAt?: string;
}

// Sample JSON Data aligned with your provided structure
const MOCK_DATA: MockEmployee[] = [
  {
    _id: "6a40b233a377d5283b7c44a2",
    name: "Eman AlNasser",
    email: "eman.alnasser@safari.com.sa",
    phoneNumber: "+966 50 123 4567",
    jobTitle: "Administrator",
    idNumber: "1063800229",
    employeeId: "67712",
    dacoId: "DAC-9011",
    group: "Administrative / Management",
    joiningDate: "2026-04-01T00:00:00.000Z",
    nationality: "Saudi",
    companyName: "Safari Group",
    status: "ACTIVE",
    workLocation: "Dammam HQ",
    remark: "Primary Admin Contact",
    updatedAt: "2026-07-03T12:52:52.551Z",
  },
  {
    _id: "7b51c344b488e6394c8d55b3",
    name: "Tariq Al-Mansoor",
    email: "tariq.m@safari.com.sa",
    phoneNumber: "+966 55 987 6543",
    jobTitle: "MERN Stack Developer",
    idNumber: "1098234711",
    employeeId: "68823",
    dacoId: "DAC-8842",
    group: "Engineering & IT",
    joiningDate: "2025-11-15T00:00:00.000Z",
    nationality: "Saudi",
    companyName: "Safari Contracting",
    status: "ACTIVE",
    workLocation: "Dammam Site",
    remark: "",
    updatedAt: "2026-06-10T09:12:00.000Z",
  },
  {
    _id: "8c62d455c599f7405d9e66c4",
    name: "Rahul Sharma",
    email: "rahul.sharma@safari.com.sa",
    phoneNumber: "+966 53 444 3210",
    jobTitle: "Full Stack Developer",
    idNumber: "2389102938",
    employeeId: "69001",
    dacoId: "",
    group: "Engineering & IT",
    joiningDate: "2026-01-10T00:00:00.000Z",
    nationality: "Indian",
    companyName: "Safari Contracting",
    status: "ON_LEAVE",
    workLocation: "Khobar Branch",
    remark: "Annual Vacation",
    updatedAt: "2026-08-01T10:00:00.000Z",
  },
];

const PAGE_SIZE = 10;

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
  { label: "On Leave", value: "ON_LEAVE" },
  { label: "Terminated", value: "TERMINATED" },
  { label: "Inactive", value: "INACTIVE" },
];

export default function Employees() {
  // const { user } = useAuth();
  // const canEdit = user?.role === "admin" || user?.role === "superadmin";
  const canEdit = true; // For demonstration purposes, allow editing for all users
  const [employees, setEmployees] = useState<MockEmployee[]>(MOCK_DATA);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<MockEmployee | null>(
    null,
  );

  const [form, setForm] = useState<Partial<MockEmployee>>({
    name: "",
    email: "",
    phoneNumber: "",
    jobTitle: "Administrator",
    employeeId: "",
    idNumber: "",
    dacoId: "",
    group: "Administrative / Management",
    nationality: "Saudi",
    companyName: "Safari Group",
    status: "ACTIVE",
    workLocation: "",
  });

  // Search & Filter
  const filtered = useMemo(() => {
    return employees.filter((e) => {
      const q = search.toLowerCase();
      const matchSearch =
        e.name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.employeeId.toLowerCase().includes(q) ||
        e.idNumber.includes(q) ||
        e.companyName.toLowerCase().includes(q);

      const matchStatus = statusFilter === "all" || e.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [employees, search, statusFilter]);

  const paginated = useMemo(() => {
    return filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [filtered, page]);

  const openAdd = () => {
    setEditingEmployee(null);
    setForm({
      name: "",
      email: "",
      phoneNumber: "",
      jobTitle: "Administrator",
      employeeId: "",
      idNumber: "",
      dacoId: "",
      group: "Administrative / Management",
      nationality: "Saudi",
      companyName: "Safari Group",
      status: "ACTIVE",
      workLocation: "",
    });
    setDialogOpen(true);
  };

  const openEdit = (emp: MockEmployee) => {
    setEditingEmployee(emp);
    setForm({ ...emp });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name?.trim() || !form.email?.trim() || !form.employeeId?.trim()) {
      toast.error("Name, Email, and Employee ID are required");
      return;
    }

    if (editingEmployee) {
      setEmployees((prev) =>
        prev.map((emp) =>
          emp._id === editingEmployee._id
            ? ({ ...emp, ...form } as MockEmployee)
            : emp,
        ),
      );
      toast.success("Employee updated successfully");
    } else {
      const newEmp: MockEmployee = {
        ...(form as MockEmployee),
        _id: String(Date.now()),
        joiningDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setEmployees((prev) => [newEmp, ...prev]);
      toast.success("Employee added successfully");
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setEmployees((prev) => prev.filter((emp) => emp._id !== id));
    toast.success("Employee record deleted");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filtered.map((e) => ({
        "Employee ID": e.employeeId,
        "ID/Iqama": e.idNumber,
        Name: e.name,
        Email: e.email,
        Phone: e.phoneNumber,
        "Job Title": e.jobTitle,
        Group: e.group,
        Company: e.companyName,
        Nationality: e.nationality,
        Status: e.status,
        "Joining Date": e.joiningDate
          ? new Date(e.joiningDate).toLocaleDateString()
          : "",
      })),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employees");
    XLSX.writeFile(wb, "employees_list.xlsx");
    toast.success("Excel sheet downloaded");
  };

  const exportPDF = () => {
    const doc = new jsPDF("landscape");
    doc.setFontSize(15);
    doc.text("Safari Group - Employee Directory", 14, 15);
    autoTable(doc, {
      startY: 22,
      head: [
        [
          "Emp ID",
          "ID/Iqama",
          "Name",
          "Job Title",
          "Department/Group",
          "Company",
          "Phone",
          "Status",
        ],
      ],
      body: filtered.map((e) => [
        e.employeeId,
        e.idNumber,
        e.name,
        e.jobTitle,
        e.group,
        e.companyName,
        e.phoneNumber,
        e.status,
      ]),
      styles: { fontSize: 8 },
    });
    doc.save("employees_report.pdf");
    toast.success("PDF report downloaded");
  };

  // Dense Multi-Column Layout Configuration
  const columns: Column<MockEmployee>[] = [
    {
      key: "sr",
      label: "#",
      render: (_r, i) => (
        <span className="text-xs text-muted-foreground font-mono">
          {(page - 1) * PAGE_SIZE + i + 1}
        </span>
      ),
    },
    {
      key: "employeeId",
      label: "Emp ID / Iqama",
      render: (emp) => (
        <div>
          <p className="font-semibold text-xs text-primary">{emp.employeeId}</p>
          <p className="text-[11px] text-muted-foreground font-mono">
            {emp.idNumber}
          </p>
        </div>
      ),
    },
    {
      key: "name",
      label: "Employee",
      render: (emp) => (
        <div className="flex items-center gap-2.5 min-w-[180px]">
          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs border border-primary/20">
            {emp.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="truncate">
            <p className="font-medium text-xs leading-none text-foreground">
              {emp.name}
            </p>
            <p className="text-[11px] text-muted-foreground truncate mt-1">
              {emp.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "jobTitle",
      label: "Job Title & Group",
      render: (emp) => (
        <div className="min-w-[150px]">
          <p className="text-xs font-medium text-foreground">{emp.jobTitle}</p>
          <p className="text-[11px] text-muted-foreground truncate">
            {emp.group}
          </p>
        </div>
      ),
    },
    {
      key: "companyName",
      label: "Company",
      render: (emp) => (
        <div className="flex items-center gap-1.5 min-w-[130px]">
          <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs font-medium">{emp.companyName}</span>
        </div>
      ),
    },
    {
      key: "phoneNumber",
      label: "Phone & Location",
      render: (emp) => (
        <div className="min-w-[120px]">
          <p className="text-xs font-mono">{emp.phoneNumber}</p>
          <p className="text-[11px] text-muted-foreground">
            {emp.workLocation || "—"}
          </p>
        </div>
      ),
    },
    {
      key: "nationality",
      label: "Nationality",
      render: (emp) => (
        <span className="text-xs font-medium">{emp.nationality}</span>
      ),
    },
    {
      key: "joiningDate",
      label: "Joining Date",
      render: (emp) => (
        <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
          {emp.joiningDate
            ? new Date(emp.joiningDate).toLocaleDateString("en-US", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "—"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (emp) => (
        <span
          className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold inline-block text-center ${
            statusBadge[emp.status] || "bg-slate-100 text-slate-700"
          }`}
        >
          {emp.status}
        </span>
      ),
    },
    ...(canEdit
      ? ([
          {
            key: "actions",
            label: "Actions",
            className:
              "text-right sticky right-0 bg-background/95 backdrop-blur-sm",
            render: (emp: MockEmployee) => (
              <div
                className="flex items-center justify-end gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => openEdit(emp)}
                  className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                  title="Edit"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(emp._id)}
                  className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ),
          },
        ] as Column<MockEmployee>[])
      : []),
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4 p-4 md:p-6"
    >
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Employee Management
          </h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            Showing{" "}
            <span className="font-semibold text-foreground">
              {filtered.length}
            </span>{" "}
            recorded employees
          </p>
        </div>
      </div>

      {/* Styled DataTable with Horizontal and Vertical Overflow Containers */}
      <div className="border rounded-xl shadow-sm bg-card overflow-hidden">
        <div className="w-full overflow-x-auto overflow-y-auto max-h-[600px] scrollbar-thin scrollbar-thumb-muted-foreground/20">
          <DataTable<MockEmployee>
            data={paginated}
            columns={columns}
            rowKey={(e) => e._id}
            // onRowClick={(e) => navigate(`/employees/${e._id}`)}
            search={search}
            onSearchChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            searchPlaceholder="Search Name, ID, Iqama, Company..."
            filterValue={statusFilter}
            onFilterChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
            filterOptions={statusFilterOptions}
            filterPlaceholder="All Statuses"
            page={page}
            pageSize={PAGE_SIZE}
            total={filtered.length}
            onPageChange={setPage}
            emptyMessage="No employee records found"
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
                {canEdit && (
                  <Button
                    size="sm"
                    onClick={openAdd}
                    className="h-8 text-xs bg-primary"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Employee
                  </Button>
                )}
              </div>
            }
          />
        </div>
      </div>

      {/* Add / Edit Dialog Form */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? "Edit Employee Record" : "Add New Employee"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-muted-foreground mb-1 block">
                  Full Name *
                </label>
                <Input
                  value={form.name || ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Eman AlNasser"
                />
              </div>
              <div>
                <label className="font-medium text-muted-foreground mb-1 block">
                  Email *
                </label>
                <Input
                  value={form.email || ""}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  type="email"
                  placeholder="eman@safari.com.sa"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-medium text-muted-foreground mb-1 block">
                  Employee ID *
                </label>
                <Input
                  value={form.employeeId || ""}
                  onChange={(e) =>
                    setForm({ ...form, employeeId: e.target.value })
                  }
                  placeholder="67712"
                />
              </div>
              <div>
                <label className="font-medium text-muted-foreground mb-1 block">
                  ID / Iqama Number
                </label>
                <Input
                  value={form.idNumber || ""}
                  onChange={(e) =>
                    setForm({ ...form, idNumber: e.target.value })
                  }
                  placeholder="1063800229"
                />
              </div>
              <div>
                <label className="font-medium text-muted-foreground mb-1 block">
                  DACO ID
                </label>
                <Input
                  value={form.dacoId || ""}
                  onChange={(e) => setForm({ ...form, dacoId: e.target.value })}
                  placeholder="DAC-102"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-muted-foreground mb-1 block">
                  Job Title
                </label>
                <Input
                  value={form.jobTitle || ""}
                  onChange={(e) =>
                    setForm({ ...form, jobTitle: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="font-medium text-muted-foreground mb-1 block">
                  Department / Group
                </label>
                <Input
                  value={form.group || ""}
                  onChange={(e) => setForm({ ...form, group: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-muted-foreground mb-1 block">
                  Company Name
                </label>
                <Input
                  value={form.companyName || ""}
                  onChange={(e) =>
                    setForm({ ...form, companyName: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="font-medium text-muted-foreground mb-1 block">
                  Phone Number
                </label>
                <Input
                  value={form.phoneNumber || ""}
                  onChange={(e) =>
                    setForm({ ...form, phoneNumber: e.target.value })
                  }
                  placeholder="+966 50 000 0000"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-medium text-muted-foreground mb-1 block">
                  Nationality
                </label>
                <Input
                  value={form.nationality || ""}
                  onChange={(e) =>
                    setForm({ ...form, nationality: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="font-medium text-muted-foreground mb-1 block">
                  Work Location
                </label>
                <Input
                  value={form.workLocation || ""}
                  onChange={(e) =>
                    setForm({ ...form, workLocation: e.target.value })
                  }
                  placeholder="Dammam Site"
                />
              </div>
              <div>
                <label className="font-medium text-muted-foreground mb-1 block">
                  Status
                </label>
                <Select
                  value={form.status || "ACTIVE"}
                  onValueChange={(v) => setForm({ ...form, status: v })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                    <SelectItem value="ON_LEAVE">ON_LEAVE</SelectItem>
                    <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                    <SelectItem value="TERMINATED">TERMINATED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleSave} className="w-full mt-3 bg-primary">
              <UserCheck className="h-4 w-4 mr-1.5" />
              {editingEmployee ? "Update Employee" : "Save Employee"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
