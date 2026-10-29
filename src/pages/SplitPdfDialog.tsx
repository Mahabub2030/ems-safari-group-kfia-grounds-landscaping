import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Scissors, Trash2 } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { useEffect, useState } from "react";




export interface SplitDocOption {
  key: string;
  label: string;
  exists: boolean; // true if this employee already has this document
}

export interface SplitResultPart {
  key: string;
  dataUrl: string;
}

interface Props {
  open: boolean;
  employeeName: string;
  options: SplitDocOption[];
  /** A PDF chosen in the upload dialog: it is split automatically, one part per page */
  initialFile?: File | null;
  onClose: () => void;
  onSave: (parts: SplitResultPart[]) => void;
}

interface Row {
  id: number;
  key: string; // document type, or SKIP
  range: string; // e.g. "1-2, 5"
}

const SKIP = "__skip__";

// "1-2, 5" -> [0, 1, 4]  (zero-based). Throws on invalid input.
const parseRange = (text: string, pageCount: number): number[] => {
  const result: number[] = [];
  const pieces = text.split(",").map((p) => p.trim()).filter(Boolean);
  if (pieces.length === 0) throw new Error("Enter pages, e.g. 1-2");
  for (const piece of pieces) {
    const match = piece.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!match) throw new Error(`"${piece}" is not a valid page range`);
    const from = Number(match[1]);
    const to = match[2] ? Number(match[2]) : from;
    if (from < 1 || to < from || to > pageCount) {
      throw new Error(`Pages must be between 1 and ${pageCount}`);
    }
    for (let p = from; p <= to; p++) result.push(p - 1);
  }
  return result;
};

export default function SplitPdfDialog({
  open,
  employeeName,
  options,
  initialFile,
  onClose,
  onSave,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [bytes, setBytes] = useState<ArrayBuffer | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setFile(null);
    setBytes(null);
    setPageCount(0);
    setRows([]);
    setError("");
    setBusy(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  // New parts default to Iqama, then Passport, then GACA, then the rest
  const orderedOptions = (): SplitDocOption[] => {
    const preferred = ["iqama", "passport", "gacaCertificate"];
    return [
      ...(preferred
        .map((k) => options.find((o) => o.key === k))
        .filter(Boolean) as SplitDocOption[]),
      ...options.filter((o) => !preferred.includes(o.key)),
    ];
  };

  const nextUnusedKey = (used: string[], fallback = SKIP) =>
    orderedOptions().find((o) => !used.includes(o.key))?.key ?? fallback;

  // Read the PDF and create ONE row per page (4 pages -> 4 rows)
  const handleFile = async (selected: File | null) => {
    reset();
    if (!selected) return;
    setBusy(true);
    try {
      const buffer = await selected.arrayBuffer();
      const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const count = pdf.getPageCount();
      const used: string[] = [];
      const autoRows: Row[] = [];
      for (let page = 1; page <= count; page++) {
        // Pages beyond the number of document types are skipped by default
        const key = nextUnusedKey(used);
        if (key !== SKIP) used.push(key);
        autoRows.push({ id: page, key, range: String(page) });
      }
      setFile(selected);
      setBytes(buffer);
      setPageCount(count);
      setRows(autoRows);
    } catch {
      setError("Could not read this PDF. Is it a valid, unlocked PDF file?");
    } finally {
      setBusy(false);
    }
  };

  // When the upload dialog hands over a PDF, split it automatically
  useEffect(() => {
    if (open && initialFile) void handleFile(initialFile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialFile]);

  const oneFilePerPage = () => {
    if (!bytes) return;
    const used: string[] = [];
    setRows(
      Array.from({ length: pageCount }, (_, i) => {
        const key = nextUnusedKey(used);
        if (key !== SKIP) used.push(key);
        return { id: i + 1, key, range: String(i + 1) };
      })
    );
    setError("");
  };

  const allPagesOneFile = () => {
    if (!bytes) return;
    setRows([
      {
        id: Date.now(),
        key: nextUnusedKey([], options[0]?.key ?? SKIP),
        range: pageCount > 1 ? `1-${pageCount}` : "1",
      },
    ]);
    setError("");
  };

  const addRow = () =>
    setRows((prev) => [
      ...prev,
      {
        id: Date.now(),
        key: nextUnusedKey(prev.map((r) => r.key)),
        range: "",
      },
    ]);

  const updateRow = (id: number, patch: Partial<Row>) => {
    setError("");
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeRow = (id: number) =>
    setRows((prev) => prev.filter((r) => r.id !== id));

  const handleSplit = async () => {
    if (!bytes) return;
    const active = rows.filter((r) => r.key !== SKIP);
    if (active.length === 0) {
      setError("Choose a document type for at least one page.");
      return;
    }
    const keys = active.map((r) => r.key);
    if (new Set(keys).size !== keys.length) {
      setError("Each part needs a different document type.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const source = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const parts: SplitResultPart[] = [];
      for (const row of active) {
        const indices = parseRange(row.range, pageCount);
        const out = await PDFDocument.create();
        const copied = await out.copyPages(source, indices);
        copied.forEach((page) => out.addPage(page));
        const dataUrl = await out.saveAsBase64({ dataUri: true });
        parts.push({ key: row.key, dataUrl });
      }
      onSave(parts);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Split failed");
      setBusy(false);
    }
  };

  const labelOf = (key: string) =>
    options.find((o) => o.key === key)?.label ?? key;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="h-4 w-4" /> Split PDF
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {employeeName || "Unnamed Employee"} — the PDF is split into one
            file per page. Change the document type of any page, then save.
          </p>

          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-slate-600">
              Combined PDF
            </p>
            <Input
              type="file"
              accept="application/pdf"
              onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
            />
            {file && (
              <p className="text-xs text-slate-500">
                {file.name} — {pageCount} page{pageCount === 1 ? "" : "s"}
              </p>
            )}
          </div>

          {rows.length > 0 && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-600">
                  Parts (pages like 3 or 1-2 or 1,3,5)
                </p>
                <div className="flex gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-[11px]"
                    onClick={oneFilePerPage}
                  >
                    One file per page
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-[11px]"
                    onClick={allPagesOneFile}
                  >
                    Keep as one file
                  </Button>
                </div>
              </div>

              {rows.map((row) => {
                const exists =
                  row.key !== SKIP &&
                  options.find((o) => o.key === row.key)?.exists;
                return (
                  <div key={row.id} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-14 shrink-0 text-[11px] font-semibold text-slate-500">
                        Page {row.range || "?"}
                      </span>
                      <Select
                        value={row.key}
                        onValueChange={(v) => updateRow(row.id, { key: v })}
                      >
                        <SelectTrigger className="w-[170px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {options.map((o) => {
                            const usedElsewhere = rows.some(
                              (r) => r.id !== row.id && r.key === o.key
                            );
                            return (
                              <SelectItem
                                key={o.key}
                                value={o.key}
                                disabled={usedElsewhere}
                              >
                                {o.label}
                                {usedElsewhere ? " (already used)" : ""}
                              </SelectItem>
                            );
                          })}
                          <SelectItem value={SKIP}>Skip (don't save)</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        className="w-24"
                        placeholder="e.g. 1-2"
                        value={row.range}
                        onChange={(e) =>
                          updateRow(row.id, { range: e.target.value })
                        }
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 shrink-0 text-rose-600"
                        onClick={() => removeRow(row.id)}
                        title="Remove part"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {exists && (
                      <p className="pl-16 text-[11px] text-amber-600">
                        {labelOf(row.key)} already exists and will be replaced.
                      </p>
                    )}
                  </div>
                );
              })}
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={addRow}
              >
                <Plus className="h-3.5 w-3.5" /> Add part
              </Button>
            </div>
          )}

          {error && <p className="text-xs text-rose-600">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={busy || !bytes || rows.length === 0}
              onClick={() => void handleSplit()}
              className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <Scissors className="h-4 w-4" />
              {busy ? "Working..." : "Split & Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
