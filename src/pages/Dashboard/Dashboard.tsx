// src/pages/Dashboard.tsx
import { useMemo } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { computeStats, loadVacations } from "@/lib/Vacation data";
import { LeavesTable } from "@/pages/Dashboard/chartdata/Leaves table";
import { VacationChart } from "@/pages/Dashboard/chartdata/Vacation chart";

export default function Dashboard() {
 // Everything below is calculated from src/data/Vacations.json
 const records = useMemo(() => loadVacations(), []);
 const stats = useMemo(() => computeStats(records), [records]);

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
       <SectionCards stats={stats} />
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
