import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Filter, Search } from "lucide-react";
import React from "react";

export interface Column<T> {
  key: string;
  label: string;
  className?: string;
  hideOn?: "sm" | "md" | "lg";
  render?: (item: T, index: number) => React.ReactNode;
}

export interface FilterOption {
  label: string;
  value: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  rowKey: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  filterOptions?: FilterOption[];
  filterPlaceholder?: string;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  emptyMessage?: string;
  actions?: React.ReactNode;
}

export function DataTable<T>({
  data,
  columns,
  rowKey,
  onRowClick,
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  filterValue,
  onFilterChange,
  filterOptions = [],
  filterPlaceholder = "Filter",
  page,
  pageSize,
  total,
  onPageChange,
  emptyMessage = "No records found",
  actions,
}: DataTableProps<T>) {
  const totalPages = Math.ceil(total / pageSize) || 1;

  const hideClasses: Record<string, string> = {
    sm: "hidden sm:table-cell",
    md: "hidden md:table-cell",
    lg: "hidden lg:table-cell",
  };

  return (
    <div className="space-y-3 p-4">
      {/* Search Bar, Filters, and Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          {onSearchChange && (
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={search || ""}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>
          )}

          {onFilterChange && filterOptions.length > 0 && (
            <Select value={filterValue || "all"} onValueChange={onFilterChange}>
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <Filter className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                <SelectValue placeholder={filterPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {filterOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Main Table */}
      <div className="w-full overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead className="bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`p-3 ${col.hideOn ? hideClasses[col.hideOn] : ""} ${col.className || ""}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-xs">
            {data.length > 0 ? (
              data.map((item, idx) => (
                <tr
                  key={rowKey(item)}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={`hover:bg-muted/40 transition-colors ${onRowClick ? "cursor-pointer" : ""}`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`p-3 align-middle ${col.hideOn ? hideClasses[col.hideOn] : ""} ${col.className || ""}`}
                    >
                      {col.render
                        ? col.render(item, idx)
                        : String((item as Record<string, any>)[col.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="p-8 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1 pt-1">
        <div>
          Showing {total > 0 ? (page - 1) * pageSize + 1 : 0} to{" "}
          {Math.min(page * pageSize, total)} of {total} entries
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(Math.max(page - 1, 1))}
            disabled={page === 1}
            className="p-1.5 rounded border border-border disabled:opacity-40 hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-2 font-medium text-foreground">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(Math.min(page + 1, totalPages))}
            disabled={page === totalPages || totalPages === 0}
            className="p-1.5 rounded border border-border disabled:opacity-40 hover:bg-muted transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
