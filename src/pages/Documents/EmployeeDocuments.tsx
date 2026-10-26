import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
import initialDocuments from "../../data/Documents.json";

const USE_API = false;
const API_URL = "/api/employee-documents";

export type DocKey =
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
  employeeName?: string;
  designation?: string;
  employeeId?: string;
  photoUrl?: string;
  nationality?: string;
  iqamaNumber?: string;
  passportNumber?: string;
  refCode?: string;
  email?: string;
  mobile?: string;
  group?: string;
  docs?: Partial<Record<DocKey, RelatedDocument>>;
  // Legacy fields accepted by older JSON records
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
}

const DOC_BUTTONS: { key: DocKey; label: string; header: string }[] = [
  { key: "gacaCertificate", label: "GACA", header: "GACA Certificate" },
  { key: "joining", label: "JOINING", header: "Joining" },
  { key: "iqama", label: "IQAMA", header: "Iqama / ID" },
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

const isGoogleDriveUrl = (url: string) => url.includes("drive.google.com");

const getGoogleDriveEmbedUrl = (url: string) => {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match?.[1]
    ? `https://drive.google.com/file/d/${match[1]}/preview`
    : url;
};

const getGoogleDriveDownloadUrl = (url: string) => {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match?.[1]
    ? `https://drive.google.com/uc?export=download&id=${match[1]}`
    : url;
};

const isSaudi = (nationality?: string) => {
  const value = (nationality ?? "").trim().toLowerCase();
  return value.includes("saudi") || value === "ksa" || value.includes("سعود");
};

const idLabel = (nationality?: string) =>
  isSaudi(nationality) ? "National ID" : "Iqama";

const isValidUrl = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  return !["", "n/a", "na", "#", "-", "null", "undefined"].includes(
    value.trim().toLowerCase()
  );
};

const getInitials = (name?: string) =>
  (name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

const getMissingDocs = (doc: EmployeeDocument) =>
  DOC_BUTTONS.filter((item) => !doc.docs?.[item.key]);

const normalizeDoc = (record: any): EmployeeDocument => {
  const docs: Partial<Record<DocKey, RelatedDocument>> = {};

  Object.entries(record?.docs ?? {}).forEach(([key, value]) => {
    const entry = value as Partial<RelatedDocument> | undefined;
    if (!entry) return;

    const hasDownload = isValidUrl(entry.downloadUrl);
    const hasImage = isValidUrl(entry.imgUrl);
    if (!hasDownload && !hasImage) return;

    if (DOC_BUTTONS.some((item) => item.key === key) || key === "jobOffer") {
      const normalizedKey =
        key === "jobOffer" ? "gacaCertificate" : (key as DocKey);
      docs[normalizedKey] = {
        docName: isValidUrl(entry.docName) ? entry.docName : normalizedKey,
        downloadUrl: hasDownload ? entry.downloadUrl! : "",
        imgUrl: hasImage ? entry.imgUrl : undefined,
      };
    }
  });

  if (!record?.docs) {
    const main =
      isValidUrl(record?.downloadUrl)
        ? {
            docName: record.docName ?? record.docType ?? "Document",
            downloadUrl: record.downloadUrl,
            imgUrl: record.imgUrl,
          }
        : undefined;

    if (main) {
      if (record.docType === "Passport") docs.passport = main;
      else if (record.docType === "Iqama") docs.iqama = main;
      else if (
        record.docType === "Job Offer" ||
        record.docType === "GACA Certificate"
      ) {
        docs.gacaCertificate = main;
      } else docs.others = main;
    }

    if (record?.jobOfferDoc) docs.gacaCertificate = record.jobOfferDoc;
    if (record?.otherDoc) docs.others = record.otherDoc;
  }

  return {
    ...record,
    docId: String(
      record?.docId ?? `DOC-${Math.random().toString(36).slice(2, 9)}`
    ),
    employeeName: record?.employeeName ?? "",
    designation: record?.designation ?? "",
    employeeId: String(record?.employeeId ?? ""),
    photoUrl: record?.photoUrl ?? record?.photo ?? "",
    nationality: record?.nationality ?? "",
    iqamaNumber: String(record?.iqamaNumber ?? record?.nationalId ?? ""),
    refCode: record?.refCode != null ? String(record.refCode) : "0",
    email: record?.email ?? "",
    mobile: String(record?.mobile ?? ""),
    docs,
  };
};

export default function EmployeeDocuments() {
  const [documents, setDocuments] = useState<EmployeeDocument[]>(() =>
    (initialDocuments as unknown[]).map(normalizeDoc)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [missingFilter, setMissingFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState("10");
  const [selectedDoc, setSelectedDoc] = useState<EmployeeDocument | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<EmployeeDocument>>({});
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState<PreviewContent | null>(
    null
  );

  useEffect(() => {
    if (!USE_API) return;
    let cancelled = false;

    const loadDocuments = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const data = (await response.json()) as unknown[];
        if (!cancelled) setDocuments(data.map(normalizeDoc));
      } catch (error) {
        if (!cancelled) {
          setFetchError(
            error instanceof Error ? error.message : "Failed to load documents"
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadDocuments();
    return () => {
      cancelled = true;
    };
  }, []);

  const availableGroups = useMemo(
    () =>
      Array.from(
        new Set(documents.map((doc) => doc.group).filter(Boolean) as string[])
      ),
    [documents]
  );

  const passportCount = useMemo(
    () => documents.filter((doc) => doc.docs?.passport).length,
    [documents]
  );
  const iqamaCount = useMemo(
    () => documents.filter((doc) => doc.docs?.iqama).length,
    [documents]
  );

  const filteredDocs = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return documents.filter((doc) => {
      const matchesSearch = [
        doc.employeeName,
        doc.designation,
        doc.employeeId,
        doc.iqamaNumber,
        doc.nationality,
        doc.email,
        doc.mobile,
        doc.refCode,
        doc.group,
      ].some((value) => (value ?? "").toLowerCase().includes(term));

      const matchesGroup =
        groupFilter === "all" ||
        (doc.group ?? "").toLowerCase() === groupFilter;

      const matchesMissing =
        missingFilter === "all" ||
        !doc.docs?.[missingFilter as DocKey];

      return matchesSearch && matchesGroup && matchesMissing;
    });
  }, [documents, searchTerm, groupFilter, missingFilter]);

  const numericPageSize =
    pageSize === "all" ? Math.max(filteredDocs.length, 1) : Number(pageSize);
  const totalPages = Math.max(
    1,
    Math.ceil(filteredDocs.length / numericPageSize)
  );
  const paginatedDocs = useMemo(() => {
    if (pageSize === "all") return filteredDocs;
    const start = (currentPage - 1) * numericPageSize;
    return filteredDocs.slice(start, start + numericPageSize);
  }, [filteredDocs, currentPage, pageSize, numericPageSize]);

  const handleDownload = (url: string, filename: string) => {
    if (!isValidUrl(url)) return;
    const targetUrl = isGoogleDriveUrl(url)
      ? getGoogleDriveDownloadUrl(url)
      : url;
    const link = document.createElement("a");
    link.href = targetUrl;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openPreview = (url: string, title: string) => {
    if (!isValidUrl(url)) return;
    if (isGoogleDriveUrl(url)) {
      setPreviewContent({
        url: getGoogleDriveEmbedUrl(url),
        title,
        type: "drive",
      });
    } else {
      const isImage =
        /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(url) ||
        url.includes("images.unsplash.com");
      setPreviewContent({
        url,
        title,
        type: isImage ? "image" : "pdf",
      });
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
    setDocuments((previous) =>
      previous.filter((doc) => doc.docId !== selectedDoc.docId)
    );
    setIsDeleteOpen(false);
    setSelectedDoc(null);
  };

  const cleanDocs = (
    docs: Partial<Record<DocKey, RelatedDocument>> | undefined
  ) => {
    const result: Partial<Record<DocKey, RelatedDocument>> = {};
    DOC_BUTTONS.forEach(({ key }) => {
      const entry = docs?.[key];
      if (
        entry &&
        (isValidUrl(entry.downloadUrl) || isValidUrl(entry.imgUrl))
      ) {
        result[key] = entry;
      }
    });
    return result;
  };

  const handleSaveEdit = () => {
    if (!selectedDoc) return;
    setDocuments((previous) =>
      previous.map((doc) =>
        doc.docId === selectedDoc.docId
          ? ({
              ...doc,
              ...formData,
              docs: cleanDocs(formData.docs),
            } as EmployeeDocument)
          : doc
      )
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
      photoUrl: formData.photoUrl || "",
      nationality: formData.nationality || "",
      iqamaNumber: formData.iqamaNumber || "",
      refCode: formData.refCode || "0",
      email: formData.email || "",
      mobile: formData.mobile || "",
      group: formData.group || "",
      docs: cleanDocs(formData.docs),
    };
    setDocuments((previous) => [newDoc, ...previous]);
    setCurrentPage(1);
    setIsAddOpen(false);
  };

  const setField = (key: keyof EmployeeDocument, value: string) =>
    setFormData((previous) => ({ ...previous, [key]: value }));

  const setDocUrl = (key: DocKey, label: string, url: string) =>
    setFormData((previous) => ({
      ...previous,
      docs: {
        ...previous.docs,
        [key]: {
          ...(previous.docs?.[key] ?? { docName: label, downloadUrl: "" }),
          docName: label,
          downloadUrl: url,
        },
      },
    }));

  const exportToExcel = () => {
    const exportData = filteredDocs.map((doc, index) => ({
      "Sr. No": index + 1,
      "Employee Name": doc.employeeName,
      Designation: doc.designation,
      "Employee ID": doc.employeeId,
      Nationality: doc.nationality || "N/A",
      "Iqama / National ID Number": doc.iqamaNumber,
      "Ref Code": doc.refCode ?? "0",
      Email: doc.email,
      Mobile: doc.mobile,
      Group: doc.group || "N/A",
      "GACA Certificate": doc.docs?.gacaCertificate ? "Yes" : "No",
      Joining: doc.docs?.joining ? "Yes" : "No",
      "Iqama / National ID": doc.docs?.iqama ? "Yes" : "No",
      Passport: doc.docs?.passport ? "Yes" : "No",
      Others: doc.docs?.others ? "Yes" : "No",
      "A/ID": doc.docs?.aid ? "Yes" : "No",
      "Daco ID": doc.docs?.dacoId ? "Yes" : "No",
      Status: getMissingDocs(doc).length === 0 ? "Complete" : "Incomplete",
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Documents List");
    XLSX.writeFile(
      workbook,
      `Employee_Documents_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const renderForm = (onSave: () => void, saveLabel: string) => (
    <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
      <Input
        placeholder="Employee Name"
        value={formData.employeeName || ""}
        onChange={(event) => setField("employeeName", event.target.value)}
      />
      <Input
        placeholder="Designation"
        value={formData.designation || ""}
        onChange={(event) => setField("designation", event.target.value)}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          placeholder="Employee ID"
          value={formData.employeeId || ""}
          onChange={(event) => setField("employeeId", event.target.value)}
        />
        <Input
          placeholder="Nationality (e.g. Saudi, Indian)"
          value={formData.nationality || ""}
          onChange={(event) => setField("nationality", event.target.value)}
        />
        <Input
          placeholder={isSaudi(formData.nationality) ? "National ID Number" : "Iqama Number"}
          value={formData.iqamaNumber || ""}
          onChange={(event) => setField("iqamaNumber", event.target.value)}
        />
        <Input
          placeholder="Ref Code"
          value={formData.refCode || ""}
          onChange={(event) => setField("refCode", event.target.value)}
        />
        <Input
          placeholder="Mobile"
          value={formData.mobile || ""}
          onChange={(event) => setField("mobile", event.target.value)}
        />
        <Input
          placeholder="Group"
          value={formData.group || ""}
          onChange={(event) => setField("group", event.target.value)}
        />
      </div>
      <Input
        placeholder="Photo URL (https://...)"
        value={formData.photoUrl || ""}
        onChange={(event) => setField("photoUrl", event.target.value)}
      />
      <Input
        placeholder="Email"
        value={formData.email || ""}
        onChange={(event) => setField("email", event.target.value)}
      />

      <div className="border-t pt-3">
        <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
          Document links (leave empty if unavailable)
        </p>
        <div className="space-y-2">
          {DOC_BUTTONS.map((item) => (
            <div key={item.key} className="flex items-center gap-2">
              <span className="w-28 shrink-0 text-xs font-medium">
                {item.key === "iqama"
                  ? idLabel(formData.nationality)
                  : item.header}
              </span>
              <Input
                placeholder="https://drive.google.com/file/d/..."
                value={formData.docs?.[item.key]?.downloadUrl || ""}
                onChange={(event) =>
                  setDocUrl(
                    item.key,
                    item.key === "iqama"
                      ? idLabel(formData.nationality)
                      : item.header,
                    event.target.value
                  )
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

  return (
    <div className="mx-auto min-h-screen w-full space-y-7 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:22px_22px] p-4 md:p-8">
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Employee Documents
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage employee IDs, GACA certificates, joining documents, passports,
            and additional files.
          </p>
          {isLoading && (
            <p className="mt-1 text-xs text-muted-foreground">Loading...</p>
          )}
          {fetchError && (
            <p className="mt-1 text-xs text-rose-600">
              Could not load server documents ({fetchError}); showing local data.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleOpenAdd}
            className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" /> Add Employee
          </Button>
          <Button variant="outline" onClick={exportToExcel} className="gap-2">
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          {
            title: "Passport Documents",
            count: passportCount,
            description: "Employees with a passport file",
            accent: "border-l-blue-500",
            number: "text-blue-600",
          },
          {
            title: "Iqama / National ID",
            count: iqamaCount,
            description: "Employees with an ID file",
            accent: "border-l-emerald-500",
            number: "text-emerald-600",
          },
          {
            title: "Total Employees",
            count: documents.length,
            description: "All employee records",
            accent: "border-l-violet-500",
            number: "text-violet-600",
          },
        ].map((item) => (
          <Card
            key={item.title}
            className={`border-l-4 ${item.accent} shadow-sm transition-shadow hover:shadow-md`}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${item.number}`}>{item.count}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {item.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and filters */}
      <Card className="rounded-2xl border-slate-200 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search name, iqama, ID, email, mobile..."
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Select
                  value={groupFilter}
                  onValueChange={(value) => {
                    setGroupFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="All Groups" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    {availableGroups.map((group) => (
                      <SelectItem key={group} value={group.toLowerCase()}>
                        {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Select
                  value={missingFilter}
                  onValueChange={(value) => {
                    setMissingFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[210px]">
                    <SelectValue placeholder="All Employees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employees</SelectItem>
                    {DOC_BUTTONS.map((item) => (
                      <SelectItem key={item.key} value={item.key}>
                        Missing {item.header}
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
            <div className="py-12 text-center text-muted-foreground">
              <FileText className="mx-auto mb-3 h-12 w-12 opacity-40" />
              <p>No employees found matching your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {paginatedDocs.map((doc, index) => {
                const missing = getMissingDocs(doc);
                const completed = DOC_BUTTONS.length - missing.length;
                const completion = Math.round(
                  (completed / DOC_BUTTONS.length) * 100
                );
                const globalIndex =
                  pageSize === "all"
                    ? index + 1
                    : (currentPage - 1) * Number(pageSize) + index + 1;

                return (
                  <Card
                    key={doc.docId}
                    className="group relative flex h-full flex-col overflow-hidden rounded-[28px] border border-white bg-white/95 pt-3 shadow-[0_8px_28px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(15,23,42,0.14)]"
                  >
                    <div className="absolute left-5 top-0 z-10 max-w-[70%] truncate rounded-b-2xl bg-white px-4 pb-2 pt-2 text-xs font-semibold tracking-wide text-slate-600 shadow-[0_4px_10px_rgba(15,23,42,0.12)]" title={doc.group || "Unassigned Group"}>
                      {doc.group || "Unassigned Group"}
                    </div>
                    <CardHeader className="space-y-4 pb-4 pt-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          {doc.photoUrl ? (
                            <button
                              type="button"
                              onClick={() =>
                                openPreview(
                                  doc.photoUrl!,
                                  `${doc.employeeName} — Photo`
                                )
                              }
                              title="View employee photo"
                              className="shrink-0"
                            >
                              <img
                                src={doc.photoUrl}
                                alt={doc.employeeName || "Employee"}
                                className="h-16 w-16 rounded-2xl border border-slate-200 object-cover transition group-hover:scale-105"
                              />
                            </button>
                          ) : (
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-100 text-lg font-bold text-emerald-700 ring-1 ring-emerald-100">
                              {getInitials(doc.employeeName)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-slate-500">
                              Employee #{globalIndex}
                            </p>
                            <CardTitle
                              className="mt-1 line-clamp-2 text-base font-bold leading-5 text-slate-900"
                              title={doc.employeeName}
                            >
                              {doc.employeeName || "Unnamed Employee"}
                            </CardTitle>
                            <p
                              className="mt-1 truncate text-xs text-slate-500"
                              title={doc.designation}
                            >
                              {doc.designation || "No designation"}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            missing.length === 0
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {missing.length === 0 ? "Complete" : "Incomplete"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3">
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Employee ID
                          </p>
                          <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                            {doc.employeeId || "N/A"}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            {idLabel(doc.nationality)}
                          </p>
                          <p
                            className="mt-1 truncate text-sm font-semibold text-slate-800"
                            title={doc.iqamaNumber}
                          >
                            {doc.iqamaNumber || "N/A"}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Nationality
                          </p>
                          <p className="mt-1 truncate text-sm text-slate-700">
                            {doc.nationality || "N/A"}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Group
                          </p>
                          <p className="mt-1 truncate text-sm text-slate-700">
                            {doc.group || "N/A"}
                          </p>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="flex flex-1 flex-col gap-4 pt-0">
                      <div>
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <h3 className="text-sm font-bold text-slate-800">
                            Employee Documents
                          </h3>
                          <span className="text-xs text-slate-500">
                            {["iqama", "passport", "dacoId", "gacaCertificate"].filter((key) => doc.docs?.[key as DocKey]).length}/4 key documents available
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {([
                            { key: "iqama", title: isSaudi(doc.nationality) ? "National ID" : "Iqama", hint: "Identity document", accent: "border-emerald-200 bg-emerald-50/60 text-emerald-800" },
                            { key: "passport", title: "Passport", hint: "Passport document", accent: "border-blue-200 bg-blue-50/60 text-blue-800" },
                            { key: "dacoId", title: "DACO ID", hint: "Airport access ID", accent: "border-violet-200 bg-violet-50/60 text-violet-800" },
                            { key: "gacaCertificate", title: "GACA", hint: "GACA certificate", accent: "border-amber-200 bg-amber-50/60 text-amber-800" },
                          ] as const).map((item) => {
                            const file = doc.docs?.[item.key];
                            return (
                              <div key={item.key} className={`min-h-[142px] rounded-2xl border p-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${file ? item.accent : "border-slate-200 bg-slate-50 text-slate-700"}`}>
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold">{item.title}</p>
                                    <p className="mt-1 text-[11px] opacity-75">{item.hint}</p>
                                  </div>
                                  <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${file ? "bg-white/80" : "bg-white text-slate-500"}`}>
                                    {file ? "Added" : "Not added"}
                                  </span>
                                </div>
                                {file ? (
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    <Button type="button" size="sm" variant="outline" className="h-8 gap-1 bg-white text-xs" onClick={() => openPreview(isValidUrl(file.downloadUrl) ? file.downloadUrl : file.imgUrl || "", `${doc.employeeName} — ${file.docName}`)}>
                                      <FileText className="h-3.5 w-3.5" /> View {item.title}
                                    </Button>
                                    <Button type="button" size="sm" variant="outline" className="h-8 gap-1 bg-white text-xs" onClick={() => handleDownload(isValidUrl(file.downloadUrl) ? file.downloadUrl : file.imgUrl || "", file.docName || item.title)}>
                                      <Download className="h-3.5 w-3.5" /> Download
                                    </Button>
                                  </div>
                                ) : (
                                  <p className="mt-3 text-xs text-slate-500">Use Edit to add this document.</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {DOC_BUTTONS.some((item) => !["iqama", "passport", "dacoId", "gacaCertificate"].includes(item.key as string) && doc.docs?.[item.key]) && (
                          <div className="mt-3 rounded-xl border border-slate-200 p-3">
                            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Other documents</p>
                            <div className="flex flex-wrap gap-2">
                              {DOC_BUTTONS.filter((item) => !["iqama", "passport", "dacoId", "gacaCertificate"].includes(item.key as string) && doc.docs?.[item.key]).map((item) => {
                                const file = doc.docs?.[item.key];
                                if (!file) return null;
                                return <Button key={item.key} type="button" size="sm" variant="outline" className="gap-1 text-xs" onClick={() => openPreview(isValidUrl(file.downloadUrl) ? file.downloadUrl : file.imgUrl || "", `${doc.employeeName} — ${file.docName}`)}><FileText className="h-3.5 w-3.5" />{item.header}</Button>;
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-auto border-t border-slate-100 px-1 pt-4">
                        <div className="mb-2 flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-500">
                            Document completion
                          </span>
                          <span className="font-bold text-slate-700">
                            {completion}%
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full transition-all ${
                              missing.length === 0
                                ? "bg-emerald-500"
                                : "bg-amber-400"
                            }`}
                            style={{ width: `${completion}%` }}
                          />
                        </div>
                        {missing.length > 0 && (
                          <p className="mt-2 text-xs text-amber-700">
                            Missing: {missing.map((item) => item.header).join(", ")}
                          </p>
                        )}
                        <div className="mt-4 flex items-center justify-between gap-2">
                          <span className="min-w-0 truncate text-xs text-slate-400">
                            Ref: {doc.refCode || "0"}
                          </span>
                          <div className="flex shrink-0 items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenEdit(doc)}
                              className="h-8 gap-1.5 rounded-lg px-3 text-xs hover:bg-blue-50 hover:text-blue-700"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenDelete(doc)}
                              className="h-8 gap-1.5 rounded-lg border-rose-100 px-3 text-xs text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          <div className="flex flex-col items-center justify-between gap-4 border-t pt-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rows per page</span>
              <Select
                value={pageSize}
                onValueChange={(value) => {
                  setPageSize(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
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
                Page <strong className="text-foreground">{currentPage}</strong>{" "}
                of <strong className="text-foreground">{totalPages}</strong>
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  title="First page"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  title="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                  disabled={currentPage === totalPages}
                  title="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  title="Last page"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document preview modal */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="flex h-[80vh] max-w-4xl flex-col p-4">
          <DialogHeader className="flex flex-row items-center justify-between border-b pb-2 pr-8">
            <DialogTitle className="truncate text-lg font-bold">
              {previewContent?.title}
            </DialogTitle>
            {previewContent && (
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 gap-1"
                onClick={() =>
                  handleDownload(previewContent.url, previewContent.title)
                }
              >
                <Download className="h-4 w-4" /> Download
              </Button>
            )}
          </DialogHeader>
          <div className="mt-2 flex h-full w-full flex-1 items-center justify-center overflow-hidden rounded-md bg-slate-950">
            {previewContent?.type === "drive" ||
            previewContent?.type === "pdf" ? (
              <iframe
                src={previewContent.url}
                className="h-full w-full border-0"
                title={previewContent.title}
                allow="autoplay"
              />
            ) : previewContent?.type === "image" ? (
              <img
                src={previewContent.url}
                alt={previewContent.title}
                className="max-h-full max-w-full object-contain"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit employee modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          {renderForm(handleSaveEdit, "Save Changes")}
        </DialogContent>
      </Dialog>

      {/* Add employee modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Employee</DialogTitle>
          </DialogHeader>
          {renderForm(handleSaveAdd, "Save Employee")}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Employee?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently remove "{selectedDoc?.employeeName}" and all
            their document links from the current list.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-rose-600 text-white hover:bg-rose-700"
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
