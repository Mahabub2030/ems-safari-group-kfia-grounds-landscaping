import {
  Download,
  Eye,
  FileText,
  Plus,
  RefreshCw,
  Save,
  Scissors,
  Trash2,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import type { DocKey } from "./Documents/EmployeeDocuments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";




/* ------------------------------------------------------------------ */
/* Types and constants                                                 */
/* ------------------------------------------------------------------ */

export type SplitResultPart = { key: DocKey; dataUrl: string };

type PartRow = { id: string; key: DocKey; range: string };

type ResultPart = {
  id: string;
  key: DocKey;
  label: string;
  pages: number;
  size: number;
  blobUrl: string;
  dataUrl: string;
};

const DOC_OPTIONS: { key: DocKey; label: string }[] = [
  { key: "iqama", label: "Iqama / ID" },
  { key: "passport", label: "Passport" },
  { key: "gacaCertificate", label: "GACA Certificate" },
  { key: "jobOffer", label: "Job Offer" },
  { key: "joining", label: "Joining" },
  { key: "Cv", label: "CV" },
  { key: "aid", label: "A/ID" },
  { key: "dacoId", label: "DACO ID" },
  { key: "others", label: "Others" },
];

const labelOf = (key: DocKey) =>
  DOC_OPTIONS.find((item) => item.key === key)?.label ?? key;

const ACCENTS = [
  { main: "#c44a36", soft: "#ffcfc2", ink: "#7a2a1c" },
  { main: "#4d8296", soft: "#a3ecff", ink: "#235063" },
  { main: "#ff7f66", soft: "#ffd3c7", ink: "#8a3a2a" },
];

const newId = () => Math.random().toString(36).slice(2, 9);

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the split file"));
    reader.readAsDataURL(blob);
  });

/**
 * "1-2, 5" -> [0, 1, 4]  (zero-based page indexes)
 * Throws an Error with a readable message if the range is not valid.
 */
const parseRange = (input: string, total: number): number[] => {
  const text = input.trim();
  if (!text) throw new Error("Enter the pages, for example 1-2 or 1,3");

  const pages: number[] = [];
  for (const token of text.split(",")) {
    const part = token.trim();
    if (!part) continue;

    const match = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!match) throw new Error(`"${part}" is not a valid page or range`);

    const from = Number(match[1]);
    const to = match[2] ? Number(match[2]) : from;
    if (from < 1 || to < 1) throw new Error("Pages start at 1");
    if (to < from) throw new Error(`"${part}" goes backwards`);
    if (to > total) {
      throw new Error(`Page ${to} does not exist (the PDF has ${total})`);
    }
    for (let page = from; page <= to; page += 1) pages.push(page - 1);
  }

  if (pages.length === 0) throw new Error("Enter the pages to keep");
  return pages;
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

interface PdfUploadSplitProps {
  employeeName?: string;
  /** Called with the split parts when the user clicks "Save to employee". */
  onSave?: (parts: SplitResultPart[]) => void;
}

export default function PdfUploadSplit({
  employeeName = "",
  onSave,
}: PdfUploadSplitProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Step 1 - the uploaded PDF
  const [file, setFile] = useState<File | null>(null);
  const [sourceBytes, setSourceBytes] = useState<ArrayBuffer | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [pageCount, setPageCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isReading, setIsReading] = useState(false);

  // Step 2 - the parts to cut out
  const [rows, setRows] = useState<PartRow[]>([]);
  const [error, setError] = useState("");
  const [isSplitting, setIsSplitting] = useState(false);

  // Step 3 - the finished parts
  const [results, setResults] = useState<ResultPart[]>([]);

  // Preview dialog
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(
    null
  );

  // Free object URLs when they are replaced or the component goes away
  useEffect(() => {
    return () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    };
  }, [sourceUrl]);

  const resultUrlsRef = useRef<string[]>([]);
  useEffect(() => {
    resultUrlsRef.current = results.map((item) => item.blobUrl);
  }, [results]);
  useEffect(() => {
    return () => resultUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const usedKeys = useMemo(() => new Set(rows.map((row) => row.key)), [rows]);

  const clearResults = () => {
    results.forEach((item) => URL.revokeObjectURL(item.blobUrl));
    setResults([]);
  };

  /* ---------- upload ---------- */

  const loadFile = async (picked: File | null) => {
    if (!picked) return;
    setError("");

    const looksLikePdf =
      picked.type === "application/pdf" || /\.pdf$/i.test(picked.name);
    if (!looksLikePdf) {
      setError("Please choose a PDF file.");
      return;
    }

    try {
      setIsReading(true);
      const bytes = await picked.arrayBuffer();
      // ignoreEncryption lets us read the page count of protected files;
      // splitting them still fails later with a clear message.
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const total = pdf.getPageCount();
      if (total === 0) throw new Error("This PDF has no pages.");

      clearResults();
      setFile(picked);
      setSourceBytes(bytes);
      setSourceUrl(URL.createObjectURL(new Blob([bytes], { type: "application/pdf" })));
      setPageCount(total);
      setRows([
        {
          id: newId(),
          key: "iqama",
          range: total >= 1 ? "1" : "",
        },
      ]);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? `Could not open this PDF: ${loadError.message}`
          : "Could not open this PDF."
      );
    } finally {
      setIsReading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const resetAll = () => {
    clearResults();
    setFile(null);
    setSourceBytes(null);
    setSourceUrl("");
    setPageCount(0);
    setRows([]);
    setError("");
  };

  /* ---------- part rows ---------- */

  const addRow = () => {
    const nextKey =
      DOC_OPTIONS.find((item) => !usedKeys.has(item.key))?.key ?? "others";
    setRows((previous) => [...previous, { id: newId(), key: nextKey, range: "" }]);
  };

  const updateRow = (id: string, patch: Partial<PartRow>) => {
    setError("");
    setRows((previous) =>
      previous.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
  };

  const removeRow = (id: string) =>
    setRows((previous) => previous.filter((row) => row.id !== id));

  // One part per page, so the user only has to choose the types
  const oneRowPerPage = () => {
    setError("");
    const keys = DOC_OPTIONS.map((item) => item.key);
    setRows(
      Array.from({ length: pageCount }, (_, index) => ({
        id: newId(),
        key: keys[index] ?? "others",
        range: String(index + 1),
      }))
    );
  };

  /* ---------- split ---------- */

  const handleSplit = async () => {
    if (!sourceBytes) return;
    setError("");

    if (rows.length === 0) {
      setError("Add at least one part.");
      return;
    }
    const keys = rows.map((row) => row.key);
    if (new Set(keys).size !== keys.length) {
      setError("Each document type can be used only once.");
      return;
    }

    try {
      setIsSplitting(true);
      const source = await PDFDocument.load(sourceBytes, {
        ignoreEncryption: true,
      });

      const built: ResultPart[] = [];
      for (const row of rows) {
        const indexes = parseRange(row.range, pageCount);
        const output = await PDFDocument.create();
        const copied = await output.copyPages(source, indexes);
        copied.forEach((page) => output.addPage(page));

        const saved = await output.save();
        const blob = new Blob([saved as BlobPart], { type: "application/pdf" });
        built.push({
          id: row.id,
          key: row.key,
          label: labelOf(row.key),
          pages: indexes.length,
          size: blob.size,
          blobUrl: URL.createObjectURL(blob),
          dataUrl: await blobToDataUrl(blob),
        });
      }

      clearResults();
      setResults(built);
    } catch (splitError) {
      setError(
        splitError instanceof Error
          ? splitError.message
          : "Something went wrong while splitting."
      );
    } finally {
      setIsSplitting(false);
    }
  };

  const downloadOne = (item: ResultPart) => {
    const base = (employeeName || file?.name.replace(/\.pdf$/i, "") || "document")
      .replace(/[^\w\-]+/g, "_");
    const link = document.createElement("a");
    link.href = item.blobUrl;
    link.download = `${base}_${item.label.replace(/[^\w\-]+/g, "_")}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAll = () => results.forEach((item) => downloadOne(item));

  const saveToEmployee = () => {
    onSave?.(results.map(({ key, dataUrl }) => ({ key, dataUrl })));
    resetAll();
  };

  /* ---------- render ---------- */

  return (
    <div
      className="mx-auto min-h-screen w-full space-y-7 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:22px_22px] p-4 md:p-8"
      style={{ fontFamily: "'Montserrat', ui-sans-serif, system-ui, sans-serif" }}
    >
      {/* Heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Upload &amp; Split PDF
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload one combined PDF, choose which pages belong to each document,
            then split it.
            {employeeName ? ` Employee: ${employeeName}.` : ""}
          </p>
        </div>
        {file && (
          <Button variant="outline" onClick={resetAll} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Start over
          </Button>
        )}
      </div>

      {/* Step 1: upload */}
      <Card className="rounded-2xl border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
              1
            </span>
            Upload the PDF
          </CardTitle>
        </CardHeader>
        <CardContent>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(event) => void loadFile(event.target.files?.[0] ?? null)}
          />

          {!file ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                void loadFile(event.dataTransfer.files?.[0] ?? null);
              }}
              className={`flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition ${
                isDragging
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50"
              }`}
            >
              <Upload className="h-9 w-9 text-slate-400" />
              <span className="text-sm font-semibold text-slate-700">
                {isReading ? "Reading PDF..." : "Click to choose a PDF, or drop it here"}
              </span>
              <span className="text-xs text-slate-400">
                Everything stays in your browser. Nothing is uploaded to a server.
              </span>
            </button>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: ACCENTS[0].soft, color: ACCENTS[0].ink }}
                >
                  <FileText className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-800" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {pageCount} page{pageCount === 1 ? "" : "s"} · {formatSize(file.size)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setPreview({ url: sourceUrl, title: file.name })}
                >
                  <Eye className="h-4 w-4" /> View PDF
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => inputRef.current?.click()}
                >
                  <RefreshCw className="h-4 w-4" /> Change PDF
                </Button>
              </div>
            </div>
          )}

          {error && !file && <p className="mt-3 text-xs text-rose-600">{error}</p>}
        </CardContent>
      </Card>

      {/* Step 2: choose the parts */}
      {file && (
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                  2
                </span>
                Choose pages for each document
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={oneRowPerPage}
                >
                  <Scissors className="h-3.5 w-3.5" /> One document per page
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={addRow}
                >
                  <Plus className="h-3.5 w-3.5" /> Add part
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Use page numbers like <strong>1</strong>, <strong>1-2</strong> or{" "}
              <strong>1,3,5</strong>. The PDF has {pageCount} page
              {pageCount === 1 ? "" : "s"}.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {rows.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No parts yet. Click "Add part".
              </p>
            )}

            {rows.map((row, index) => {
              const accent = ACCENTS[index % ACCENTS.length];
              return (
                <div
                  key={row.id}
                  className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center"
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{ backgroundColor: accent.soft, color: accent.ink }}
                  >
                    {index + 1}
                  </span>

                  <Select
                    value={row.key}
                    onValueChange={(value) => updateRow(row.id, { key: value as DocKey })}
                  >
                    <SelectTrigger className="w-full sm:w-[220px]">
                      <SelectValue placeholder="Document type" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOC_OPTIONS.map((item) => (
                        <SelectItem
                          key={item.key}
                          value={item.key}
                          disabled={usedKeys.has(item.key) && item.key !== row.key}
                        >
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Pages, e.g. 1-2"
                    value={row.range}
                    onChange={(event) => updateRow(row.id, { range: event.target.value })}
                    className="sm:max-w-[200px]"
                  />

                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeRow(row.id)}
                    className="gap-1 self-end text-rose-600 hover:bg-rose-50 hover:text-rose-700 sm:ml-auto sm:self-auto"
                  >
                    <Trash2 className="h-4 w-4" /> Remove
                  </Button>
                </div>
              );
            })}

            {error && <p className="text-xs text-rose-600">{error}</p>}

            <Button
              type="button"
              onClick={() => void handleSplit()}
              disabled={isSplitting || rows.length === 0}
              className="w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <Scissors className="h-4 w-4" />
              {isSplitting ? "Splitting..." : "Split PDF"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 3: results */}
      {results.length > 0 && (
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                  3
                </span>
                Split result ({results.length} document{results.length === 1 ? "" : "s"})
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" className="gap-2" onClick={downloadAll}>
                  <Download className="h-4 w-4" /> Download all
                </Button>
                {onSave && (
                  <Button
                    className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={saveToEmployee}
                  >
                    <Save className="h-4 w-4" /> Save to employee
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((item, index) => {
                const accent = ACCENTS[index % ACCENTS.length];
                return (
                  <Card
                    key={item.id}
                    className="flex flex-col rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div
                      className="relative h-32 w-full overflow-hidden rounded-xl"
                      style={{ backgroundColor: accent.soft }}
                    >
                      <div
                        className="absolute left-0 top-0 z-10 max-w-[70%] truncate rounded-br-xl bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm"
                      >
                        {item.label}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setPreview({ url: item.blobUrl, title: item.label })
                        }
                        className="absolute inset-0 flex flex-col items-center justify-center gap-1"
                        style={{ color: accent.ink }}
                      >
                        <FileText className="h-9 w-9 opacity-60" />
                        <span className="text-[11px] font-medium opacity-70">
                          Click to view
                        </span>
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <p className="text-xs text-slate-500">
                        {item.pages} page{item.pages === 1 ? "" : "s"} · {formatSize(item.size)}
                      </p>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                        style={{ backgroundColor: accent.main }}
                      >
                        Ready
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setPreview({ url: item.blobUrl, title: item.label })
                        }
                        className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold text-white transition hover:brightness-110"
                        style={{ backgroundColor: accent.main }}
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadOne(item)}
                        className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <Download className="h-3.5 w-3.5" /> Download
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview dialog */}
      <Dialog
        open={preview !== null}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
      >
        <DialogContent className="flex h-[80vh] max-w-4xl flex-col p-4">
          <DialogHeader className="border-b pb-2 pr-8">
            <DialogTitle className="truncate text-lg font-bold">
              {preview?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2 flex h-full w-full flex-1 overflow-hidden rounded-md bg-slate-950">
            {preview && (
              <iframe
                src={preview.url}
                className="h-full w-full border-0"
                title={preview.title}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
