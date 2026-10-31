import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  Eye,
  FileText,
  Info,
  Plus,
  Save,
  Scissors,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
// Vite: bundles the pdf.js worker and gives back its URL
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import type { DocKey } from "./Documents/EmployeeDocuments";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";


pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

/* ------------------------------------------------------------------ */
/* Types and constants                                                 */
/* ------------------------------------------------------------------ */

export type SplitResultPart = { key: DocKey; dataUrl: string };

type TypeValue = DocKey | "none";

type PageItem = {
  id: string;
  srcId: string;
  srcIndex: number; // zero-based page inside its source PDF
  srcName: string;
  thumb: string; // data URL, empty while rendering
  selected: boolean;
  type: TypeValue;
};

type SourceFile = { name: string; bytes: ArrayBuffer };

type RangeRow = { id: string; type: TypeValue; range: string };

type ResultPart = {
  id: string;
  key?: DocKey;
  label: string;
  pages: number;
  size: number;
  blobUrl: string;
  dataUrl: string;
};

type Group = { pages: PageItem[]; key?: DocKey; label: string };

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

const RED = "#e5322d";
const ACCENTS = [
  { main: "#c44a36", soft: "#ffcfc2", ink: "#7a2a1c" },
  { main: "#4d8296", soft: "#a3ecff", ink: "#235063" },
  { main: "#ff7f66", soft: "#ffd3c7", ink: "#8a3a2a" },
];

let idCounter = 0;
const newId = () => `p${Date.now().toString(36)}${(idCounter += 1)}`;

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

/** "1-2, 5" -> [0, 1, 4]. Throws a readable Error if invalid. */
const parseRange = (input: string, total: number): number[] => {
  const text = input.trim();
  if (!text) throw new Error("Enter the pages, for example 1-2 or 1,3");

  const out: number[] = [];
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
      throw new Error(`Page ${to} does not exist (you have ${total} pages)`);
    }
    for (let page = from; page <= to; page += 1) out.push(page - 1);
  }
  if (out.length === 0) throw new Error("Enter the pages to keep");
  return out;
};

/* ------------------------------------------------------------------ */
/* Small UI pieces                                                     */
/* ------------------------------------------------------------------ */

function TypeSelect({
  value,
  onChange,
  className,
  compact,
}: {
  value: TypeValue;
  onChange: (value: TypeValue) => void;
  className?: string;
  compact?: boolean;
}) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as TypeValue)}>
      <SelectTrigger
        className={`${compact ? "h-7 text-[11px]" : ""} ${className ?? ""}`}
      >
        <SelectValue placeholder="Document type" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No type</SelectItem>
        {DOC_OPTIONS.map((item) => (
          <SelectItem key={item.key} value={item.key}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

interface PdfUploadSplitProps {
  employeeName?: string;
  /** Called with the typed parts when the user clicks "Save to employee". */
  onSave?: (parts: SplitResultPart[]) => void;
}

export default function PdfUploadSplit({
  employeeName = "",
  onSave,
}: PdfUploadSplitProps) {
  const firstInputRef = useRef<HTMLInputElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  const [sources, setSources] = useState<Record<string, SourceFile>>({});
  const [pages, setPages] = useState<PageItem[]>([]);
  const [isReading, setIsReading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Right panel
  const [tab, setTab] = useState<"range" | "pages">("pages");
  const [extractMode, setExtractMode] = useState<"all" | "select">("all");
  const [mergeSelected, setMergeSelected] = useState(false);
  const [mergeType, setMergeType] = useState<TypeValue>("none");
  const [rangeRows, setRangeRows] = useState<RangeRow[]>([
    { id: newId(), type: "none", range: "" },
  ]);

  const [error, setError] = useState("");
  const [isSplitting, setIsSplitting] = useState(false);
  const [results, setResults] = useState<ResultPart[]>([]);
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(
    null
  );

  // Free result URLs when replaced / unmounted
  const resultUrlsRef = useRef<string[]>([]);
  useEffect(() => {
    resultUrlsRef.current = results.map((item) => item.blobUrl);
  }, [results]);
  useEffect(
    () => () => resultUrlsRef.current.forEach((url) => URL.revokeObjectURL(url)),
    []
  );

  const clearResults = () => {
    results.forEach((item) => URL.revokeObjectURL(item.blobUrl));
    setResults([]);
  };

  const selectedPages = useMemo(
    () => pages.filter((page) => page.selected),
    [pages]
  );

  /* ---------- add PDFs (first upload and "add more") ---------- */

  const renderThumbnails = async (
    bytes: ArrayBuffer,
    items: { id: string; srcIndex: number }[]
  ) => {
    // pdf.js transfers the buffer to its worker, so give it a copy
    const loadingTask = pdfjsLib.getDocument({ data: bytes.slice(0) });
    const doc = await loadingTask.promise;
    try {
      for (const item of items) {
        const page = await doc.getPage(item.srcIndex + 1);
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: 260 / base.width });
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const context = canvas.getContext("2d");
        if (!context) continue;
        context.fillStyle = "#fff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({
          canvasContext: context,
          viewport,
          canvas,
        } as never).promise;
        const thumb = canvas.toDataURL("image/jpeg", 0.75);
        setPages((previous) =>
          previous.map((entry) =>
            entry.id === item.id ? { ...entry, thumb } : entry
          )
        );
      }
    } finally {
      if (typeof loadingTask.destroy === "function") {
        loadingTask.destroy();
      }
    }
  };

  const addFiles = async (list: FileList | File[] | null) => {
    const files = Array.from(list ?? []);
    if (files.length === 0) return;
    setError("");

    const pdfs = files.filter(
      (file) => file.type === "application/pdf" || /\.pdf$/i.test(file.name)
    );
    if (pdfs.length === 0) {
      setError("Please choose PDF files.");
      return;
    }
    if (pdfs.length < files.length) {
      setError("Some files were skipped because they are not PDFs.");
    }

    clearResults();
    setIsReading(true);
    try {
      for (const file of pdfs) {
        try {
          const bytes = await file.arrayBuffer();
          const probe = await pdfjsLib.getDocument({ data: bytes.slice(0) })
            .promise;
          const total = probe.numPages;


          const srcId = newId();
          const entries: PageItem[] = Array.from({ length: total }, (_, i) => ({
            id: newId(),
            srcId,
            srcIndex: i,
            srcName: file.name,
            thumb: "",
            selected: true,
            type: "none",
          }));

          setSources((previous) => ({
            ...previous,
            [srcId]: { name: file.name, bytes },
          }));
          setPages((previous) => [...previous, ...entries]);

          // Thumbnails fill in one by one without blocking the UI
          void renderThumbnails(
            bytes,
            entries.map(({ id, srcIndex }) => ({ id, srcIndex }))
          ).catch(() => undefined);
        } catch (fileError) {
          setError(
            `Could not open "${file.name}"${
              fileError instanceof Error ? `: ${fileError.message}` : ""
            }`
          );
        }
      }
    } finally {
      setIsReading(false);
      if (firstInputRef.current) firstInputRef.current.value = "";
      if (addInputRef.current) addInputRef.current.value = "";
    }
  };

  /* ---------- page actions ---------- */

  const togglePage = (id: string) => {
    setError("");
    setPages((previous) =>
      previous.map((page) =>
        page.id === id ? { ...page, selected: !page.selected } : page
      )
    );
  };

  const removePage = (id: string) => {
    setError("");
    setPages((previous) => previous.filter((page) => page.id !== id));
  };

  const setPageType = (id: string, type: TypeValue) =>
    setPages((previous) =>
      previous.map((page) => (page.id === id ? { ...page, type } : page))
    );

  const selectAll = (value: boolean) =>
    setPages((previous) => previous.map((page) => ({ ...page, selected: value })));

  const resetAll = () => {
    clearResults();
    setPages([]);
    setSources({});
    setError("");
    setExtractMode("all");
    setMergeSelected(false);
    setMergeType("none");
    setRangeRows([{ id: newId(), type: "none", range: "" }]);
  };

  /* ---------- range rows ---------- */

  const updateRangeRow = (id: string, patch: Partial<RangeRow>) => {
    setError("");
    setRangeRows((previous) =>
      previous.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
  };

  /* ---------- how many PDFs will be created ---------- */

  const outputCount = useMemo(() => {
    if (tab === "range") return rangeRows.length;
    if (extractMode === "all") return pages.length;
    if (mergeSelected) return selectedPages.length > 0 ? 1 : 0;
    return selectedPages.length;
  }, [tab, rangeRows.length, extractMode, pages.length, mergeSelected, selectedPages.length]);

  /* ---------- split ---------- */

  const buildGroups = (): Group[] => {
    const typed = (type: TypeValue) => (type === "none" ? undefined : type);

    if (tab === "range") {
      return rangeRows.map((row, index) => {
        const indexes = parseRange(row.range, pages.length);
        const key = typed(row.type);
        return {
          pages: indexes.map((i) => pages[i]),
          key,
          label: key ? labelOf(key) : `Part ${index + 1}`,
        };
      });
    }

    if (extractMode === "all") {
      return pages.map((page, index) => {
        const key = typed(page.type);
        return {
          pages: [page],
          key,
          label: key ? labelOf(key) : `Page ${index + 1}`,
        };
      });
    }

    if (selectedPages.length === 0) {
      throw new Error("Select at least one page.");
    }

    if (mergeSelected) {
      const key = typed(mergeType);
      return [
        {
          pages: selectedPages,
          key,
          label: key ? labelOf(key) : "Selected pages",
        },
      ];
    }

    return selectedPages.map((page) => {
      const key = typed(page.type);
      const number = pages.indexOf(page) + 1;
      return { pages: [page], key, label: key ? labelOf(key) : `Page ${number}` };
    });
  };

  const handleSplit = async () => {
    setError("");
    if (pages.length === 0) {
      setError("Upload a PDF first.");
      return;
    }

    try {
      setIsSplitting(true);
      const groups = buildGroups();
      if (groups.length === 0) throw new Error("Nothing to split.");

      // Load each source once
      const loaded = new Map<string, PDFDocument>();
      const getSource = async (srcId: string) => {
        let doc = loaded.get(srcId);
        if (!doc) {
          doc = await PDFDocument.load(sources[srcId].bytes, {
            ignoreEncryption: true,
          });
          loaded.set(srcId, doc);
        }
        return doc;
      };

      const built: ResultPart[] = [];
      for (const group of groups) {
        const output = await PDFDocument.create();
        for (const page of group.pages) {
          const source = await getSource(page.srcId);
          const [copied] = await output.copyPages(source, [page.srcIndex]);
          output.addPage(copied);
        }
        const saved = await output.save();
        const blob = new Blob([saved as BlobPart], { type: "application/pdf" });
        built.push({
          id: newId(),
          key: group.key,
          label: group.label,
          pages: group.pages.length,
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

  /* ---------- results ---------- */

  const fileBase = (
    employeeName ||
    Object.values(sources)[0]?.name.replace(/\.pdf$/i, "") ||
    "document"
  ).replace(/[^\w\-]+/g, "_");

  const downloadOne = (item: ResultPart) => {
    const link = document.createElement("a");
    link.href = item.blobUrl;
    link.download = `${fileBase}_${item.label.replace(/[^\w\-]+/g, "_")}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const typedResults = results.filter((item) => item.key);
  const duplicateTypes = new Set(
    typedResults
      .map((item) => item.key as DocKey)
      .filter((key, index, all) => all.indexOf(key) !== index)
  );

  const saveToEmployee = () => {
    if (typedResults.length === 0) {
      setError("Choose a document type for at least one file before saving.");
      return;
    }
    // If a type appears twice, the later file wins (one slot per type)
    onSave?.(
      typedResults.map((item) => ({
        key: item.key as DocKey,
        dataUrl: item.dataUrl,
      }))
    );
    resetAll();
  };

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */

  const hiddenInputs = (
    <>
      <input
        ref={firstInputRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        className="hidden"
        onChange={(event) => void addFiles(event.target.files)}
      />
      <input
        ref={addInputRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        className="hidden"
        onChange={(event) => void addFiles(event.target.files)}
      />
    </>
  );

  const previewDialog = (
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
  );

  const shell = "min-h-screen w-full bg-[#f5f5fa]";
  const font = {
    fontFamily: "'Montserrat', ui-sans-serif, system-ui, sans-serif",
  };

  /* ---------- Screen 1: nothing uploaded yet ---------- */

  if (pages.length === 0 && results.length === 0) {
    return (
      <div className={`${shell} p-4 md:p-8`} style={font}>
        {hiddenInputs}
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Split PDF
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Upload one combined PDF, then pick the pages for each document.
              {employeeName ? ` Employee: ${employeeName}.` : ""}
            </p>
          </div>

          <button
            type="button"
            onClick={() => firstInputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              void addFiles(event.dataTransfer.files);
            }}
            className={`flex w-full flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed bg-white px-6 py-16 text-center shadow-sm transition ${
              isDragging
                ? "border-[#e5322d] bg-red-50"
                : "border-slate-300 hover:border-slate-400"
            }`}
          >
            <span
              className="flex h-14 w-14 items-center justify-center rounded-2xl text-white"
              style={{ backgroundColor: RED }}
            >
              <Upload className="h-7 w-7" />
            </span>
            <span className="text-base font-semibold text-slate-800">
              {isReading ? "Reading PDF..." : "Select PDF file"}
            </span>
            <span className="text-xs text-slate-400">
              or drop it here. Everything stays in your browser.
            </span>
          </button>

          {error && <p className="text-center text-xs text-rose-600">{error}</p>}
        </div>
        {previewDialog}
      </div>
    );
  }

  /* ---------- Screen 3: results ---------- */

  if (results.length > 0) {
    return (
      <div className={`${shell} p-4 md:p-8`} style={font}>
        {hiddenInputs}
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Your PDFs are ready
              </h1>
              <p className="text-sm text-slate-500">
                {results.length} file{results.length === 1 ? "" : "s"} created
                {employeeName ? ` for ${employeeName}` : ""}.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  clearResults();
                  setError("");
                }}
              >
                <ArrowLeft className="h-4 w-4" /> Back to pages
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => results.forEach(downloadOne)}
              >
                <Download className="h-4 w-4" /> Download all
              </Button>
              {onSave && (
                <Button
                  className="gap-2 text-white hover:brightness-110"
                  style={{ backgroundColor: RED }}
                  onClick={saveToEmployee}
                >
                  <Save className="h-4 w-4" /> Save to employee
                </Button>
              )}
            </div>
          </div>

          {error && <p className="text-xs text-rose-600">{error}</p>}
          {onSave && duplicateTypes.size > 0 && (
            <p className="text-xs text-amber-700">
              More than one file has the same type. Only the last one of each
              type is saved to the employee.
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((item, index) => {
              const accent = ACCENTS[index % ACCENTS.length];
              return (
                <Card
                  key={item.id}
                  className="flex flex-col rounded-3xl border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div
                    className="relative h-32 w-full overflow-hidden rounded-2xl"
                    style={{ backgroundColor: accent.soft }}
                  >
                    <div className="absolute left-0 top-0 z-10 max-w-[70%] truncate rounded-br-xl bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
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
                      {item.pages} page{item.pages === 1 ? "" : "s"} ·{" "}
                      {formatSize(item.size)}
                    </p>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                      style={{ backgroundColor: accent.main }}
                    >
                      {item.key ? "Typed" : "No type"}
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
        </div>
        {previewDialog}
      </div>
    );
  }

  /* ---------- Screen 2: pages + Split panel (like the reference) ---------- */

  const isSelectable = tab === "pages" && extractMode === "select";
  const sourceCount = Object.keys(sources).length;

  return (
    <div className={`${shell} flex flex-col lg:flex-row`} style={font}>
      {hiddenInputs}

      {/* Left: page grid */}
      <div className="min-w-0 flex-1 p-4 md:p-8">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {pages.length} page{pages.length === 1 ? "" : "s"}
            </h1>
            <p className="truncate text-xs text-slate-500">
              {sourceCount} PDF file{sourceCount === 1 ? "" : "s"}
              {employeeName ? ` · ${employeeName}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isSelectable && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => selectAll(true)}
                >
                  Select all
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => selectAll(false)}
                >
                  Clear
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => addInputRef.current?.click()}
            >
              <Plus className="h-3.5 w-3.5" />
              {isReading ? "Reading..." : "Add PDF"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              onClick={resetAll}
            >
              <X className="h-3.5 w-3.5" /> Remove all
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {pages.map((page, index) => {
            const dimmed = isSelectable && !page.selected;
            const showCheck = tab === "pages" && (extractMode === "all" || page.selected);
            return (
              <div key={page.id} className="relative">
                {/* check mark */}
                {showCheck && (
                  <span className="pointer-events-none absolute -left-2 -top-2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow">
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </span>
                )}

                {/* remove this page */}
                <button
                  type="button"
                  onClick={() => removePage(page.id)}
                  title={`Remove page ${index + 1}`}
                  className="absolute -right-2 -top-2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-white text-rose-600 shadow ring-1 ring-slate-200 transition hover:bg-rose-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>

                <div
                  role={isSelectable ? "button" : undefined}
                  tabIndex={isSelectable ? 0 : undefined}
                  onClick={isSelectable ? () => togglePage(page.id) : undefined}
                  onKeyDown={
                    isSelectable
                      ? (event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            togglePage(page.id);
                          }
                        }
                      : undefined
                  }
                  className={`flex flex-col items-center rounded-2xl bg-white p-3 shadow-[0_5px_30px_rgba(22,22,22,0.1)] transition ${
                    isSelectable ? "cursor-pointer hover:-translate-y-0.5" : ""
                  } ${dimmed ? "opacity-40" : ""}`}
                  style={{ outlineOffset: -2 }}
                >
                  <div className="flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-lg bg-slate-50 ring-1 ring-slate-100">
                    {page.thumb ? (
                      <img
                        src={page.thumb}
                        alt={`Page ${index + 1}`}
                        className="h-full w-full object-contain"
                        draggable={false}
                      />
                    ) : (
                      <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                    )}
                  </div>

                  <p
                    className="mt-2 max-w-full truncate text-xs text-sky-700"
                    title={`${page.srcName} - page ${page.srcIndex + 1}`}
                  >
                    {index + 1}
                  </p>

                  {tab === "pages" && (
                    <div
                      className="mt-1.5 w-full"
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                    >
                      <TypeSelect
                        compact
                        value={page.type}
                        onChange={(value) => setPageType(page.id, value)}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Add more pages from another PDF */}
          <button
            type="button"
            onClick={() => addInputRef.current?.click()}
            className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white/60 text-slate-500 transition hover:border-slate-400 hover:bg-white"
          >
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: RED }}
            >
              <Plus className="h-5 w-5" />
            </span>
            <span className="text-xs font-semibold">Add PDF</span>
          </button>
        </div>
      </div>

      {/* Right: Split panel */}
      <aside className="flex w-full shrink-0 flex-col border-t border-slate-200 bg-white lg:sticky lg:top-0 lg:h-screen lg:w-[380px] lg:border-l lg:border-t-0">
        <h2 className="border-b border-slate-200 py-4 text-center text-lg font-bold text-slate-800">
          Split
        </h2>

        {/* Tabs */}
        <div className="grid grid-cols-2 border-b border-slate-200">
          {(
            [
              { id: "range", label: "Range", Icon: Scissors },
              { id: "pages", label: "Pages", Icon: FileText },
            ] as const
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setTab(id);
                setError("");
              }}
              className={`flex flex-col items-center gap-1 py-4 text-sm font-medium transition ${
                tab === id
                  ? "bg-white text-slate-900"
                  : "bg-slate-50 text-slate-400 hover:text-slate-600"
              }`}
              style={tab === id ? { boxShadow: `inset 0 -3px 0 ${RED}` } : undefined}
            >
              <Icon className="h-6 w-6" />
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {tab === "pages" ? (
            <>
              <p className="text-sm font-semibold text-slate-800">Extract mode:</p>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    { id: "all", label: "Extract all pages" },
                    { id: "select", label: "Select pages" },
                  ] as const
                ).map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => {
                      setExtractMode(mode.id);
                      setError("");
                    }}
                    className={`rounded-lg px-3 py-4 text-sm font-medium transition ${
                      extractMode === mode.id
                        ? "border-2 bg-white"
                        : "border-2 border-transparent bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                    style={
                      extractMode === mode.id
                        ? { borderColor: RED, color: RED }
                        : undefined
                    }
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              {extractMode === "select" && (
                <div className="space-y-3 rounded-xl border border-slate-200 p-3">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={mergeSelected}
                      onChange={(event) => setMergeSelected(event.target.checked)}
                      className="h-4 w-4 accent-[#e5322d]"
                    />
                    Merge selected pages into one PDF
                  </label>
                  {mergeSelected && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-500">
                        Save merged file as
                      </p>
                      <TypeSelect
                        value={mergeType}
                        onChange={setMergeType}
                        className="w-full"
                      />
                    </div>
                  )}
                  <p className="text-xs text-slate-400">
                    Click a page on the left to select or unselect it.
                  </p>
                </div>
              )}

              <p className="text-xs text-slate-400">
                Tip: use the type menu under each page so it can be saved to the
                right employee document.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-slate-800">
                Custom ranges
              </p>
              <p className="text-xs text-slate-500">
                Type page numbers like <strong>1</strong>, <strong>1-2</strong>{" "}
                or <strong>1,3,5</strong>. You have {pages.length} page
                {pages.length === 1 ? "" : "s"}.
              </p>

              <div className="space-y-2">
                {rangeRows.map((row, index) => (
                  <div
                    key={row.id}
                    className="space-y-2 rounded-xl border border-slate-200 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">
                        Range {index + 1}
                      </span>
                      {rangeRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setRangeRows((previous) =>
                              previous.filter((entry) => entry.id !== row.id)
                            )
                          }
                          className="text-rose-600 hover:text-rose-700"
                          title="Remove range"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <Input
                      placeholder="Pages, e.g. 1-2"
                      value={row.range}
                      onChange={(event) =>
                        updateRangeRow(row.id, { range: event.target.value })
                      }
                    />
                    <TypeSelect
                      value={row.type}
                      onChange={(value) => updateRangeRow(row.id, { type: value })}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full gap-1.5"
                onClick={() =>
                  setRangeRows((previous) => [
                    ...previous,
                    { id: newId(), type: "none", range: "" },
                  ])
                }
              >
                <Plus className="h-4 w-4" /> Add range
              </Button>
            </>
          )}

          {/* Info box */}
          <div className="flex items-start gap-2 rounded-lg border border-sky-300 bg-sky-50 p-3 text-sm text-slate-700">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
            <p>
              {tab === "pages" && extractMode === "select" && !mergeSelected
                ? "Selected pages will be converted into separate PDF files. "
                : tab === "pages" && extractMode === "select"
                ? "Selected pages will be merged into one PDF file. "
                : tab === "pages"
                ? "Every page will be converted into a separate PDF file. "
                : "Each range will become its own PDF file. "}
              <strong>
                {outputCount} PDF{outputCount === 1 ? "" : "s"}
              </strong>{" "}
              will be created.
            </p>
          </div>

          {error && <p className="text-xs text-rose-600">{error}</p>}
        </div>

        <div className="p-5 pt-0">
          <button
            type="button"
            onClick={() => void handleSplit()}
            disabled={isSplitting || outputCount === 0 || isReading}
            className="flex h-16 w-full items-center justify-center gap-3 rounded-xl text-xl font-bold text-white shadow-[0_5px_30px_rgba(22,22,22,0.15)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: RED }}
          >
            {isSplitting ? "Splitting..." : "Split PDF"}
            {!isSplitting && <ArrowRight className="h-6 w-6" />}
          </button>
        </div>
      </aside>

      {previewDialog}
    </div>
  );
}
