// src/pages/Dashboard.tsx
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { AppSidebar } from "@/components/app-sidebar";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import employeesData from "@/data/employees.json";
import expiryData from "@/data/Expiration.json";
import { computeStats, loadVacations } from "@/lib/Vacation data";
import documentsData from "@/data/Documents.json";
import { LeavesTable } from "@/pages/Dashboard/chartdata/Leaves table";
import { VacationChart } from "@/pages/Dashboard/chartdata/Vacation chart";

const getDaysRemaining = (expiryDateString?: string) => {
  if (!expiryDateString) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const match = /^\d{4}-\d{2}-\d{2}$/.exec(expiryDateString);
  if (!match) return null;

  const [year, month, day] = expiryDateString.split("-").map(Number);
  const expiry = new Date(year, month - 1, day);
  return Math.round((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

export default function Dashboard() {
 // Everything below is calculated from src/data/Vacations.json
 const records = useMemo(() => loadVacations(), []);
 const vacationStats = useMemo(() => {
  const stats = computeStats(records);
  return {
   total: stats.total,
   Pending: stats.counts.Pending,
   Cancelled: stats.counts.Cancelled,
   "On Leave": stats.counts["On Leave"],
  };
 }, [records]);
 const documentStats = useMemo(() => {
  const rows = Array.isArray(documentsData) ? documentsData : [];
  const total = rows.length;
  const available = rows.filter((row) => {
    const docs = (row as { docs?: Record<string, unknown> })?.docs ?? {};
    return !!docs && Object.keys(docs).length > 0;
  }).length;
  const iqama = rows.filter((row) => {
    const docs = (row as { docs?: Record<string, unknown> })?.docs ?? {};
    return Boolean(docs.iqama);
  }).length;
  const passport = rows.filter((row) => {
    const docs = (row as { docs?: Record<string, unknown> })?.docs ?? {};
    return Boolean(docs.passport);
  }).length;
  const gacaCertificate = rows.filter((row) => {
    const docs = (row as { docs?: Record<string, unknown> })?.docs ?? {};
    return Boolean(docs.gacaCertificate);
  }).length;
  const otherDocuments = rows.filter((row) => {
    const docs = (row as { docs?: Record<string, unknown> })?.docs ?? {};
    return Boolean(docs.others);
  }).length;

  return {
   total,
   available,
   iqama,
   passport,
   gacaCertificate,
   otherDocuments,
   missing: Math.max(total - available, 0),
  };
 }, []);
 const employeeStats = useMemo(() => {
  const employees = employeesData as Array<{ status?: string }>;
  const inactive = employees.filter((employee) => employee.status === "INACTIVE").length;
  const onLeave = employees.filter((employee) => employee.status === "ON_LEAVE").length;
  const active = employees.filter((employee) => employee.status === "ACTIVE").length;

  return {
   total: employees.length - inactive,
   active,
   onLeave,
   inactive,
  };
 }, []);

 const expiryStats = useMemo(() => {
  const rows = (Array.isArray(expiryData)
    ? expiryData
    : (expiryData as { data?: Array<Record<string, unknown>> })?.data ?? []) as Array<{
    dacoId?: string | null;
    iqamaExpiryDate?: string;
    dacoExpiryDate?: string;
  }>;
  const dacoIdCount = rows.filter(
    (row) => !!row.dacoId && String(row.dacoId).trim() !== "",
  ).length;
  const expiredIqama = rows.filter((row) => {
    const days = getDaysRemaining(row.iqamaExpiryDate);
    return days !== null && days < 0;
  }).length;
  const expiredDaco = rows.filter((row) => {
    const days = getDaysRemaining(row.dacoExpiryDate);
    return days !== null && days < 0;
  }).length;
  const validTotal = rows.filter((row) => {
    const iqamaDays = getDaysRemaining(row.iqamaExpiryDate);
    const dacoDays = getDaysRemaining(row.dacoExpiryDate);
    return (
      iqamaDays !== null &&
      dacoDays !== null &&
      iqamaDays >= 0 &&
      dacoDays >= 0
    );
  }).length;
  const applied = rows.length;
  const missing = rows.filter((row) => {
    return !row.dacoId || !row.dacoExpiryDate;
  }).length;

  return {
   total: rows.length,
   dacoIdCount,
   expiredIqama,
   expiredDaco,
   validTotal,
   applied,
   missing,
  };
 }, []);

 const workforceChartData = [
  { name: "Active", value: employeeStats.active, color: "#166534" },
  { name: "On Leave", value: employeeStats.onLeave, color: "#ca8a04" },
  { name: "Inactive", value: employeeStats.inactive, color: "#475569" },
 ];

 const employeeJobTitleRows = useMemo(() => {
  const rows = (employeesData as Array<{ jobTitle?: string; status?: string }>).reduce(
   (acc, employee) => {
    const label = (employee.jobTitle ?? "").trim() || "Other / unmatched titles";
    const key = label.toLowerCase();
    const current = acc.get(key) ?? {
     label,
     total: 0,
     active: 0,
     onLeave: 0,
     notFilled: 0,
    };

    current.total += 1;
    const status = (employee.status ?? "").trim().toUpperCase();

    if (status === "ACTIVE") current.active += 1;
    else if (status === "ON_LEAVE") current.onLeave += 1;
    else current.notFilled += 1;

    acc.set(key, current);
    return acc;
   },
   new Map<string, { label: string; total: number; active: number; onLeave: number; notFilled: number }>(),
  );

  const summary = Array.from(rows.values()).map((row) => ({
   ...row,
   activePercent: row.total > 0 ? (row.active / row.total) * 100 : 0,
  }));

  const totals = summary.reduce(
   (acc, row) => {
    acc.total += row.total;
    acc.active += row.active;
    acc.onLeave += row.onLeave;
    acc.notFilled += row.notFilled;
    return acc;
   },
   { total: 0, active: 0, onLeave: 0, notFilled: 0 },
  );

  return {
   rows: [...summary].sort((a, b) => b.total - a.total),
   total: totals.total,
   active: totals.active,
   onLeave: totals.onLeave,
   notFilled: totals.notFilled,
   activePercent: totals.total > 0 ? (totals.active / totals.total) * 100 : 0,
  };
 }, []);

 const employeeGroupRows = useMemo(() => {
  const rows = (employeesData as Array<{ group?: string; status?: string }>).reduce(
   (acc, employee) => {
    const label = (employee.group ?? "").trim() || "Other / unmatched groups";
    const key = label.toLowerCase();
    const current = acc.get(key) ?? {
     label,
     total: 0,
     active: 0,
     onLeave: 0,
     notFilled: 0,
    };

    current.total += 1;
    const status = (employee.status ?? "").trim().toUpperCase();

    if (status === "ACTIVE") current.active += 1;
    else if (status === "ON_LEAVE") current.onLeave += 1;
    else current.notFilled += 1;

    acc.set(key, current);
    return acc;
   },
   new Map<string, { label: string; total: number; active: number; onLeave: number; notFilled: number }>(),
  );

  const summary = Array.from(rows.values()).map((row) => ({
   ...row,
   activePercent: row.total > 0 ? (row.active / row.total) * 100 : 0,
  }));

  const totals = summary.reduce(
   (acc, row) => {
    acc.total += row.total;
    acc.active += row.active;
    acc.onLeave += row.onLeave;
    acc.notFilled += row.notFilled;
    return acc;
   },
   { total: 0, active: 0, onLeave: 0, notFilled: 0 },
  );

  return {
   rows: [...summary].sort((a, b) => b.total - a.total),
   total: totals.total,
   active: totals.active,
   onLeave: totals.onLeave,
   notFilled: totals.notFilled,
   activePercent: totals.total > 0 ? (totals.active / totals.total) * 100 : 0,
  };
 }, []);

 return (
  <SidebarProvider
   style={
    {
     "--sidebar-width": "calc(var(--spacing) * 72)",
     "--header-height": "calc(var(--spacing) * 12)",
    } as React.CSSProperties
   }
  >
   <AppSidebar variant="inset" />
   <SidebarInset>
    <SiteHeader />
    <div className="flex flex-1 flex-col bg-[#f4f4f4]">
     <div className="@container/main flex flex-1 flex-col gap-2 p-2 sm:p-3 lg:p-4">
      <div className="flex flex-col gap-4 py-2 md:gap-6 md:py-4">
       <div className="rounded-[16px] border-[2px] border-[#1f3a2b] bg-[#f3f3f3] p-3 sm:p-4 shadow-[0_0_0_1px_rgba(31,58,43,0.15)]">
        <div className="mb-3 flex items-center justify-between gap-3">
         <div>
          <h1 className="text-[22px] font-extrabold tracking-tight text-[#1b2d23]">
           Grounds & Landscaping Department - Manpower Dashboard
          </h1>
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#4d5a52]">
           Live overview of workforce, leaves and document validity
          </p>
         </div>
         <div className="rounded-full border border-[#1f3a2b] bg-[#1f3a2b] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
           updated live
         </div>
        </div>
       </div>
       <SectionCards stats={employeeStats} expiryStats={expiryStats} vacationStats={vacationStats} documentStats={documentStats} />
       <div className="grid gap-4 px-2 sm:px-4 lg:grid-cols-[1.2fr_0.8fr] lg:px-6">
        <VacationChart records={records} />
        <div className="rounded-[16px] border-[2px] border-[#1f3a2b] bg-[#f3f3f3] p-3 sm:p-4 shadow-[0_0_0_1px_rgba(31,58,43,0.15)]">
         <div className="mb-4 flex items-center justify-between">
          <div>
           <h3 className="text-lg font-extrabold text-[#1b2d23]">Manpower Overview</h3>
           <p className="text-xs text-[#4d5a52]">Employee status distribution</p>
          </div>
          <span className="rounded-full border border-[#1f3a2b] bg-[#eaf4ee] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#1f3a2b]">
           {employeeStats.total} active total
          </span>
         </div>
         <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
           <BarChart data={workforceChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(31,58,43,0.18)" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#475569", fontSize: 12 }} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#475569", fontSize: 12 }} />
            <Tooltip
              cursor={{ fill: "rgba(31,58,43,0.06)" }}
              formatter={(value) => [String(value ?? 0), "Employees"]}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
             {workforceChartData.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
             ))}
            </Bar>
           </BarChart>
          </ResponsiveContainer>
         </div>
        </div>
       </div>

       <div className="px-2 sm:px-4 lg:px-6">
        <div className="space-y-4">
         <div className="overflow-hidden rounded-[10px] border-[2px] border-[#1f3a2b] bg-[#f5f5f5] shadow-[0_0_0_1px_rgba(31,58,43,0.15)]">
          <div className="bg-[#1f3a2b] px-3 py-2 text-base font-extrabold text-white">
           Employees by Job Title
          </div>
          <div className="overflow-x-auto">
           <table className="min-w-[720px] w-full border-collapse text-left text-[12px] text-[#1c2a22]">
            <thead>
             <tr className="bg-[#2f4f42] text-[11px] font-bold uppercase tracking-[0.08em] text-white">
              <th className="border border-[#1f3a2b] px-2 py-2">Job Title</th>
              <th className="border border-[#1f3a2b] px-2 py-2 text-center">Total</th>
              <th className="border border-[#1f3a2b] px-2 py-2 text-center">Active</th>
              <th className="border border-[#1f3a2b] px-2 py-2 text-center">On Vacation</th>
              <th className="border border-[#1f3a2b] px-2 py-2 text-center">Status Not Filled</th>
              <th className="border border-[#1f3a2b] px-2 py-2 text-center">Active %</th>
             </tr>
            </thead>
            <tbody>
             {employeeJobTitleRows.rows.map((row) => (
              <tr key={row.label} className="bg-[#f7f7f7] text-[12px]">
               <td className="border border-[#1f3a2b] px-2 py-1.5 font-medium">{row.label}</td>
               <td className="border border-[#1f3a2b] px-2 py-1.5 text-center">{row.total}</td>
               <td className="border border-[#1f3a2b] px-2 py-1.5 text-center">{row.active}</td>
               <td className="border border-[#1f3a2b] px-2 py-1.5 text-center">{row.onLeave}</td>
               <td className="border border-[#1f3a2b] px-2 py-1.5 text-center">{row.notFilled}</td>
               <td className="border border-[#1f3a2b] px-2 py-1.5 text-center">{row.activePercent.toFixed(1)}%</td>
              </tr>
             ))}
             <tr className="bg-[#2a7d4d] font-bold text-white">
              <td className="border border-[#1f3a2b] px-2 py-2">TOTAL</td>
              <td className="border border-[#1f3a2b] px-2 py-2 text-center">{employeeJobTitleRows.total}</td>
              <td className="border border-[#1f3a2b] px-2 py-2 text-center">{employeeJobTitleRows.active}</td>
              <td className="border border-[#1f3a2b] px-2 py-2 text-center">{employeeJobTitleRows.onLeave}</td>
              <td className="border border-[#1f3a2b] px-2 py-2 text-center">{employeeJobTitleRows.notFilled}</td>
              <td className="border border-[#1f3a2b] px-2 py-2 text-center">{employeeJobTitleRows.activePercent.toFixed(1)}%</td>
             </tr>
            </tbody>
           </table>
          </div>
         </div>

         <div className="overflow-hidden rounded-[10px] border-[2px] border-[#1f3a2b] bg-[#f5f5f5] shadow-[0_0_0_1px_rgba(31,58,43,0.15)]">
          <div className="bg-[#1f3a2b] px-3 py-2 text-base font-extrabold text-white">
           Employees by Group
          </div>
          <div className="overflow-x-auto">
           <table className="min-w-[720px] w-full border-collapse text-left text-[12px] text-[#1c2a22]">
            <thead>
             <tr className="bg-[#2f4f42] text-[11px] font-bold uppercase tracking-[0.08em] text-white">
              <th className="border border-[#1f3a2b] px-2 py-2">Group</th>
              <th className="border border-[#1f3a2b] px-2 py-2 text-center">Total</th>
              <th className="border border-[#1f3a2b] px-2 py-2 text-center">Active</th>
              <th className="border border-[#1f3a2b] px-2 py-2 text-center">On Vacation</th>
              <th className="border border-[#1f3a2b] px-2 py-2 text-center">Status Not Filled</th>
              <th className="border border-[#1f3a2b] px-2 py-2 text-center">Active %</th>
             </tr>
            </thead>
            <tbody>
             {employeeGroupRows.rows.map((row) => (
              <tr key={row.label} className="bg-[#f7f7f7] text-[12px]">
               <td className="border border-[#1f3a2b] px-2 py-1.5 font-medium">{row.label}</td>
               <td className="border border-[#1f3a2b] px-2 py-1.5 text-center">{row.total}</td>
               <td className="border border-[#1f3a2b] px-2 py-1.5 text-center">{row.active}</td>
               <td className="border border-[#1f3a2b] px-2 py-1.5 text-center">{row.onLeave}</td>
               <td className="border border-[#1f3a2b] px-2 py-1.5 text-center">{row.notFilled}</td>
               <td className="border border-[#1f3a2b] px-2 py-1.5 text-center">{row.activePercent.toFixed(1)}%</td>
              </tr>
             ))}
             <tr className="bg-[#2a7d4d] font-bold text-white">
              <td className="border border-[#1f3a2b] px-2 py-2">TOTAL</td>
              <td className="border border-[#1f3a2b] px-2 py-2 text-center">{employeeGroupRows.total}</td>
              <td className="border border-[#1f3a2b] px-2 py-2 text-center">{employeeGroupRows.active}</td>
              <td className="border border-[#1f3a2b] px-2 py-2 text-center">{employeeGroupRows.onLeave}</td>
              <td className="border border-[#1f3a2b] px-2 py-2 text-center">{employeeGroupRows.notFilled}</td>
              <td className="border border-[#1f3a2b] px-2 py-2 text-center">{employeeGroupRows.activePercent.toFixed(1)}%</td>
             </tr>
            </tbody>
           </table>
          </div>
         </div>
        </div>
       </div>

       <div className="flex justify-end px-2 pb-4 sm:px-4 lg:px-6">
         <button className="rounded border border-[#1f3a2b] bg-[#f0f0f0] px-4 py-1.5 text-sm font-semibold text-[#1f3a2b] shadow-sm transition hover:bg-[#e5e5e5]">
           OK
         </button>
       </div>
       <LeavesTable records={records} />
      </div>
     </div>
    </div>
   </SidebarInset>
  </SidebarProvider>
 );
}
