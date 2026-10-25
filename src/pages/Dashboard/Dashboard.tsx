// src/pages/Dashboard.tsx
import { useMemo } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import employeesData from "@/data/employees.json";
import expiryData from "@/data/Expiration.json";
import { loadVacations } from "@/lib/Vacation data";
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

  return {
   total: rows.length,
   dacoIdCount,
   expiredIqama,
   expiredDaco,
   validTotal,
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
    <div className="flex flex-1 flex-col">
     <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
       <SectionCards stats={employeeStats} expiryStats={expiryStats} />
       <div className="px-4 lg:px-6">
        <VacationChart records={records} />
       </div>
       <LeavesTable records={records} />
      </div>
     </div>
    </div>
   </SidebarInset>
  </SidebarProvider>
 );
}
