import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  LayoutGrid,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Table as TableIcon,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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

// Slides on every card move on their own every 2 seconds
const SLIDE_INTERVAL_MS = 2000;
// After a manual click or touch, auto-play waits this long
const SLIDE_RESUME_AFTER_MS = 6000;

export type DocKey =
  | "jobOffer"
  | "gacaCertificate"
  | "joining"
  | "iqama"
  | "passport"
  | "others"
  | "Cv"
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
  { key: "jobOffer", label: "JOB OFFER", header: "Job Offer" },
  { key: "gacaCertificate", label: "GACA", header: "GACA Certificate" },
  { key: "joining", label: "JOINING", header: "Joining" },
  { key: "iqama", label: "IQAMA", header: "Iqama / ID" },
  { key: "passport", label: "PASSPORT", header: "Passport" },
  { key: "Cv", label: "CV", header: "CV" },
  { key: "others", label: "OTHERS", header: "Others" },
  { key: "aid", label: "A/ID", header: "A/ID" },
  { key: "dacoId", label: "DACO", header: "DACO ID" },
];

// The three documents that get their own section on every card
const MAIN_DOC_KEYS: DocKey[] = ["iqama", "passport", "gacaCertificate"];
const OTHER_DOC_KEYS: DocKey[] = DOC_BUTTONS.map((item) => item.key).filter(
  (key) => !MAIN_DOC_KEYS.includes(key)
);

// Card colours (rotate per card, like the reference design)
const CARD_ACCENTS = [
  { main: "#c44a36", soft: "#ffcfc2", ink: "#7a2a1c" },
  { main: "#4d8296", soft: "#a3ecff", ink: "#235063" },
  { main: "#ff7f66", soft: "#ffd3c7", ink: "#8a3a2a" },
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

const getDriveId = (url: string) =>
  url.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1] ??
  url.match(/[?&]id=([a-zA-Z0-9_-]+)/)?.[1];

const isDropboxUrl = (url: string) => url.includes("dropbox.com");

// Dropbox share links: raw=1 opens the file inline, dl=1 forces a download
const toDropboxUrl = (url: string, mode: "raw" | "dl") => {
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete("dl");
    parsed.searchParams.delete("raw");
    parsed.searchParams.set(mode, "1");
    return parsed.toString();
  } catch {
    return url;
  }
};

const isImageUrl = (url: string) =>
  /^data:image\//i.test(url) ||
  /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(url) ||
  url.includes("images.unsplash.com");

// Picture shown on the slide: an image link, an uploaded image, or a Drive thumbnail
const getDocThumb = (file?: RelatedDocument) => {
  if (!file) return "";
  for (const candidate of [file.imgUrl, file.downloadUrl]) {
    if (!isValidUrl(candidate)) continue;
    if (isGoogleDriveUrl(candidate)) {
      const id = getDriveId(candidate);
      if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w800`;
      continue;
    }
    if (isImageUrl(candidate)) {
      return isDropboxUrl(candidate) ? toDropboxUrl(candidate, "raw") : candidate;
    }
  }
  return "";
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

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the file"));
    reader.readAsDataURL(file);
  });

const normalizeDoc = (record: any): EmployeeDocument => {
  const docs: Partial<Record<DocKey, RelatedDocument>> = {};

  Object.entries(record?.docs ?? {}).forEach(([key, value]) => {
    const entry = value as Partial<RelatedDocument> | undefined;
    if (!entry) return;

    const hasDownload = isValidUrl(entry.downloadUrl);
    const hasImage = isValidUrl(entry.imgUrl);
    if (!hasDownload && !hasImage) return;

    if (DOC_BUTTONS.some((item) => item.key === key)) {
      const normalizedKey = key as DocKey;
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
      else if (record.docType === "Job Offer") docs.jobOffer = main;
      else if (record.docType === "GACA Certificate") {
        docs.gacaCertificate = main;
      } else docs.others = main;
    }

    if (record?.jobOfferDoc) docs.jobOffer = record.jobOfferDoc;
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

  // Card view or table view (table is the default)
  const [viewMode, setViewMode] = useState<"card" | "table">("table");

  // Which document (slide) each employee card is showing
  const [slides, setSlides] = useState<Record<string, number>>({});
  const slideHover = useRef<Record<string, boolean>>({});
  const slideTouched = useRef<Record<string, number>>({});

  // Add / update a single document (iqama, passport, GACA, ...)
  const [uploadTarget, setUploadTarget] = useState<{
    docId: string;
    lockedKey: boolean;
  } | null>(null);
  const [uploadKey, setUploadKey] = useState<DocKey>("iqama");
  const [uploadLink, setUploadLink] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

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

  // Auto-play: next document slide on every card every 2 seconds
  const anyDialogOpen =
    previewModalOpen ||
    isEditOpen ||
    isAddOpen ||
    isDeleteOpen ||
    uploadTarget !== null;

  useEffect(() => {
    if (anyDialogOpen || viewMode !== "card") return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const ids = paginatedDocs.map((doc) => doc.docId);
    const timer = window.setInterval(() => {
      const now = Date.now();
      setSlides((previous) => {
        const next = { ...previous };
        ids.forEach((id) => {
          if (slideHover.current[id]) return;
          if (now - (slideTouched.current[id] ?? 0) < SLIDE_RESUME_AFTER_MS) {
            return;
          }
          next[id] = ((previous[id] ?? 0) + 1) % MAIN_DOC_KEYS.length;
        });
        return next;
      });
    }, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [paginatedDocs, anyDialogOpen, viewMode]);

  const handleDownload = (url: string, filename: string) => {
    if (!isValidUrl(url)) return;
    const targetUrl = isGoogleDriveUrl(url)
      ? getGoogleDriveDownloadUrl(url)
      : isDropboxUrl(url)
      ? toDropboxUrl(url, "dl")
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
      setPreviewContent({
        url: isDropboxUrl(url) ? toDropboxUrl(url, "raw") : url,
        title,
        type: isImageUrl(url) ? "image" : "pdf",
      });
    }
    setPreviewModalOpen(true);
  };

  const getFileUrl = (file?: RelatedDocument) =>
    file
      ? isValidUrl(file.downloadUrl)
        ? file.downloadUrl
        : file.imgUrl || ""
      : "";

  const docLabel = (key: DocKey, nationality?: string) =>
    key === "iqama"
      ? idLabel(nationality)
      : DOC_BUTTONS.find((item) => item.key === key)?.header ?? key;

  /* ---------- add / update one document ---------- */

  const openUpload = (
    doc: EmployeeDocument,
    key: DocKey,
    lockedKey = true
  ) => {
    setUploadTarget({ docId: doc.docId, lockedKey });
    setUploadKey(key);
    setUploadLink("");
    setUploadFile(null);
    setUploadError("");
  };

  const openUploadOther = (doc: EmployeeDocument) => {
    const firstMissing =
      OTHER_DOC_KEYS.find((key) => !doc.docs?.[key]) ?? OTHER_DOC_KEYS[0];
    openUpload(doc, firstMissing, false);
  };

  const closeUpload = () => {
    setUploadTarget(null);
    setUploadLink("");
    setUploadFile(null);
    setUploadError("");
    setIsUploading(false);
  };

  const uploadDoc = uploadTarget
    ? documents.find((doc) => doc.docId === uploadTarget.docId) ?? null
    : null;
  const uploadHasExisting = Boolean(uploadDoc?.docs?.[uploadKey]);

  const handleSaveUpload = async () => {
    if (!uploadDoc) return;
    setUploadError("");

    let url = uploadLink.trim();
    try {
      setIsUploading(true);
      if (uploadFile) url = await readFileAsDataUrl(uploadFile);
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Could not read the file"
      );
      setIsUploading(false);
      return;
    }

    if (!isValidUrl(url)) {
      setUploadError("Paste a link or choose a file.");
      setIsUploading(false);
      return;
    }

    const entry: RelatedDocument = {
      docName: docLabel(uploadKey, uploadDoc.nationality),
      downloadUrl: url,
    };
    setDocuments((previous) =>
      previous.map((doc) =>
        doc.docId === uploadDoc.docId
          ? { ...doc, docs: { ...doc.docs, [uploadKey]: entry } }
          : doc
      )
    );
    closeUpload();
  };

  const handleRemoveUploaded = () => {
    if (!uploadDoc) return;
    setDocuments((previous) =>
      previous.map((doc) => {
        if (doc.docId !== uploadDoc.docId) return doc;
        const nextDocs = { ...doc.docs };
        delete nextDocs[uploadKey];
        return { ...doc, docs: nextDocs };
      })
    );
    closeUpload();
  };

  /* ---------- employee edit / add / delete ---------- */

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
      "Job Offer": doc.docs?.jobOffer ? "Yes" : "No",
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
    <div
      className="mx-auto  min-h-screen w-full space-y-7 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:22px_22px] p-4 md:p-8"
      style={{ fontFamily: "'Montserrat', ui-sans-serif, system-ui, sans-serif" }}
    >
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
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
            {(
              [
                { mode: "card", label: "Cards", Icon: LayoutGrid },
                { mode: "table", label: "Table", Icon: TableIcon },
              ] as const
            ).map(({ mode, label, Icon }) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  viewMode === mode
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
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
          ) : viewMode === "table" ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full min-w-[1180px] text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                  <tr>
                    <th className="px-3 py-2.5">#</th>
                    <th className="px-3 py-2.5">Employee</th>
                    <th className="px-3 py-2.5">Employee ID</th>
                    <th className="px-3 py-2.5">Iqama / National ID no.</th>
                    <th className="px-3 py-2.5">Nationality</th>
                    <th className="px-3 py-2.5">Group</th>
                    <th className="px-3 py-2.5">Iqama / ID</th>
                    <th className="px-3 py-2.5">Passport</th>
                    <th className="px-3 py-2.5">GACA</th>
                    <th className="px-3 py-2.5">Other documents</th>
                    <th className="px-3 py-2.5">Complete</th>
                    <th className="px-3 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedDocs.map((doc, rowIndex) => {
                    const missing = getMissingDocs(doc);
                    const completion = Math.round(
                      ((DOC_BUTTONS.length - missing.length) / DOC_BUTTONS.length) * 100
                    );
                    const iqamaValue = isValidUrl(doc.iqamaNumber)
                      ? doc.iqamaNumber.trim()
                      : "N/A";
                    const rowNumber =
                      pageSize === "all"
                        ? rowIndex + 1
                        : (currentPage - 1) * Number(pageSize) + rowIndex + 1;
                    const otherFiles = OTHER_DOC_KEYS.filter(
                      (key) => doc.docs?.[key]
                    );

                    const renderDocCell = (key: DocKey) => {
                      const file = doc.docs?.[key];
                      const title = docLabel(key, doc.nationality);
                      const url = getFileUrl(file);
                      if (!file) {
                        return (
                          <button
                            type="button"
                            onClick={() => openUpload(doc, key)}
                            className="flex items-center gap-1 rounded-md border border-dashed border-slate-300 px-2 py-1 text-[11px] font-semibold text-slate-500 transition hover:border-slate-400 hover:bg-slate-50"
                          >
                            <Plus className="h-3 w-3" /> Add
                          </button>
                        );
                      }
                      return (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              openPreview(url, `${doc.employeeName} — ${title}`)
                            }
                            title={`View ${title}`}
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-700 transition hover:bg-slate-50"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownload(url, title)}
                            title={`Download ${title}`}
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-700 transition hover:bg-slate-50"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openUpload(doc, key)}
                            title={`Update ${title}`}
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-700 transition hover:bg-slate-50"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    };

                    return (
                      <tr key={doc.docId} className="align-middle transition hover:bg-slate-50/70">
                        <td className="px-3 py-2.5 text-slate-400">{rowNumber}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            {doc.photoUrl ? (
                              <button
                                type="button"
                                onClick={() =>
                                  openPreview(doc.photoUrl!, `${doc.employeeName} — Photo`)
                                }
                                title="View employee photo"
                                className="shrink-0"
                              >
                                <img
                                  src={doc.photoUrl}
                                  alt={doc.employeeName || "Employee"}
                                  className="h-8 w-8 rounded-full object-cover"
                                />
                              </button>
                            ) : (
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[11px] font-bold text-slate-600">
                                {getInitials(doc.employeeName)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p
                                className="max-w-[200px] truncate text-sm font-semibold text-slate-800"
                                title={doc.employeeName}
                              >
                                {doc.employeeName || "Unnamed Employee"}
                              </p>
                              <p
                                className="max-w-[200px] truncate text-[11px] text-slate-500"
                                title={doc.designation}
                              >
                                {doc.designation || "No designation"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 font-medium text-slate-700">
                          {doc.employeeId || "N/A"}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="font-semibold text-slate-800">{iqamaValue}</span>
                          <span className="ml-1 text-[10px] text-slate-400">
                            {idLabel(doc.nationality)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-700">
                          {doc.nationality || "N/A"}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="inline-block max-w-[150px] truncate rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                            {doc.group || "N/A"}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">{renderDocCell("iqama")}</td>
                        <td className="px-3 py-2.5">{renderDocCell("passport")}</td>
                        <td className="px-3 py-2.5">{renderDocCell("gacaCertificate")}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex max-w-[260px] flex-wrap items-center gap-1">
                            {otherFiles.map((key) => {
                              const file = doc.docs?.[key];
                              const title = docLabel(key, doc.nationality);
                              return (
                                <div
                                  key={key}
                                  className="flex items-center overflow-hidden rounded-md border border-slate-200 bg-white text-[10px] font-medium text-slate-700"
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openPreview(getFileUrl(file), `${doc.employeeName} — ${title}`)
                                    }
                                    className="px-2 py-1 hover:bg-slate-50"
                                    title={`View ${title}`}
                                  >
                                    {title}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDownload(getFileUrl(file), title)}
                                    className="border-l border-slate-200 px-1.5 py-1 hover:bg-slate-50"
                                    title={`Download ${title}`}
                                  >
                                    <Download className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openUpload(doc, key)}
                                    className="border-l border-slate-200 px-1.5 py-1 hover:bg-slate-50"
                                    title={`Update ${title}`}
                                  >
                                    <RefreshCw className="h-3 w-3" />
                                  </button>
                                </div>
                              );
                            })}
                            <button
                              type="button"
                              onClick={() => openUploadOther(doc)}
                              className="flex items-center gap-0.5 rounded-md border border-dashed border-slate-300 px-2 py-1 text-[10px] font-semibold text-slate-500 transition hover:bg-slate-50"
                            >
                              <Plus className="h-3 w-3" /> Add
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div
                            className="flex items-center gap-2"
                            title={
                              missing.length === 0
                                ? "All documents added"
                                : `Missing: ${missing.map((m) => m.header).join(", ")}`
                            }
                          >
                            <div className="h-1.5 w-14 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full rounded-full ${
                                  missing.length === 0 ? "bg-emerald-500" : "bg-amber-400"
                                }`}
                                style={{ width: `${completion}%` }}
                              />
                            </div>
                            <span className="font-semibold text-slate-700">{completion}%</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenEdit(doc)}
                              className="h-7 gap-1 rounded-md px-2 text-[11px] text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                            >
                              <Pencil className="h-3 w-3" />
                              Edit
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenDelete(doc)}
                              className="h-7 gap-1 rounded-md px-2 text-[11px] text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {paginatedDocs.map((doc, index) => {
                const missing = getMissingDocs(doc);
                const completed = DOC_BUTTONS.length - missing.length;
                const completion = Math.round(
                  (completed / DOC_BUTTONS.length) * 100
                );
                const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];
                const slideKeys = MAIN_DOC_KEYS;
                const active = Math.min(
                  slides[doc.docId] ?? 0,
                  slideKeys.length - 1
                );
                const activeKey = slideKeys[active];
                const activeFile = doc.docs?.[activeKey];
                const activeTitle = docLabel(activeKey, doc.nationality);
                const activeUrl = getFileUrl(activeFile);
                const goTo = (next: number) => {
                  slideTouched.current[doc.docId] = Date.now();
                  setSlides((previous) => ({
                    ...previous,
                    [doc.docId]:
                      (next + slideKeys.length) % slideKeys.length,
                  }));
                };
                const tags = [
                  doc.group,
                  doc.employeeId ? `ID ${doc.employeeId}` : "",
                  doc.nationality,
                ].filter(Boolean) as string[];
                const iqamaValue = isValidUrl(doc.iqamaNumber)
                  ? doc.iqamaNumber.trim()
                  : "N/A";
                const otherFiles = OTHER_DOC_KEYS.filter(
                  (key) => doc.docs?.[key]
                );

                return (
                  <Card
                    key={doc.docId}
                    className="relative flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
                  >
                    {/* Document slider: Iqama / Passport / GACA */}
                    <div
                      className="relative h-36 w-full overflow-hidden rounded-xl"
                      style={{ backgroundColor: accent.soft }}
                      onMouseEnter={() => {
                        slideHover.current[doc.docId] = true;
                      }}
                      onMouseLeave={() => {
                        slideHover.current[doc.docId] = false;
                      }}
                      onTouchStart={() => {
                        slideTouched.current[doc.docId] = Date.now();
                      }}
                    >
                      <div
                        className="flex h-full transition-transform duration-300 ease-out"
                        style={{ transform: `translateX(-${active * 100}%)` }}
                      >
                        {slideKeys.map((key) => {
                          const file = doc.docs?.[key];
                          const title = docLabel(key, doc.nationality);
                          const thumb = getDocThumb(file);
                          const url = getFileUrl(file);
                          return (
                            <div
                              key={key}
                              className="relative h-full w-full shrink-0"
                            >
                              <button
                                type="button"
                                disabled={!file}
                                onClick={() =>
                                  openPreview(url, `${doc.employeeName} — ${title}`)
                                }
                                className="absolute inset-0 flex flex-col items-center justify-center gap-1"
                                style={{ color: accent.ink }}
                              >
                                {file ? (
                                  <FileText className="h-9 w-9 opacity-60" />
                                ) : (
                                  <Plus className="h-9 w-9 opacity-40" />
                                )}
                                <span className="text-[11px] font-medium opacity-70">
                                  {file ? "Click to view" : `No ${title} yet`}
                                </span>
                              </button>
                              {thumb && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openPreview(url || thumb, `${doc.employeeName} — ${title}`)
                                  }
                                  className="absolute inset-0 block h-full w-full"
                                  title={`View ${title}`}
                                >
                                  <img
                                    src={thumb}
                                    alt={`${title} of ${doc.employeeName}`}
                                    className="h-full w-full object-cover"
                                    onError={(event) => {
                                      event.currentTarget.style.display = "none";
                                    }}
                                  />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Type tab */}
                      <div className="absolute left-0 top-0 z-10 max-w-[65%] truncate rounded-br-xl bg-white pb-1.5 pl-3 pr-3 pt-1.5 text-xs font-semibold text-slate-700 shadow-sm">
                        {activeTitle}
                      </div>

                      {/* Status */}
                      <span
                        className="absolute right-2 top-2 z-10 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                        style={{ backgroundColor: activeFile ? accent.main : "#94a3b8" }}
                      >
                        {activeFile ? "Added" : "Not added"}
                      </span>

                      {/* Arrows */}
                      <button
                        type="button"
                        onClick={() => goTo(active - 1)}
                        title="Previous document"
                        className="absolute left-1.5 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-sm transition hover:bg-white"
                      >
                        <ChevronLeft className="h-4 w-4 text-slate-700" />
                      </button>
                      <button
                        type="button"
                        onClick={() => goTo(active + 1)}
                        title="Next document"
                        className="absolute right-1.5 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-sm transition hover:bg-white"
                      >
                        <ChevronRight className="h-4 w-4 text-slate-700" />
                      </button>

                      {/* Dots */}
                      <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1">
                        {slideKeys.map((key, dotIndex) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => goTo(dotIndex)}
                            title={docLabel(key, doc.nationality)}
                            className={`h-1.5 rounded-full bg-white shadow-sm transition-all ${
                              dotIndex === active ? "w-4" : "w-1.5 opacity-60"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Name + completion */}
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
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
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          </button>
                        ) : (
                          <div
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                            style={{ backgroundColor: accent.soft, color: accent.ink }}
                          >
                            {getInitials(doc.employeeName)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h2
                            className="truncate text-sm font-bold leading-tight text-slate-800"
                            title={doc.employeeName}
                          >
                            {doc.employeeName || "Unnamed Employee"}
                          </h2>
                          <p
                            className="truncate text-xs text-slate-500"
                            title={doc.designation}
                          >
                            {doc.designation || "No designation"}
                          </p>
                        </div>
                      </div>
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
                        style={{ backgroundColor: accent.main }}
                        title={
                          missing.length === 0
                            ? "All documents added"
                            : `Missing: ${missing.map((m) => m.header).join(", ")}`
                        }
                      >
                        {completion}%
                      </span>
                    </div>

                    {tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="max-w-full truncate rounded-full px-2 py-0.5 text-[10px] font-medium"
                            style={{ backgroundColor: accent.soft, color: accent.ink }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Iqama / National ID number from the JSON, N/A if empty */}
                    <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-1.5 ring-1 ring-slate-100">
                      <span className="text-[11px] font-medium text-slate-500">
                        {idLabel(doc.nationality)} number
                      </span>
                      <span
                        className="truncate text-xs font-bold text-slate-800"
                        title={iqamaValue}
                      >
                        {iqamaValue}
                      </span>
                    </div>

                    {/* Document tabs (jump to a slide) */}
                    <div className="mt-2 grid grid-cols-3 gap-1">
                      {slideKeys.map((key, tabIndex) => {
                        const isActive = tabIndex === active;
                        const has = Boolean(doc.docs?.[key]);
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => goTo(tabIndex)}
                            className="flex items-center justify-center gap-1 truncate rounded-md border px-1.5 py-1 text-[10px] font-semibold transition"
                            style={
                              isActive
                                ? { backgroundColor: accent.main, borderColor: accent.main, color: "#fff" }
                                : { borderColor: "#e2e8f0", color: "#475569" }
                            }
                          >
                            <span
                              className="h-1.5 w-1.5 shrink-0 rounded-full"
                              style={{
                                backgroundColor: has
                                  ? isActive ? "#fff" : accent.main
                                  : "#cbd5e1",
                              }}
                            />
                            <span className="truncate">
                              {docLabel(key, doc.nationality).replace(" Certificate", "")}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Actions for the document on the current slide */}
                    <div className="mt-2">
                      {activeFile ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              openPreview(activeUrl, `${doc.employeeName} — ${activeTitle}`)
                            }
                            className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold text-white transition hover:brightness-110"
                            style={{ backgroundColor: accent.main }}
                          >
                            <Eye className="h-3.5 w-3.5" /> View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownload(activeUrl, activeTitle)}
                            className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            <Download className="h-3.5 w-3.5" /> Download
                          </button>
                          <button
                            type="button"
                            onClick={() => openUpload(doc, activeKey)}
                            title={`Update ${activeTitle}`}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openUpload(doc, activeKey)}
                          className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg text-xs font-semibold text-white transition hover:brightness-110"
                          style={{ backgroundColor: accent.main }}
                        >
                          <Plus className="h-3.5 w-3.5" /> Add {activeTitle}
                        </button>
                      )}
                    </div>

                    {/* Other documents (Job Offer, Joining, Others, A/ID, DACO ID) */}
                    <div className="mt-2 rounded-lg border border-dashed border-slate-200 p-2">
                      <div className="mb-1.5 flex items-center justify-between">
                        <p className="text-[11px] font-semibold text-slate-500">
                          Other documents
                        </p>
                        <button
                          type="button"
                          onClick={() => openUploadOther(doc)}
                          className="flex items-center gap-0.5 rounded-md border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                          <Plus className="h-3 w-3" /> Add
                        </button>
                      </div>
                      {otherFiles.length === 0 ? (
                        <p className="text-[10px] text-slate-400">None added yet</p>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {otherFiles.map((key) => {
                            const file = doc.docs?.[key];
                            const title = docLabel(key, doc.nationality);
                            return (
                              <div
                                key={key}
                                className="flex items-center overflow-hidden rounded-md border border-slate-200 bg-white text-[10px] font-medium text-slate-700"
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    openPreview(
                                      getFileUrl(file),
                                      `${doc.employeeName} — ${title}`
                                    )
                                  }
                                  className="px-2 py-1 hover:bg-slate-50"
                                  title={`View ${title}`}
                                >
                                  {title}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownload(getFileUrl(file), title)}
                                  className="border-l border-slate-200 px-1.5 py-1 hover:bg-slate-50"
                                  title={`Download ${title}`}
                                >
                                  <Download className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openUpload(doc, key)}
                                  className="border-l border-slate-200 px-1.5 py-1 hover:bg-slate-50"
                                  title={`Update ${title}`}
                                >
                                  <RefreshCw className="h-3 w-3" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
                      <span className="min-w-0 truncate text-[11px] text-slate-400">
                        Ref: {doc.refCode || "0"}
                      </span>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenEdit(doc)}
                          className="h-7 gap-1 rounded-md px-2 text-[11px] text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenDelete(doc)}
                          className="h-7 gap-1 rounded-md px-2 text-[11px] text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    </div>
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

      {/* Add / update one document */}
      <Dialog
        open={uploadTarget !== null}
        onOpenChange={(open) => {
          if (!open) closeUpload();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {uploadHasExisting ? "Update" : "Add"}{" "}
              {docLabel(uploadKey, uploadDoc?.nationality)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {uploadDoc && (
              <p className="text-sm text-muted-foreground">
                {uploadDoc.employeeName || "Unnamed Employee"}
              </p>
            )}

            {uploadTarget && !uploadTarget.lockedKey && (
              <Select
                value={uploadKey}
                onValueChange={(value) => {
                  setUploadKey(value as DocKey);
                  setUploadError("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Document type" />
                </SelectTrigger>
                <SelectContent>
                  {OTHER_DOC_KEYS.map((key) => (
                    <SelectItem key={key} value={key}>
                      {docLabel(key, uploadDoc?.nationality)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-600">
                Paste a link
              </p>
              <Input
                placeholder="https://drive.google.com/file/d/..."
                value={uploadLink}
                disabled={Boolean(uploadFile)}
                onChange={(event) => {
                  setUploadLink(event.target.value);
                  setUploadError("");
                }}
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-600">
                Or upload a file (PDF or image)
              </p>
              <Input
                type="file"
                accept="application/pdf,image/*"
                onChange={(event) => {
                  setUploadFile(event.target.files?.[0] ?? null);
                  setUploadError("");
                }}
              />
              {uploadFile && (
                <button
                  type="button"
                  className="text-xs text-rose-600 underline"
                  onClick={() => setUploadFile(null)}
                >
                  Remove selected file ({uploadFile.name})
                </button>
              )}
            </div>

            {uploadError && (
              <p className="text-xs text-rose-600">{uploadError}</p>
            )}

            <div className="flex items-center justify-between gap-2">
              {uploadHasExisting ? (
                <Button
                  type="button"
                  variant="outline"
                  className="gap-1.5 border-rose-100 text-rose-600 hover:bg-rose-50"
                  onClick={handleRemoveUploaded}
                >
                  <Trash2 className="h-4 w-4" /> Remove
                </Button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={closeUpload}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => void handleSaveUpload()}
                  disabled={isUploading}
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  {isUploading
                    ? "Saving..."
                    : uploadHasExisting
                    ? "Update Document"
                    : "Save Document"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
