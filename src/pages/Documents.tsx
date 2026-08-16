import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CreditCard,
  Download,
  Eye,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Filter,
  Globe,
  Image as ImageIcon,
  Layers,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import * as XLSX from "xlsx";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

// ----------------------------------------------------------------------
// Helper Utilities for Google Drive & File Handling
// ----------------------------------------------------------------------

const isGoogleDriveUrl = (url: string): boolean => {
  return url.includes("drive.google.com");
};

/**
 * Extracts Google Drive File ID and builds an iframe-embeddable preview link.
 */
const getGoogleDriveEmbedUrl = (url: string): string => {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/file/d/${match[1]}/preview`;
  }
  return url;
};

/**
 * Converts Google Drive view link to a direct download link.
 */
const getGoogleDriveDownloadUrl = (url: string): string => {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/uc?export=download&id=${match[1]}`;
  }
  return url;
};

// ----------------------------------------------------------------------
// Types & Initial Data
// ----------------------------------------------------------------------

type DocumentType = "Passport" | "Iqama" | "CV" | "Job Offer" | "Other";

interface RelatedDocument {
  docName: string;
  downloadUrl: string;
  imgUrl?: string;
  fileSize?: string;
  fileFormat?: string;
}

interface EmployeeDocument {
  srNo: number;
  docId: string;
  docName: string;
  docType: DocumentType;
  employeeName: string;
  employeeId: string;
  group?: string;
  iqamaNumber?: string;
  passportNumber?: string;
  issueDate: string;
  expiryDate?: string;
  fileSize: string;
  fileFormat: string;
  downloadUrl: string;
  imgUrl?: string;
  cvDoc?: RelatedDocument;
  jobOfferDoc?: RelatedDocument;
  otherDoc?: RelatedDocument;
}

const initialDocumentsJSON: EmployeeDocument[] = [
  {
    srNo: 1,
    docId: "DOC-PASS-001",
    docName: "Mahabub_Passport_Original.pdf",
    docType: "Passport",
    employeeName: "Mahabub Alam",
    employeeId: "EMP-001",
    group: "Software & Tech",
    passportNumber: "A12345678",
    issueDate: "2021-05-10",
    expiryDate: "2031-05-09",
    fileSize: "2.4 MB",
    fileFormat: "PDF",
    downloadUrl:
      "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    imgUrl:
      "https://images.unsplash.com/photo-1544717305-2782549b5136?w=500&auto=format&fit=crop&q=60",
    cvDoc: {
      docName: "Mahabub_FullStack_CV.pdf",
      downloadUrl:
        "https://drive.google.com/file/d/1PCYeAD5UYAZdpb2t86tIcLEXB6EstwGp/view?usp=sharing",
      imgUrl:
        "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=500&auto=format&fit=crop&q=60",
      fileSize: "850 KB",
      fileFormat: "PDF",
    },
    jobOfferDoc: {
      docName: "Mahabub_Job_Offer_Signed.pdf",
      downloadUrl:
        "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      imgUrl:
        "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=500&auto=format&fit=crop&q=60",
      fileSize: "1.8 MB",
      fileFormat: "PDF",
    },
    otherDoc: {
      docName: "Mahabub_Degree_Certificate.pdf",
      downloadUrl:
        "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      imgUrl:
        "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=500&auto=format&fit=crop&q=60",
      fileSize: "3.2 MB",
      fileFormat: "PDF",
    },
  },
];

export default function Documents() {
  const [documents] = useState<EmployeeDocument[]>(initialDocumentsJSON);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");

  // Pagination states: options 10, 50, 100, all
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState("10");

  const [, setSelectedDoc] = useState<EmployeeDocument | null>(null);
  const [, setIsViewOpen] = useState(false);
  const [, setIsEditOpen] = useState(false);
  const [, setIsDeleteOpen] = useState(false);
  const [, setIsAddOpen] = useState(false);

  // Preview state for Drive, PDFs, and Images
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState<{
    url: string;
    title: string;
    type: "drive" | "pdf" | "image";
  } | null>(null);

  const [, setFormData] = useState<Partial<EmployeeDocument>>({});

  const availableGroups = useMemo(() => {
    const set = new Set<string>();
    documents.forEach((d) => {
      if (d.group) set.add(d.group);
    });
    return Array.from(set);
  }, [documents]);

  const passportCount = useMemo(
    () => documents.filter((d) => d.docType === "Passport").length,
    [documents],
  );
  const iqamaCount = useMemo(
    () => documents.filter((d) => d.docType === "Iqama").length,
    [documents],
  );

  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        doc.docName.toLowerCase().includes(term) ||
        doc.docId.toLowerCase().includes(term) ||
        doc.employeeName.toLowerCase().includes(term) ||
        doc.employeeId.toLowerCase().includes(term) ||
        (doc.group && doc.group.toLowerCase().includes(term)) ||
        (doc.iqamaNumber && doc.iqamaNumber.toLowerCase().includes(term)) ||
        (doc.passportNumber && doc.passportNumber.toLowerCase().includes(term));

      const matchesType =
        typeFilter === "all" ||
        doc.docType.toLowerCase() === typeFilter.toLowerCase();

      const matchesGroup =
        groupFilter === "all" ||
        (doc.group && doc.group.toLowerCase() === groupFilter.toLowerCase());

      return matchesSearch && matchesType && matchesGroup;
    });
  }, [documents, searchTerm, typeFilter, groupFilter]);

  // Pagination calculations
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

  // Download handler for Google Drive and external files
  const handleDownload = (
    url: string,
    filename: string,
    docId?: string,
    type?: string,
  ) => {
    if (url && url !== "#") {
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
    } else {
      const dummyContent = `=========================================\n${filename.toUpperCase()}\n=========================================\nDocument ID : ${
        docId || "DOC-FILE"
      }\nCategory    : ${
        type || "Attachment"
      }\nStatus      : Verified & Complete Downloadable File`;

      const blob = new Blob([dummyContent], {
        type: "text/plain;charset=utf-8",
      });
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    }
  };

  // Preview opener handling Google Drive iframe previews
  const openPreview = (url: string, title: string) => {
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
      setPreviewContent({
        url,
        title,
        type: isImage ? "image" : "pdf",
      });
    }
    setPreviewModalOpen(true);
  };

  const handleOpenView = (doc: EmployeeDocument) => {
    setSelectedDoc(doc);
    setIsViewOpen(true);
  };

  const handleOpenEdit = (doc: EmployeeDocument) => {
    setSelectedDoc(doc);
    setFormData(doc);
    setIsEditOpen(true);
  };

  const handleOpenDelete = (doc: EmployeeDocument) => {
    setSelectedDoc(doc);
    setIsDeleteOpen(true);
  };

  const handleOpenAdd = () => {
    setFormData({
      docType: "Passport",
      group: "Software & Tech",
      fileFormat: "PDF",
      fileSize: "1.2 MB",
      issueDate: new Date().toISOString().slice(0, 10),
      downloadUrl: "#",
      imgUrl:
        "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=500&auto=format&fit=crop&q=60",
    });
    setIsAddOpen(true);
  };

  const exportToExcel = () => {
    const exportData = filteredDocs.map((doc, index) => ({
      "Sr. No": index + 1,
      "Document ID": doc.docId,
      "Document Name": doc.docName,
      "Document Category": doc.docType,
      "Employee Name": doc.employeeName,
      "Employee ID": doc.employeeId,
      Group: doc.group || "N/A",
      "Iqama Number": doc.iqamaNumber || "N/A",
      "Passport Number": doc.passportNumber || "N/A",
      "CV Attached": doc.cvDoc ? doc.cvDoc.docName : "N/A",
      "Job Offer Attached": doc.jobOfferDoc ? doc.jobOfferDoc.docName : "N/A",
      "Other Doc Attached": doc.otherDoc ? doc.otherDoc.docName : "N/A",
      "Issue Date": doc.issueDate,
      "Expiry Date": doc.expiryDate || "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Documents List");
    XLSX.writeFile(
      workbook,
      `Employee_Documents_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

  const getDocTypeBadge = (type: DocumentType) => {
    switch (type) {
      case "Passport":
        return (
          <Badge className="bg-blue-500/15 text-blue-600 border-blue-500/20 whitespace-nowrap">
            Passport
          </Badge>
        );
      case "Iqama":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/20 whitespace-nowrap">
            Iqama
          </Badge>
        );
      case "CV":
        return (
          <Badge className="bg-purple-500/15 text-purple-600 border-purple-500/20 whitespace-nowrap">
            CV
          </Badge>
        );
      case "Job Offer":
        return (
          <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/20 whitespace-nowrap">
            Job Offer
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-500/15 text-slate-600 border-slate-500/20 whitespace-nowrap">
            Other
          </Badge>
        );
    }
  };

  const renderDocCell = (doc?: RelatedDocument, defaultType?: string) => {
    if (!doc) {
      return (
        <span className="text-xs text-muted-foreground italic whitespace-nowrap">
          - None -
        </span>
      );
    }

    return (
      <div className="flex flex-col gap-1 items-start text-xs whitespace-nowrap">
        <div
          className="flex items-center gap-1.5 font-medium max-w-[160px] truncate"
          title={doc.docName}
        >
          <FileCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="truncate">{doc.docName}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              openPreview(doc.downloadUrl || doc.imgUrl || "#", doc.docName)
            }
            className="text-[10px] text-purple-600 hover:text-purple-800 underline flex items-center gap-0.5"
          >
            <Eye className="w-3 h-3" /> View
          </button>
          <button
            onClick={() =>
              handleDownload(
                doc.downloadUrl,
                doc.docName,
                "DOC-SUB",
                defaultType,
              )
            }
            className="text-[10px] text-emerald-600 hover:text-emerald-800 underline flex items-center gap-0.5"
          >
            <Download className="w-3 h-3" /> Download
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-[96rem] space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Employee Documents
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage passports, iqamas, CVs, job offers, and additional files.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleOpenAdd}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="w-4 h-4" /> Upload Document
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
              Active registered passport files
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
              Active residency documents
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Records
            </CardTitle>
            <Layers className="w-5 h-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {documents.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All uploaded employee profiles
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Directory Table Container */}
      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search Iqama, Passport, Group, Name..."
                value={searchTerm}
                onChange={(e) => {
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
                  onValueChange={(val) => {
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
                  value={typeFilter}
                  onValueChange={(val) => {
                    setTypeFilter(val);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[170px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="passport">Passport</SelectItem>
                    <SelectItem value="iqama">Iqama</SelectItem>
                    <SelectItem value="cv">CV</SelectItem>
                    <SelectItem value="job offer">Job Offer</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {paginatedDocs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>No documents found matching your filter criteria.</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto border rounded-md">
              <table className="w-full min-w-[1250px] text-sm text-left border-collapse">
                <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b whitespace-nowrap">
                  <tr>
                    <th className="px-4 py-3 text-center">Sr. No</th>
                    <th className="px-4 py-3">Doc ID</th>
                    <th className="px-4 py-3 text-center">Preview</th>
                    <th className="px-4 py-3">Document Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Employee & Group</th>
                    <th className="px-4 py-3">Iqama / Passport</th>
                    <th className="px-4 py-3 border-l bg-purple-500/5 text-purple-700">
                      CV Document
                    </th>
                    <th className="px-4 py-3 bg-amber-500/5 text-amber-700">
                      Job Offer
                    </th>
                    <th className="px-4 py-3 border-r bg-slate-500/5 text-slate-700">
                      Other Files
                    </th>
                    <th className="px-4 py-3 text-center">Dates</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y whitespace-nowrap">
                  {paginatedDocs.map((doc, idx) => {
                    const globalIndex =
                      pageSize === "all"
                        ? idx + 1
                        : (currentPage - 1) * numericPageSize + idx + 1;

                    return (
                      <tr
                        key={doc.docId}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-4 text-center font-medium text-muted-foreground">
                          {globalIndex}
                        </td>

                        <td className="px-4 py-4 font-mono text-xs font-semibold text-slate-700">
                          {doc.docId}
                        </td>

                        <td className="px-4 py-4 text-center">
                          {doc.imgUrl ? (
                            <button
                              onClick={() =>
                                openPreview(doc.imgUrl!, doc.docName)
                              }
                              className="group relative inline-block rounded-md overflow-hidden border border-slate-200 shadow-sm hover:ring-2 hover:ring-emerald-500 transition-all shrink-0"
                              title="Click to preview image"
                            >
                              <img
                                src={doc.imgUrl}
                                alt={doc.docName}
                                className="w-10 h-10 object-cover transition-transform group-hover:scale-110"
                              />
                            </button>
                          ) : (
                            <div className="w-10 h-10 mx-auto rounded-md bg-slate-100 flex items-center justify-center text-slate-400">
                              <ImageIcon className="w-4 h-4" />
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-4 font-medium text-foreground">
                          <div className="flex items-center gap-1.5 max-w-[180px] truncate">
                            <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="truncate" title={doc.docName}>
                              {doc.docName}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground block pl-5">
                            {doc.fileSize} • {doc.fileFormat}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          {getDocTypeBadge(doc.docType)}
                        </td>

                        <td className="px-4 py-4">
                          <div className="font-semibold text-foreground text-xs">
                            {doc.employeeName}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {doc.employeeId}
                            </span>
                            {doc.group && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 h-4 font-normal bg-slate-100 text-slate-700 border-slate-300"
                              >
                                {doc.group}
                              </Badge>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-4 font-mono text-xs">
                          {doc.iqamaNumber && (
                            <div className="text-emerald-700 font-semibold">
                              IQ: {doc.iqamaNumber}
                            </div>
                          )}
                          {doc.passportNumber && (
                            <div className="text-blue-700 font-semibold">
                              PASS: {doc.passportNumber}
                            </div>
                          )}
                          {!doc.iqamaNumber && !doc.passportNumber && (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>

                        <td className="px-4 py-4 border-l bg-purple-500/5">
                          {renderDocCell(doc.cvDoc, "CV")}
                        </td>

                        <td className="px-4 py-4 bg-amber-500/5">
                          {renderDocCell(doc.jobOfferDoc, "Job Offer")}
                        </td>

                        <td className="px-4 py-4 border-r bg-slate-500/5">
                          {renderDocCell(doc.otherDoc, "Other File")}
                        </td>

                        <td className="px-4 py-4 text-center text-[11px] text-muted-foreground">
                          <div>Issued: {doc.issueDate}</div>
                          {doc.expiryDate && (
                            <div className="text-amber-600 font-medium">
                              Exp: {doc.expiryDate}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleOpenView(doc)}
                              className="h-7 w-7 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                              title="View Document Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>

                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() =>
                                handleDownload(
                                  doc.downloadUrl,
                                  doc.docName,
                                  doc.docId,
                                  doc.docType,
                                )
                              }
                              className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              title="Download Main File"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </Button>

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
                onValueChange={(val) => {
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
                  title="First Page"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
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

      {/* Document View Preview Modal */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-4">
          <DialogHeader className="flex flex-row items-center justify-between border-b pb-2">
            <DialogTitle className="text-lg font-bold truncate">
              {previewContent?.title}
            </DialogTitle>
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
    </div>
  );
}
