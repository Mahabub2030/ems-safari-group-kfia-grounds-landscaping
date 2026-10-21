import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CreditCard,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Globe,
  Layers,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { type SetStateAction, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";

import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
// Renamed on import so it doesn't collide with the `documents` state below.
import { documents as initialDocuments } from "../../data/Documentsdata";

// ----------------------------------------------------------------------
// Helper Utilities for Google Drive & File Handling
// ----------------------------------------------------------------------

const isGoogleDriveUrl = (url: string): boolean =>
  url.includes("drive.google.com");

const getGoogleDriveEmbedUrl = (url: string): string => {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/file/d/${match[1]}/preview`;
  }
  return url;
};

const getGoogleDriveDownloadUrl = (url: string): string => {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/uc?export=download&id=${match[1]}`;
  }
  return url;
};

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------
// Define these ONCE (ideally in a shared types file) and import them in
// Documentsdata too, so the data file matches this shape.

export type DocKey =
  | "jobOffer"
  | "gacaCertificate"
  | "joining"
  | "iqama"
  | "passport"
  | "others"
  | "aid"
  | "dacoId";

export interface RelatedDocument {
  docName: string;
  downloadUrl: string;
  imgUrl?: string;
}

export interface EmployeeDocument {
  docId: string;
  // Legacy fields still used by the seeded JSON data in Documentsdata.ts.
  docName?: string;
  docType?: string;
  issueDate?: string;
  expiryDate?: string;
  fileSize?: string;
  fileFormat?: string;
  downloadUrl?: string;
  imgUrl?: string;
  cvDoc?: RelatedDocument;
  jobOfferDoc?: RelatedDocument;
  otherDoc?: RelatedDocument;

  employeeName?: string;
  designation?: string;
  employeeId?: string; // e.g. 408389
  iqamaNumber?: string; // e.g. 2532067424
  passportNumber?: string;
  refCode?: string; // "0" or "DMM-03-5859"
  email?: string;
  mobile?: string;
  group?: string;
  docs?: Partial<Record<DocKey, RelatedDocument>>;
}

// Order here = column order in the table
const DOC_BUTTONS: { key: DocKey; label: string; header: string }[] = [
  { key: "jobOffer", label: "GACA", header: "GACA Certificate" },
  { key: "gacaCertificate", label: "GACA", header: "GACA Certificate" },
  { key: "joining", label: "JOINING", header: "Joining" },
  { key: "iqama", label: "IQAMA", header: "Iqama" },
  { key: "passport", label: "PASSPORT", header: "Passport" },
  { key: "others", label: "OTHERS", header: "Others" },
  { key: "aid", label: "A/ID", header: "A/ID" },
  { key: "dacoId", label: "DACO", header: "Daco ID" },
];

type PreviewContent = {
  url: string;
  title: string;
  type: "drive" | "pdf" | "image";
};

// Makes any record safe to render. Missing fields get defaults, and records
// still in the OLD shape (docType / downloadUrl / cvDoc ...) are mapped
// into the new `docs` object so nothing crashes.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalizeDoc = (d: any): EmployeeDocument => {
  const docs: Partial<Record<DocKey, RelatedDocument>> = { ...(d?.docs ?? {}) };

  // Legacy mapping from the old shape
  if (!d?.docs) {
    const main: RelatedDocument | undefined =
      d?.downloadUrl && d.downloadUrl !== "#"
        ? { docName: d.docName ?? d.docType ?? "Document", downloadUrl: d.downloadUrl, imgUrl: d.imgUrl }
        : undefined;
    if (main) {
      if (d.docType === "Passport") docs.passport = main;
      else if (d.docType === "Iqama") docs.iqama = main;
      else if (d.docType === "Job Offer") docs.gacaCertificate = main;
      else if (d.docType === "GACA Certificate") docs.gacaCertificate = main;
      else docs.others = main;
    }
    if (d?.jobOfferDoc) docs.gacaCertificate = d.jobOfferDoc;
    if (d?.otherDoc) docs.others = d.otherDoc;
  }

  return {
    ...d,
    docId: String(d?.docId ?? `DOC-${Math.random().toString(36).slice(2, 9)}`),
    employeeName: d?.employeeName ?? "",
    designation: d?.designation ?? "",
    employeeId: String(d?.employeeId ?? ""),
    iqamaNumber: String(d?.iqamaNumber ?? ""),
    refCode: d?.refCode != null ? String(d.refCode) : "0",
    email: d?.email ?? "",
    mobile: String(d?.mobile ?? ""),
    docs,
  };
};

export default function EmployeeDocuments() {
  const [documents, setDocuments] = useState<EmployeeDocument[]>(() =>
    (initialDocuments as unknown[]).map(normalizeDoc),
  );

  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  // "all" or a DocKey -> show only employees MISSING that document
  const [missingFilter, setMissingFilter] = useState("all");

  // Pagination: 10, 50, 100, all
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState("10");

  const [selectedDoc, setSelectedDoc] = useState<EmployeeDocument | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form state shared by the Add / Edit dialogs
  const [formData, setFormData] = useState<Partial<EmployeeDocument>>({});

  // Preview state for Drive, PDFs, and images
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState<PreviewContent | null>(
    null,
  );

  // ---------------------------------------------------------------
  // Fetch from API (falls back to local data on error)
  // ---------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function loadDocuments() {
      setIsLoading(true);
      setFetchError(null);
      try {
        // 👉 Replace this URL with your real endpoint.
        const res = await fetch("/api/employee-documents");
        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`);
        }
        const data: unknown[] = await res.json();
        if (!cancelled) setDocuments(data.map(normalizeDoc));
      } catch (err) {
        if (!cancelled) {
          setFetchError(
            err instanceof Error ? err.message : "Failed to load documents",
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadDocuments();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------
  const availableGroups = useMemo(() => {
    const set = new Set<string>();
    documents.forEach((d) => {
      if (d.group) set.add(d.group);
    });
    return Array.from(set);
  }, [documents]);

  const passportCount = useMemo(
    () => documents.filter((d) => d.docs?.passport).length,
    [documents],
  );
  const iqamaCount = useMemo(
    () => documents.filter((d) => d.docs?.iqama).length,
    [documents],
  );

  const filteredDocs = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return documents.filter((d) => {
      const employeeName = d.employeeName ?? "";
      const designation = d.designation ?? "";
      const employeeId = d.employeeId ?? "";
      const iqamaNumber = d.iqamaNumber ?? "";
      const email = d.email ?? "";
      const mobile = d.mobile ?? "";

      const matchesSearch =
        employeeName.toLowerCase().includes(term) ||
        designation.toLowerCase().includes(term) ||
        employeeId.toLowerCase().includes(term) ||
        iqamaNumber.toLowerCase().includes(term) ||
        email.toLowerCase().includes(term) ||
        mobile.toLowerCase().includes(term) ||
        (d.refCode ?? "").toLowerCase().includes(term) ||
        (d.group ?? "").toLowerCase().includes(term);

      const matchesGroup =
        groupFilter === "all" || d.group?.toLowerCase() === groupFilter;

      const matchesMissing =
        missingFilter === "all" || !d.docs?.[missingFilter as DocKey];

      return matchesSearch && matchesGroup && matchesMissing;
    });
  }, [documents, searchTerm, groupFilter, missingFilter]);

  // Pagination
  const numericPageSize =
    pageSize === "all" ? filteredDocs.length || 1 : Number(pageSize);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredDocs.length / numericPageSize),
  );

  const paginatedDocs = useMemo(() => {
    if (pageSize === "all") return filteredDocs;
    const start = (currentPage - 1) * numericPageSize;
    return filteredDocs.slice(start, start + numericPageSize);
  }, [filteredDocs, currentPage, pageSize, numericPageSize]);

  // ---------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------
  const tableMinWidth = Math.max(1200, (DOC_BUTTONS.length + 9) * 120);

  const handleDownload = (url: string, filename: string) => {
    if (!url || url === "#") return;
    const targetUrl = isGoogleDriveUrl(url)
      ? getGoogleDriveDownloadUrl(url)
      : url;

    const link = document.createElement("a");
    link.href = targetUrl;
    link.target = "_blank";
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openPreview = (url: string, title: string) => {
    if (!url || url === "#") return;
    if (isGoogleDriveUrl(url)) {
      setPreviewContent({
        url: getGoogleDriveEmbedUrl(url),
        title,
        type: "drive",
      });
    } else {
      const isImage =
        /\.(jpg|jpeg|png|webp|gif|svg)($|\?)/i.test(url) ||
        url.includes("images.unsplash.com");
      setPreviewContent({ url, title, type: isImage ? "image" : "pdf" });
    }
    setPreviewModalOpen(true);
  };

  const handleOpenEdit = (doc: EmployeeDocument) => {
    setSelectedDoc(doc);
    setFormData({ ...doc, docs: { ...doc.docs } });
    setIsEditOpen(true);
  };

  const handleOpenDelete = (doc: EmployeeDocument) => {
    setSelectedDoc(doc);
    setIsDeleteOpen(true);
  };

  const handleOpenAdd = () => {
    setSelectedDoc(null);
    setFormData({ refCode: "0", docs: {} });
    setIsAddOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!selectedDoc) return;
    setDocuments((prev) => prev.filter((d) => d.docId !== selectedDoc.docId));
    setIsDeleteOpen(false);
    setSelectedDoc(null);
  };

  // Remove doc entries that have an empty URL
  const cleanDocs = (
    docs: Partial<Record<DocKey, RelatedDocument>> | undefined,
  ) => {
    const out: Partial<Record<DocKey, RelatedDocument>> = {};
    (Object.keys(docs ?? {}) as DocKey[]).forEach((k) => {
      const entry = docs?.[k];
      if (entry && entry.downloadUrl.trim()) out[k] = entry;
    });
    return out;
  };

  const handleSaveEdit = () => {
    if (!selectedDoc) return;
    setDocuments((prev) =>
      prev.map((d) =>
        d.docId === selectedDoc.docId
          ? ({
            ...d,
            ...formData,
            docs: cleanDocs(formData.docs),
          } as EmployeeDocument)
          : d,
      ),
    );
    setIsEditOpen(false);
    setSelectedDoc(null);
  };

  const handleSaveAdd = () => {
    const newDoc: EmployeeDocument = {
      docId: `DOC-${Date.now()}`,
      employeeName: formData.employeeName || "Unnamed Employee",
      designation: formData.designation || "",
      employeeId: formData.employeeId || "",
      iqamaNumber: formData.iqamaNumber || "",
      refCode: formData.refCode || "0",
      email: formData.email || "",
      mobile: formData.mobile || "",
      group: formData.group,
      docs: cleanDocs(formData.docs),
    };
    setDocuments((prev) => [newDoc, ...prev]);
    setIsAddOpen(false);
  };

  const setField = (key: keyof EmployeeDocument, value: string) =>
    setFormData((f) => ({ ...f, [key]: value }));

  const setDocUrl = (key: DocKey, label: string, url: string) =>
    setFormData((f) => ({
      ...f,
      docs: {
        ...f.docs,
        [key]: { ...(f.docs?.[key] ?? { docName: label }), downloadUrl: url },
      },
    }));

  const exportToExcel = () => {
    const exportData = filteredDocs.map((d, index) => ({
      "Sr. No": index + 1,
      "Employee Name": d.employeeName,
      Designation: d.designation,
      "Employee ID": d.employeeId,
      "Iqama Number": d.iqamaNumber,
      "Ref Code": d.refCode ?? "0",
      Email: d.email,
      Mobile: d.mobile,
      Group: d.group || "N/A",
      "GACA Certificate": d.docs?.jobOffer || d.docs?.gacaCertificate ? "Yes" : "No",
      Joining: d.docs?.joining ? "Yes" : "No",
      Iqama: d.docs?.iqama ? "Yes" : "No",
      Passport: d.docs?.passport ? "Yes" : "No",
      Others: d.docs?.others ? "Yes" : "No",
      "A/ID": d.docs?.aid ? "Yes" : "No",
      "Daco ID": d.docs?.dacoId ? "Yes" : "No",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Documents List");
    XLSX.writeFile(
      workbook,
      `Employee_Documents_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

  // ---------------------------------------------------------------
  // Shared form body for Add / Edit dialogs
  // ---------------------------------------------------------------
  const renderForm = (onSave: () => void, saveLabel: string) => (
    <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
      <Input
        placeholder="Employee Name"
        value={formData.employeeName || ""}
        onChange={(e: { target: { value: string } }) =>
          setField("employeeName", e.target.value)
        }
      />
      <Input
        placeholder="Designation"
        value={formData.designation || ""}
        onChange={(e: { target: { value: string } }) =>
          setField("designation", e.target.value)
        }
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          placeholder="Employee ID"
          value={formData.employeeId || ""}
          onChange={(e: { target: { value: string } }) =>
            setField("employeeId", e.target.value)
          }
        />
        <Input
          placeholder="Iqama Number"
          value={formData.iqamaNumber || ""}
          onChange={(e: { target: { value: string } }) =>
            setField("iqamaNumber", e.target.value)
          }
        />
        <Input
          placeholder="Ref Code (e.g. DMM-03-5859)"
          value={formData.refCode || ""}
          onChange={(e: { target: { value: string } }) =>
            setField("refCode", e.target.value)
          }
        />
        <Input
          placeholder="Mobile"
          value={formData.mobile || ""}
          onChange={(e: { target: { value: string } }) =>
            setField("mobile", e.target.value)
          }
        />
      </div>
      <Input
        placeholder="Email"
        value={formData.email || ""}
        onChange={(e: { target: { value: string } }) =>
          setField("email", e.target.value)
        }
      />
      <Input
        placeholder="Group"
        value={formData.group || ""}
        onChange={(e: { target: { value: string } }) =>
          setField("group", e.target.value)
        }
      />

      <div className="pt-2 border-t">
        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase">
          Document links (leave empty if not available)
        </p>
        <div className="space-y-2">
          {DOC_BUTTONS.map((b) => (
            <div key={b.key} className="flex items-center gap-2">
              <span className="w-20 shrink-0 text-xs font-medium">
                {b.header}
              </span>
              <Input
                placeholder="https://drive.google.com/file/d/..."
                value={formData.docs?.[b.key]?.downloadUrl || ""}
                onChange={(e: { target: { value: string } }) =>
                  setDocUrl(b.key, b.header, e.target.value)
                }
              />
            </div>
          ))}
        </div>
      </div>

      <Button onClick={onSave} className="w-full">
        {saveLabel}
      </Button>
    </div>
  );

  // ---------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------
  return (
    <div className=" mx-auto p-4 md:p-8 w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Employee Documents
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage job offers, joining, iqamas, passports, and additional
            files.
          </p>
          {isLoading && (
            <p className="text-xs text-muted-foreground mt-1">Loading…</p>
          )}
          {fetchError && (
            <p className="text-xs text-rose-600 mt-1">
              Couldn't load documents from the server ({fetchError}) — showing
              local data.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleOpenAdd}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="w-4 h-4" /> Add Employee
          </Button>

          <Button
            onClick={exportToExcel}
            variant="outline"
            className="gap-2 border-emerald-600/30 text-emerald-700 hover:bg-emerald-500/10"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export
            Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Passport Documents
            </CardTitle>
            <Globe className="w-5 h-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {passportCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Employees with a passport file
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Iqama Cards
            </CardTitle>
            <CreditCard className="w-5 h-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {iqamaCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Employees with an iqama file
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Employees
            </CardTitle>
            <Layers className="w-5 h-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {documents.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All employee records
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table container */}
      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name, iqama, ID, email, mobile..."
                value={searchTerm}
                onChange={(e: {
                  target: { value: SetStateAction<string> };
                }) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                <Select
                  value={groupFilter}
                  onValueChange={(val: SetStateAction<string>) => {
                    setGroupFilter(val);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[170px]">
                    <SelectValue placeholder="All Groups" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    {availableGroups.map((grp) => (
                      <SelectItem key={grp} value={grp.toLowerCase()}>
                        {grp}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
                <Select
                  value={missingFilter}
                  onValueChange={(val: SetStateAction<string>) => {
                    setMissingFilter(val);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[190px]">
                    <SelectValue placeholder="All Employees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employees</SelectItem>
                    {DOC_BUTTONS.map((b) => (
                      <SelectItem key={b.key} value={b.key}>
                        Missing {b.header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {paginatedDocs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>No employees found matching your filter criteria.</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto border rounded-xl bg-white shadow-sm">
              <table
                className="w-full border-collapse text-[12px] md:text-[13px] font-medium"
                style={{ minWidth: `${tableMinWidth}px` }}
              >
                <thead className="bg-slate-100 text-slate-700 uppercase tracking-[0.06em] text-[10px] md:text-[11px]">
                  <tr>
                    <th className="px-3 py-3 text-center border-b border-slate-200">Sr. No</th>
                    <th className="px-3 py-3 text-left border-b border-slate-200">Employee Name</th>
                    <th className="px-3 py-3 bg-slate-50 border-b border-slate-200">Designation</th>
                    <th className="px-3 py-3 border-b border-slate-200">Emp ID</th>
                    <th className="px-3 py-3 bg-slate-50 border-b border-slate-200">Iqama No.</th>
                    <th className="px-3 py-3 border-b border-slate-200">Ref Code</th>
                    <th className="px-3 py-3 bg-slate-50 border-b border-slate-200">Email</th>
                    <th className="px-3 py-3 border-b border-slate-200">Mobile</th>
                    {DOC_BUTTONS.map((b, i) => (
                      <th
                        key={b.key}
                        className={`px-3 py-3 border-b border-slate-200 ${i % 2 === 1 ? "bg-slate-50" : ""
                          }`}
                      >
                        {b.header}
                      </th>
                    ))}
                    <th className="px-3 py-3 text-center border-b border-slate-200">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedDocs.map((doc, idx) => {
                    const globalIndex =
                      pageSize === "all"
                        ? idx + 1
                        : (currentPage - 1) * Number(pageSize || 10) + idx + 1;

                    return (
                      <tr
                        key={doc.docId}
                        className="hover:bg-slate-50 transition-colors align-middle"
                      >
                        <td className="px-3 py-3 text-center font-semibold text-slate-500 border-b border-slate-100">
                          {globalIndex}
                        </td>
                        <td className="px-3 py-3 text-left font-semibold text-slate-800 border-b border-slate-100 max-w-[220px]">
                          <div className="truncate" title={doc.employeeName}>
                            {doc.employeeName}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center text-[11px] bg-slate-50 border-b border-slate-100 whitespace-nowrap text-slate-700">
                          {doc.designation}
                        </td>
                        <td className="px-3 py-3 text-center text-[11px] border-b border-slate-100 text-slate-700">
                          {doc.employeeId}
                        </td>
                        <td className="px-3 py-3 text-center text-[11px] bg-slate-50 border-b border-slate-100 text-slate-700">
                          {doc.iqamaNumber}
                        </td>
                        <td className="px-3 py-3 text-center text-[11px] border-b border-slate-100 text-slate-700">
                          {doc.refCode ?? "0"}
                        </td>
                        <td className="px-3 py-3 text-center text-[11px] bg-slate-50 border-b border-slate-100 whitespace-nowrap text-slate-700">
                          <span className="truncate inline-block max-w-[140px]" title={doc.email}>
                            {doc.email}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center text-[11px] border-b border-slate-100 text-slate-700">
                          {doc.mobile}
                        </td>

                        {DOC_BUTTONS.map((b, i) => {
                          const file = doc.docs?.[b.key];
                          return (
                            <td
                              key={b.key}
                              className={`px-2 py-3 text-center border-b border-slate-100 ${i % 2 === 1 ? "bg-slate-50" : ""
                                }`}
                            >
                              <button
                                type="button"
                                disabled={!file}
                                onClick={() =>
                                  file &&
                                  openPreview(
                                    file.downloadUrl || file.imgUrl || "#",
                                    `${doc.employeeName} — ${file.docName}`,
                                  )
                                }
                                title={file ? file.docName : "Not uploaded"}
                                className={`px-2.5 py-1.5 rounded-md border text-[10px] md:text-[11px] font-semibold whitespace-nowrap transition-all ${file
                                    ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 cursor-pointer shadow-sm"
                                    : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-60"
                                  }`}
                              >
                                {b.label}
                              </button>
                            </td>
                          );
                        })}

                        <td className="px-3 py-3 text-center border-b border-slate-100">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleOpenEdit(doc)}
                              className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title="Edit Record"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleOpenDelete(doc)}
                              className="h-7 w-7 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Rows per page
              </span>
              <Select
                value={pageSize}
                onValueChange={(val: SetStateAction<string>) => {
                  setPageSize(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>
                Page{" "}
                <strong className="text-foreground">{currentPage}</strong> of{" "}
                <strong className="text-foreground">{totalPages}</strong>
              </span>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  title="First Page"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  title="Previous Page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  title="Next Page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  title="Last Page"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Preview Modal (Drive / PDF / Image) */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-4">
          <DialogHeader className="flex flex-row items-center justify-between border-b pb-2 pr-8">
            <DialogTitle className="text-lg font-bold truncate">
              {previewContent?.title}
            </DialogTitle>
            {previewContent && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1 shrink-0"
                onClick={() =>
                  handleDownload(previewContent.url, previewContent.title)
                }
              >
                <Download className="w-4 h-4" /> Download
              </Button>
            )}
          </DialogHeader>

          <div className="flex-1 w-full h-full overflow-hidden flex items-center justify-center bg-slate-950 rounded-md mt-2">
            {previewContent?.type === "drive" ||
              previewContent?.type === "pdf" ? (
              <iframe
                src={previewContent.url}
                className="w-full h-full border-0"
                title={previewContent.title}
                allow="autoplay"
              />
            ) : previewContent?.type === "image" ? (
              <img
                src={previewContent.url}
                alt={previewContent.title}
                className="max-w-full max-h-full object-contain"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          {renderForm(handleSaveEdit, "Save Changes")}
        </DialogContent>
      </Dialog>

      {/* Add Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Employee</DialogTitle>
          </DialogHeader>
          {renderForm(handleSaveAdd, "Save Employee")}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Employee?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently remove "{selectedDoc?.employeeName}" and all
            their document links from the list.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-rose-600 hover:bg-rose-700 text-white"
              onClick={handleDeleteConfirm}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
