import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  FileText,
  Download,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Pencil,
  Trash2,
  Plus,
  AlertTriangle,
} from "lucide-react";
import * as XLSX from "xlsx";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

type DocumentType = "Passport" | "Iqama" | "CV" | "Job Offer" | "Other";

interface EmployeeDocument {
  srNo: number;
  docId: string;
  docName: string;
  docType: DocumentType;
  employeeName: string;
  employeeId: string;
  issueDate: string;
  expiryDate?: string;
  fileSize: string;
  fileFormat: string;
  downloadUrl: string;
}

const initialDocumentsJSON: EmployeeDocument[] = [
  {
    srNo: 1,
    docId: "DOC-PASS-001",
    docName: "Mahabub_Passport_Original.pdf",
    docType: "Passport",
    employeeName: "Mahabub Alam",
    employeeId: "EMP-001",
    issueDate: "2021-05-10",
    expiryDate: "2031-05-09",
    fileSize: "2.4 MB",
    fileFormat: "PDF",
    downloadUrl: "#",
  },
  {
    srNo: 2,
    docId: "DOC-IQM-002",
    docName: "Resident_Iqama_Card_2026.pdf",
    docType: "Iqama",
    employeeName: "Mahabub Alam",
    employeeId: "EMP-001",
    issueDate: "2025-01-15",
    expiryDate: "2027-01-14",
    fileSize: "1.1 MB",
    fileFormat: "PDF",
    downloadUrl: "#",
  },
  {
    srNo: 3,
    docId: "DOC-CV-003",
    docName: "FullStack_Developer_Resume_2026.pdf",
    docType: "CV",
    employeeName: "Mahabub Alam",
    employeeId: "EMP-001",
    issueDate: "2026-02-01",
    fileSize: "850 KB",
    fileFormat: "PDF",
    downloadUrl: "#",
  },
  {
    srNo: 4,
    docId: "DOC-OFF-004",
    docName: "Signed_Job_Offer_Letter.pdf",
    docType: "Job Offer",
    employeeName: "Mahabub Alam",
    employeeId: "EMP-001",
    issueDate: "2024-08-20",
    fileSize: "1.8 MB",
    fileFormat: "PDF",
    downloadUrl: "#",
  },
  {
    srNo: 5,
    docId: "DOC-OTH-005",
    docName: "Educational_Certificate_Degree.pdf",
    docType: "Other",
    employeeName: "Mahabub Alam",
    employeeId: "EMP-001",
    issueDate: "2023-11-12",
    fileSize: "3.2 MB",
    fileFormat: "PDF",
    downloadUrl: "#",
  },
  {
    srNo: 6,
    docId: "DOC-PASS-006",
    docName: "John_Doe_Passport.pdf",
    docType: "Passport",
    employeeName: "John Doe",
    employeeId: "EMP-002",
    issueDate: "2022-03-14",
    expiryDate: "2032-03-13",
    fileSize: "2.1 MB",
    fileFormat: "PDF",
    downloadUrl: "#",
  },
  {
    srNo: 7,
    docId: "DOC-IQM-007",
    docName: "John_Doe_Iqama.pdf",
    docType: "Iqama",
    employeeName: "John Doe",
    employeeId: "EMP-002",
    issueDate: "2024-06-01",
    expiryDate: "2026-06-01",
    fileSize: "1.4 MB",
    fileFormat: "PDF",
    downloadUrl: "#",
  },
];

export default function Documents() {
  const [documents, setDocuments] = useState<EmployeeDocument[]>(initialDocumentsJSON);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState("10");

  // Dialog / Modal States
  const [selectedDoc, setSelectedDoc] = useState<EmployeeDocument | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form states for Add/Edit
  const [formData, setFormData] = useState<Partial<EmployeeDocument>>({});

  // Filter Logic
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        doc.docName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.docId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.employeeId.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType =
        typeFilter === "all" ||
        doc.docType.toLowerCase() === typeFilter.toLowerCase();

      return matchesSearch && matchesType;
    });
  }, [documents, searchTerm, typeFilter]);

  // Pagination Calculations
  const numericPageSize = pageSize === "all" ? filteredDocs.length || 1 : Number(pageSize);
  const totalItems = filteredDocs.length;
  const totalPages = Math.ceil(totalItems / numericPageSize) || 1;

  const paginatedDocs = useMemo(() => {
    if (pageSize === "all") return filteredDocs;
    const start = (currentPage - 1) * numericPageSize;
    return filteredDocs.slice(start, start + numericPageSize);
  }, [filteredDocs, currentPage, pageSize, numericPageSize]);

  // Handle Download Direct Link
  const handleDownloadFile = (doc: EmployeeDocument) => {
    const dummyContent = `=========================================\n${doc.docName.toUpperCase()}\n=========================================\nDocument ID : ${doc.docId}\nCategory    : ${doc.docType}\nEmployee    : ${doc.employeeName} (${doc.employeeId})\nIssue Date  : ${doc.issueDate}\nExpiry Date : ${doc.expiryDate || "N/A"}\nFormat      : ${doc.fileFormat}\nSize        : ${doc.fileSize}\nStatus      : Verified & Verified System File`;

    const blob = new Blob([dummyContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = doc.docName.endsWith(".pdf") ? doc.docName : `${doc.docName}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // CRUD Operations
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
      fileFormat: "PDF",
      fileSize: "1.2 MB",
      issueDate: new Date().toISOString().slice(0, 10),
    });
    setIsAddOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedDoc) return;
    setDocuments((prev) =>
      prev.map((item) =>
        item.docId === selectedDoc.docId ? ({ ...item, ...formData } as EmployeeDocument) : item
      )
    );
    setIsEditOpen(false);
  };

  const handleDelete = () => {
    if (!selectedDoc) return;
    setDocuments((prev) => prev.filter((item) => item.docId !== selectedDoc.docId));
    setIsDeleteOpen(false);
  };

  const handleSaveAdd = () => {
    const newDocId = `DOC-NEW-${Math.floor(100 + Math.random() * 900)}`;
    const newDoc: EmployeeDocument = {
      srNo: documents.length + 1,
      docId: newDocId,
      docName: formData.docName || "Untitled_Document.pdf",
      docType: (formData.docType as DocumentType) || "Other",
      employeeName: formData.employeeName || "Unassigned Employee",
      employeeId: formData.employeeId || "EMP-000",
      issueDate: formData.issueDate || new Date().toISOString().slice(0, 10),
      expiryDate: formData.expiryDate || "",
      fileSize: formData.fileSize || "1.0 MB",
      fileFormat: formData.fileFormat || "PDF",
      downloadUrl: "#",
    };

    setDocuments((prev) => [newDoc, ...prev]);
    setIsAddOpen(false);
  };

  // Export to Excel Function
  const exportToExcel = () => {
    const exportData = filteredDocs.map((doc, index) => ({
      "Sr. No": index + 1,
      "Document ID": doc.docId,
      "Document Name": doc.docName,
      "Document Category": doc.docType,
      "Employee Name": doc.employeeName,
      "Employee ID": doc.employeeId,
      "Issue Date": doc.issueDate,
      "Expiry Date": doc.expiryDate || "N/A",
      "File Size": doc.fileSize,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Documents List");
    XLSX.writeFile(workbook, `Employee_Documents_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Badge Style Helper
  const getDocTypeBadge = (type: DocumentType) => {
    switch (type) {
      case "Passport":
        return <Badge className="bg-blue-500/15 text-blue-600 border-blue-500/20">Passport</Badge>;
      case "Iqama":
        return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/20">Iqama</Badge>;
      case "CV":
        return <Badge className="bg-purple-500/15 text-purple-600 border-purple-500/20">CV</Badge>;
      case "Job Offer":
        return <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/20">Job Offer</Badge>;
      default:
        return <Badge className="bg-slate-500/15 text-slate-600 border-slate-500/20">Other</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employee Documents</h1>
          <p className="text-muted-foreground mt-1">
            Manage employee passports, iqamas, resumes, job offers, and certificates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleOpenAdd} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="w-4 h-4" /> Upload Document
          </Button>

          <Button
            onClick={exportToExcel}
            variant="outline"
            className="gap-2 border-emerald-600/30 text-emerald-700 hover:bg-emerald-500/10"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export Excel
          </Button>
        </div>
      </div>

      {/* Directory Card */}
      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search document, ID, or employee..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
              />
            </div>

            {/* Document Type Dropdown Filter */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select
                value={typeFilter}
                onValueChange={(val) => {
                  setTypeFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
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
        </CardHeader>

        <CardContent>
          {paginatedDocs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>No documents found matching your filter criteria.</p>
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b">
                  <tr>
                    <th className="px-4 py-3 text-center">Sr. No</th>
                    <th className="px-4 py-3">Doc ID</th>
                    <th className="px-4 py-3">Document Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3 text-center">Issue / Expiry</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedDocs.map((doc, idx) => {
                    const globalIndex =
                      pageSize === "all"
                        ? idx + 1
                        : (currentPage - 1) * numericPageSize + idx + 1;

                    return (
                      <tr key={doc.docId} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-4 text-center font-medium text-muted-foreground">
                          {globalIndex}
                        </td>

                        <td className="px-4 py-4 font-mono text-xs font-semibold text-slate-700">
                          {doc.docId}
                        </td>

                        <td className="px-4 py-4 font-medium text-foreground">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="truncate max-w-[220px]" title={doc.docName}>
                              {doc.docName}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground block pl-6">
                            {doc.fileSize} • {doc.fileFormat}
                          </span>
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap">
                          {getDocTypeBadge(doc.docType)}
                        </td>

                        <td className="px-4 py-4">
                          <div className="font-semibold text-foreground">{doc.employeeName}</div>
                          <span className="text-xs text-muted-foreground font-mono">
                            {doc.employeeId}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-center text-xs text-muted-foreground">
                          <div>Issued: {doc.issueDate}</div>
                          {doc.expiryDate && (
                            <div className="text-amber-600 font-medium">
                              Exp: {doc.expiryDate}
                            </div>
                          )}
                        </td>

                        {/* Actions (View, Download, Edit, Delete) */}
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleOpenView(doc)}
                              className="h-8 w-8 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                              title="View Document"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>

                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDownloadFile(doc)}
                              className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              title="Download File"
                            >
                              <Download className="w-4 h-4" />
                            </Button>

                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleOpenEdit(doc)}
                              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title="Edit Details"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>

                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleOpenDelete(doc)}
                              className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
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

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 mt-4 border-t">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Rows per page</span>
                <Select value={pageSize} onValueChange={(v) => { setPageSize(v); setCurrentPage(1); }}>
                  <SelectTrigger className="h-8 w-[80px]">
                    <SelectValue placeholder={pageSize} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="all">ALL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <span className="text-xs text-muted-foreground">
                Showing {totalItems > 0 ? (pageSize === "all" ? 1 : (currentPage - 1) * numericPageSize + 1) : 0} to{" "}
                {pageSize === "all" ? totalItems : Math.min(currentPage * numericPageSize, totalItems)} of {totalItems} items
              </span>
            </div>

            {/* Page Buttons */}
            <div className="flex items-center gap-1">
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
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1 || pageSize === "all"}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground px-2">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
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

      {/* VIEW DOCUMENT MODAL */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              Document Preview
            </DialogTitle>
          </DialogHeader>
          {selectedDoc && (
            <div className="space-y-4 py-2">
              <div className="p-4 bg-muted/40 rounded-lg border space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono text-muted-foreground">{selectedDoc.docId}</span>
                  {getDocTypeBadge(selectedDoc.docType)}
                </div>
                <h3 className="font-semibold text-lg">{selectedDoc.docName}</h3>
                <p className="text-sm text-muted-foreground">
                  Employee: <strong className="text-foreground">{selectedDoc.employeeName}</strong> ({selectedDoc.employeeId})
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground block text-xs">Issue Date</span>
                  <span className="font-medium">{selectedDoc.issueDate}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Expiry Date</span>
                  <span className="font-medium">{selectedDoc.expiryDate || "N/A"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">File Size</span>
                  <span className="font-medium">{selectedDoc.fileSize}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Format</span>
                  <span className="font-medium">{selectedDoc.fileFormat}</span>
                </div>
              </div>

              <div className="border rounded-md p-6 bg-slate-950 text-slate-100 font-mono text-xs space-y-2">
                <p className="text-slate-400">// Embedded Document Viewer Simulation</p>
                <p>--- BEGIN DOCUMENT CONTENT ---</p>
                <p>NAME: {selectedDoc.employeeName}</p>
                <p>DOC_TYPE: {selectedDoc.docType}</p>
                <p>STATUS: VERIFIED & ACTIVE</p>
                <p>--- END DOCUMENT CONTENT ---</p>
              </div>
            </div>
          )}
          <DialogFooter>
            {selectedDoc && (
              <Button onClick={() => handleDownloadFile(selectedDoc)} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                <Download className="w-4 h-4" /> Download File
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT DOCUMENT MODAL */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Document Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Document Name</Label>
              <Input
                value={formData.docName || ""}
                onChange={(e) => setFormData({ ...formData, docName: e.target.value })}
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select
                value={formData.docType}
                onValueChange={(val: DocumentType) => setFormData({ ...formData, docType: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Passport">Passport</SelectItem>
                  <SelectItem value="Iqama">Iqama</SelectItem>
                  <SelectItem value="CV">CV</SelectItem>
                  <SelectItem value="Job Offer">Job Offer</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Employee Name</Label>
              <Input
                value={formData.employeeName || ""}
                onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Issue Date</Label>
                <Input
                  type="date"
                  value={formData.issueDate || ""}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                />
              </div>
              <div>
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={formData.expiryDate || ""}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ADD / UPLOAD DOCUMENT MODAL */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload New Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Document File Name</Label>
              <Input
                placeholder="e.g. Mahabub_Passport.pdf"
                value={formData.docName || ""}
                onChange={(e) => setFormData({ ...formData, docName: e.target.value })}
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select
                value={formData.docType || "Passport"}
                onValueChange={(val: DocumentType) => setFormData({ ...formData, docType: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Passport">Passport</SelectItem>
                  <SelectItem value="Iqama">Iqama</SelectItem>
                  <SelectItem value="CV">CV</SelectItem>
                  <SelectItem value="Job Offer">Job Offer</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Employee Name</Label>
                <Input
                  placeholder="e.g. Mahabub Alam"
                  value={formData.employeeName || ""}
                  onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                />
              </div>
              <div>
                <Label>Employee ID</Label>
                <Input
                  placeholder="e.g. EMP-001"
                  value={formData.employeeId || ""}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Issue Date</Label>
                <Input
                  type="date"
                  value={formData.issueDate || ""}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                />
              </div>
              <div>
                <Label>Expiry Date (Optional)</Label>
                <Input
                  type="date"
                  value={formData.expiryDate || ""}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAdd} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION MODAL */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" /> Delete Document
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedDoc?.docName}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
