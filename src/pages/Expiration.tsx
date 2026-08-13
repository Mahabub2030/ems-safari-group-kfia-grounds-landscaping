
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
  Building2,
  Calendar,
  Clock,
  Download,
  FileText,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export interface MockDocumentExpiry {
  _id: string;
  name: string;
  email: string;
  employeeId: string;
  idNumber: string; // Iqama / National ID
  dacoId?: string;
  group: string;
  companyName: string;
  iqamaExpiryDate: string; // ISO String YYYY-MM-DD
  dacoExpiryDate?: string; // ISO String YYYY-MM-DD
  workLocation?: string;
  remark?: string;
}

const MOCK_EXPIRY_DATA: MockDocumentExpiry[] = [
  {
    _id: "6a40b233a377d5283b7c44a2",
    name: "Eman AlNasser",
    email: "eman.alnasser@safari.com.sa",
    employeeId: "67712",
    idNumber: "1063800229",
    dacoId: "DAC-9011",
    group: "Administrative / Management",
    companyName: "Safari Group",
    iqamaExpiryDate: "2026-08-25", // Expiring soon
    dacoExpiryDate: "2027-04-10",
    workLocation: "Dammam HQ",
    remark: "Renewal requested",
  },
  {
    _id: "7b51c344b488e6394c8d55b3",
    name: "Tariq Al-Mansoor",
    email: "tariq.m@safari.com.sa",
    employeeId: "68823",
    idNumber: "1098234711",
    dacoId: "DAC-8842",
    group: "Engineering & IT",
    companyName: "Safari Contracting",
    iqamaExpiryDate: "2026-08-05", // Already Expired
    dacoExpiryDate: "2026-08-18", // Expiring soon
    workLocation: "Dammam Site",
    remark: "Pending Iqama payment",
  },
  {
    _id: "8c62d455c599f7405d9e66c4",
    name: "Rahul Sharma",
    email: "rahul.sharma@safari.com.sa",
    employeeId: "69001",
    idNumber: "2389102938",
    dacoId: "DAC-3021",
    group: "Engineering & IT",
    companyName: "Safari Contracting",
    iqamaExpiryDate: "2027-02-14", // Valid
    dacoExpiryDate: "2026-09-01", // Expiring soon
    workLocation: "Khobar Branch",
    remark: "DACO pass update needed",
  },
];

// Helper function to calculate remaining days from current date
const getDaysRemaining = (expiryDateString?: string) => {
  if (!expiryDateString) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDateString);
  expiry.setHours(0, 0, 0, 0);

  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Render badge depending on urgency (Expired, Critical <= 30 days, Warning <= 60 days, OK)
const renderExpiryBadge = (dateString?: string) => {
  const days = getDaysRemaining(dateString);
  if (days === null) return <span className="text-muted-foreground">—</span>;

  let badgeStyle = "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
  let label = `${days} Days Left`;

  if (days < 0) {
    badgeStyle = "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20 animate-pulse";
    label = `Expired (${Math.abs(days)}d ago)`;
  } else if (days <= 30) {
    badgeStyle = "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20";
    label = `${days} Days (Urgent)`;
  } else if (days <= 60) {
    badgeStyle = "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20";
    label = `${days} Days Left`;
  }

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-mono font-medium">{dateString}</span>
      <span
        className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold inline-block text-center w-fit ${badgeStyle}`}
      >
        {label}
      </span>
    </div>
  );
};

const filterStatusOptions: FilterOption[] = [
  { label: "Expired", value: "EXPIRED" },
  { label: "Expiring in 30 Days", value: "30_DAYS" },
  { label: "Expiring in 60 Days", value: "60_DAYS" },
  { label: "Valid", value: "VALID" },
];

export default function Expiration() {
  const [data, setData] = useState<MockDocumentExpiry[]>(MOCK_EXPIRY_DATA);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [expiryStatusFilter, setExpiryStatusFilter] = useState("all");
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MockDocumentExpiry | null>(null);

  const [form, setForm] = useState<Partial<MockDocumentExpiry>>({
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
  });

  // Dynamic Group filter options
  const groupOptions = useMemo(() => {
    const uniqueGroups = Array.from(
      new Set(data.map((e) => e.group).filter(Boolean))
    );
    return uniqueGroups.map((g) => ({ label: g, value: g }));
  }, [data]);

  // Combined Search & Filtering logic
  const filtered = useMemo(() => {
    return data.filter((item) => {
      const q = search.toLowerCase();
      const matchSearch =
        item.name.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.employeeId.toLowerCase().includes(q) ||
        item.idNumber.includes(q) ||
        (item.dacoId && item.dacoId.toLowerCase().includes(q)) ||
        item.group.toLowerCase().includes(q) ||
        item.companyName.toLowerCase().includes(q);

      const matchGroup = groupFilter === "all" || item.group === groupFilter;

      // Expiry days status filter checking Iqama OR DACO
      const iqamaDays = getDaysRemaining(item.iqamaExpiryDate);
      const dacoDays = getDaysRemaining(item.dacoExpiryDate);
      const minDays = Math.min(
        iqamaDays ?? Infinity,
        dacoDays ?? Infinity
      );

      let matchExpiry = true;
      if (expiryStatusFilter === "EXPIRED") {
        matchExpiry = (iqamaDays !== null && iqamaDays < 0) || (dacoDays !== null && dacoDays < 0);
      } else if (expiryStatusFilter === "30_DAYS") {
        matchExpiry = minDays >= 0 && minDays <= 30;
      } else if (expiryStatusFilter === "60_DAYS") {
        matchExpiry = minDays >= 0 && minDays <= 60;
      } else if (expiryStatusFilter === "VALID") {
        matchExpiry = minDays > 60;
      }

      return matchSearch && matchGroup && matchExpiry;
    });
  }, [data, search, groupFilter, expiryStatusFilter]);

  // Pagination Logic
  const paginated = useMemo(() => {
    if (pageSize === 0) return filtered;
    return filtered.slice((page - 1) * pageSize, page * pageSize);
  }, [filtered, page, pageSize]);

  const openAdd = () => {
    setEditingRecord(null);
    setForm({
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
    });
    setDialogOpen(true);
  };

  const openEdit = (record: MockDocumentExpiry) => {
    setEditingRecord(record);
    setForm({ ...record });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name?.trim() || !form.employeeId?.trim() || !form.iqamaExpiryDate) {
      toast.error("Name, Employee ID, and Iqama Expiry Date are required");
      return;
    }

    if (editingRecord) {
      setData((prev) =>
        prev.map((item) =>
          item._id === editingRecord._id ? ({ ...item, ...form } as MockDocumentExpiry) : item
        )
      );
      toast.success("Document expiry dates updated");
    } else {
      const newRec: MockDocumentExpiry = {
        ...(form as MockDocumentExpiry),
        _id: String(Date.now()),
      };
      setData((prev) => [newRec, ...prev]);
      toast.success("New expiration tracking record created");
    }
    setDialogOpen(false);
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filtered.map((e) => ({
        "Employee ID": e.employeeId,
        "Name": e.name,
        "Iqama / ID": e.idNumber,
        "Iqama Expiry": e.iqamaExpiryDate,
        "Iqama Days Left": getDaysRemaining(e.iqamaExpiryDate) ?? "N/A",
        "DACO ID": e.dacoId || "",
        "DACO Expiry": e.dacoExpiryDate || "",
        "DACO Days Left": getDaysRemaining(e.dacoExpiryDate) ?? "N/A",
        "Group": e.group,
        "Company": e.companyName,
        "Location": e.workLocation || "",
        "Remark": e.remark || "",
      }))
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
      body: filtered.map((e) => {
        const iDays = getDaysRemaining(e.iqamaExpiryDate);
        const dDays = getDaysRemaining(e.dacoExpiryDate);
        return [
          e.employeeId,
          e.name,
          e.idNumber,
          e.iqamaExpiryDate,
          iDays !== null ? (iDays < 0 ? "EXPIRED" : `${iDays} days`) : "—",
          e.dacoId || "—",
          e.dacoExpiryDate || "—",
          dDays !== null ? (dDays < 0 ? "EXPIRED" : `${dDays} days`) : "—",
          e.group,
        ];
      }),
      styles: { fontSize: 8 },
    });
    doc.save("iqama_daco_expiry_report.pdf");
    toast.success("PDF report downloaded");
  };

  const columns: Column<MockDocumentExpiry>[] = [
    {
      key: "sr",
      label: "#",
      render: (_r, i) => (
        <span className="text-xs text-muted-foreground font-mono">
          {pageSize === 0 ? i + 1 : (page - 1) * pageSize + i + 1}
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
              {emp.email}
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
      key: "remark",
      label: "Status / Remark",
      render: (emp) => (
        <span className="text-xs text-muted-foreground italic truncate max-w-[150px] block">
          {emp.remark || "—"}
        </span>
      ),
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

      {/* Expiry Control Bar: Group & Expiry Status Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3 border rounded-xl shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          {/* Group Filter */}
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

        {/* Rows Per Page */}
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
        <div className="w-full overflow-x-auto overflow-y-auto max-h-[550px] scrollbar-thin scrollbar-thumb-muted-foreground/20">
          <DataTable<MockDocumentExpiry>
            data={paginated}
            columns={columns}
            rowKey={(e) => e._id}
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
              {editingRecord
                ? "Update Expiry Dates"
                : "Add Expiry Track Record"}
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
                  onChange={(e) =>
                    setForm({ ...form, employeeId: e.target.value })
                  }
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
                  onChange={(e) =>
                    setForm({ ...form, idNumber: e.target.value })
                  }
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
                  onChange={(e) =>
                    setForm({ ...form, companyName: e.target.value })
                  }
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
