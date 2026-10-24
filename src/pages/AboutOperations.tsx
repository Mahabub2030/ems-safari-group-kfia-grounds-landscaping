import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
 Award,
 Building2,
 CheckCircle2,
 ChevronRight,
 Clock,
 Eye,
 FileSpreadsheet,
 FileText,
 Layers,
 Mail,
 Phone,
 ShieldCheck,
 TreePine,
 Users,
} from "lucide-react";
import { useState } from "react";
import * as XLSX from "xlsx";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
 Card,
 CardContent,
 CardDescription,
 CardHeader,
 CardTitle,
} from "@/components/ui/card";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";

// ==========================================
// TYPES
// ==========================================

type DivisionType =
 | "Executive"
 | "Operations"
 | "Maintenance"
 | "Design & Build"
 | "Safety & Quality";

interface OrganizationalRole {
 id: string;
 roleTitle: string;
 department: DivisionType;
 reportsTo: string | null;
 employeeName: string;
 employeeId: string;
 experience: string;
 phone: string;
 email: string;
 responsibilities: string[];
 headcount: number;
}

// Shift A / Shift B head counts
interface ShiftCount {
 a: number;
 b: number;
}

interface ChartUnit {
 title: string; // Supervisor card title
 caption: string; // small label under the column
 supervisor: ShiftCount;
 technician: ShiftCount;
 labor: ShiftCount;
}

// ==========================================
// ORG CHART DATA (edit numbers here)
// ==========================================

const managerCount: ShiftCount = { a: 1, b: 0 }; // "Shift A: 1" on the banners
const landscapingEngineer: ShiftCount = { a: 3, b: 0 };
const landscapingAdmin: ShiftCount = { a: 3, b: 2 };
const roadsEngineer: ShiftCount = { a: 1, b: 0 };

const landscapingUnits: ChartUnit[] = [
 {
  title: "Nursery Supervisor",
  caption: "Nursery",
  supervisor: { a: 2, b: 0 },
  technician: { a: 3, b: 2 },
  labor: { a: 19, b: 0 },
 },
 {
  title: "Irrigation Supervisor",
  caption: "Irrigation",
  supervisor: { a: 1, b: 1 },
  technician: { a: 4, b: 2 },
  labor: { a: 18, b: 4 },
 },
 {
  title: "Landscaping Supervisor",
  caption: "Landscaping",
  supervisor: { a: 5, b: 3 },
  technician: { a: 2, b: 4 },
  labor: { a: 43, b: 20 },
 },
 {
  title: "Electrical Supervisor",
  caption: "Electrical",
  supervisor: { a: 1, b: 0 },
  technician: { a: 1, b: 1 },
  labor: { a: 2, b: 2 },
 },
 {
  title: "Pest Control Supervisor",
  caption: "Pest Control",
  supervisor: { a: 1, b: 0 },
  technician: { a: 0, b: 0 },
  labor: { a: 1, b: 0 },
 },
];

const roadsUnits: ChartUnit[] = [
 {
  title: "Roads & Ground Supervisor",
  caption: "Roads & Grounds",
  supervisor: { a: 3, b: 1 },
  technician: { a: 4, b: 2 },
  labor: { a: 23, b: 10 },
 },
 {
  title: "Workshop Supervisor",
  caption: "Workshop",
  supervisor: { a: 1, b: 0 },
  technician: { a: 3, b: 0 },
  labor: { a: 5, b: 0 },
 },
];

const landscapingGroups = [
 "Landscaping",
 "Irrigation",
 "Nursery",
 "Pest Control",
 "Street Light",
];
const roadsGroups = ["Roads and Grounds", "Workshop"];

// ==========================================
// ROLE TABLE DATA
// ==========================================

const orgHierarchyData: OrganizationalRole[] = [
 {
  id: "ROLE-001",
  roleTitle: "General Manager / Director",
  department: "Executive",
  reportsTo: null,
  employeeName: "Mahabub Alam",
  employeeId: "EMP-001",
  experience: "10+ Years",
  phone: "+966 50 000 0001",
  email: "mahabub@safarigroup.com",
  responsibilities: [
   "Strategic business planning and executive operations oversight",
   "Key corporate client partnerships and contract approvals",
   "High-level resource allocation across regional projects",
  ],
  headcount: 1,
 },
 {
  id: "ROLE-002",
  roleTitle: "Operations Manager",
  department: "Operations",
  reportsTo: "General Manager / Director",
  employeeName: "John Doe",
  employeeId: "EMP-002",
  experience: "8 Years",
  phone: "+966 50 000 0002",
  email: "j.doe@safarigroup.com",
  responsibilities: [
   "Daily execution and dispatching of field landscaping teams",
   "Heavy machinery deployment and inventory oversight",
   "Project milestone tracking and client SLAs compliance",
  ],
  headcount: 1,
 },
 {
  id: "ROLE-003",
  roleTitle: "Landscape Architect & Senior Designer",
  department: "Design & Build",
  reportsTo: "General Manager / Director",
  employeeName: "Sarah Jenkins",
  employeeId: "EMP-005",
  experience: "6 Years",
  phone: "+966 50 000 0005",
  email: "s.jenkins@safarigroup.com",
  responsibilities: [
   "3D landscape rendering & CAD ground layout designs",
   "Plant species selection suitable for regional climate",
   "Hardscape material estimation and site topography mapping",
  ],
  headcount: 3,
 },
 {
  id: "ROLE-004",
  roleTitle: "Grounds & Irrigation Supervisor",
  department: "Maintenance",
  reportsTo: "Operations Manager",
  employeeName: "Ahmed Al-Mansoor",
  employeeId: "EMP-008",
  experience: "5 Years",
  phone: "+966 50 000 0008",
  email: "a.mansoor@safarigroup.com",
  responsibilities: [
   "Automated drip & sprinkler system maintenance",
   "Lawn turf health care, fertilization, and pest management",
   "Scheduling recurring commercial site maintenance crews",
  ],
  headcount: 8,
 },
 {
  id: "ROLE-005",
  roleTitle: "HSE & Quality Inspector",
  department: "Safety & Quality",
  reportsTo: "Operations Manager",
  employeeName: "Tariq Hassan",
  employeeId: "EMP-012",
  experience: "7 Years",
  phone: "+966 50 000 0120",
  email: "t.hassan@safarigroup.com",
  responsibilities: [
   "On-site personal protective equipment (PPE) compliance",
   "Environmental impact & water conservation audits",
   "Safety toolbox talks before major excavation projects",
  ],
  headcount: 2,
 },
 {
  id: "ROLE-006",
  roleTitle: "Senior Field Crew Leaders",
  department: "Operations",
  reportsTo: "Operations Manager",
  employeeName: "Multiple Lead Specialists",
  employeeId: "EMP-CREW-100",
  experience: "3-5 Years",
  phone: "+966 50 000 0099",
  email: "crews@safarigroup.com",
  responsibilities: [
   "Direct supervision of site installation and planting crews",
   "Equipment safe usage tracking and fuel log management",
   "Daily work progress sign-offs with site engineers",
  ],
  headcount: 15,
 },
];

// ==========================================
// ORG CHART BUILDING BLOCKS
// ==========================================

type Accent = "top" | "teal" | "slate";

const ACCENT_CLASSES: Record<Accent, string> = {
 top: "border-t-4 border-t-[#0e7a6e]",
 teal: "border-l-4 border-l-[#0e7a6e]",
 slate: "border-l-4 border-l-slate-500",
};

const LINE = "bg-slate-700 dark:bg-slate-400";

// "A: 3   B: 0" (zeros turn red when redZero is on)
const Counts = ({
 counts,
 redZero = false,
 compact = false,
}: {
 counts: ShiftCount;
 redZero?: boolean;
 compact?: boolean;
}) => {
 const cell = (label: string, value: number) => (
  <span
   className={
    redZero && value === 0
     ? "text-red-600 font-semibold"
     : "text-slate-600 dark:text-slate-300"
   }
  >
   {label}: {value}
  </span>
 );
 return (
  <div
   className={`flex items-center justify-center gap-3 ${compact ? "text-xs" : "text-sm"
    }`}
  >
   {cell("A", counts.a)}
   {cell("B", counts.b)}
  </div>
 );
};

const ChartCard = ({
 title,
 counts,
 accent,
 redZero,
 large = false,
 className = "",
}: {
 title: string;
 counts: ShiftCount;
 accent: Accent;
 redZero?: boolean;
 large?: boolean;
 className?: string;
}) => (
 <div
  className={`bg-white dark:bg-slate-950 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm px-2 py-3 text-center space-y-1 ${ACCENT_CLASSES[accent]} ${className}`}
 >
  <p
   className={`font-bold leading-tight text-slate-900 dark:text-slate-100 ${large ? "text-base" : "text-xs"
    }`}
  >
   {title}
  </p>
  <Counts counts={counts} redZero={redZero} compact={!large} />
 </div>
);

const ManagerBanner = ({
 title,
 subtitle,
}: {
 title: string;
 subtitle: string;
}) => (
 <div className="bg-[#0e7a6e] text-white rounded-md shadow-sm text-center py-2.5 px-4">
  <p className="font-bold uppercase tracking-wide text-lg leading-tight">
   {title}
  </p>
  <p className="text-xs text-white/85">{subtitle}</p>
 </div>
);

// One vertical stack: Supervisor -> Technician -> Labor -> caption
const UnitColumn = ({
 unit,
 index,
 total,
}: {
 unit: ChartUnit;
 index: number;
 total: number;
}) => (
 <div className="relative flex-1 min-w-[120px] px-1 pt-5">
  {/* vertical stub from the bus line */}
  <span className={`absolute top-0 left-1/2 w-px h-5 ${LINE}`} />
  {/* horizontal bus line segment */}
  {total > 1 && (
   <span
    className={`absolute top-0 h-px ${LINE} ${index === 0
      ? "left-1/2 right-0"
      : index === total - 1
       ? "left-0 right-1/2"
       : "left-0 right-0"
     }`}
   />
  )}

  <div className="space-y-3">
   <ChartCard
    title={unit.title}
    counts={unit.supervisor}
    accent="top"
    className="min-h-[84px] flex flex-col justify-center"
   />
   <ChartCard title="Technician" counts={unit.technician} accent="teal" className="py-4" />
   <ChartCard title="Labor" counts={unit.labor} accent="slate" className="py-4" />
  </div>

  <p className="text-center text-[11px] text-slate-500 dark:text-slate-400 mt-2">
   {unit.caption}
  </p>
 </div>
);

const VLine = ({ h = "h-4" }: { h?: string }) => (
 <div className={`w-px ${h} ${LINE} mx-auto`} />
);

// ==========================================
// EXPORT (Excel + PDF A3)
// ==========================================

const EXPORT_HEAD = ["Division", "Group", "Position", "Shift A", "Shift B", "Total"];

const buildExportRows = (): (string | number)[][] => {
 const rows: (string | number)[][] = [];
 const add = (
  division: string,
  group: string,
  position: string,
  c: ShiftCount,
 ) => rows.push([division, group, position, c.a, c.b, c.a + c.b]);

 add("Landscaping", "Management", "Landscaping Manager", managerCount);
 add("Landscaping", "Management", "Engineer", landscapingEngineer);
 add("Landscaping", "Management", "Admin", landscapingAdmin);
 landscapingUnits.forEach((u) => {
  add("Landscaping", u.caption, u.title, u.supervisor);
  add("Landscaping", u.caption, "Technician", u.technician);
  add("Landscaping", u.caption, "Labor", u.labor);
 });

 add("Roads & Grounds", "Management", "Roads & Grounds Manager", managerCount);
 add("Roads & Grounds", "Management", "Roads Engineer", roadsEngineer);
 roadsUnits.forEach((u) => {
  add("Roads & Grounds", u.caption, u.title, u.supervisor);
  add("Roads & Grounds", u.caption, "Technician", u.technician);
  add("Roads & Grounds", u.caption, "Labor", u.labor);
 });

 return rows;
};

const sumColumn = (rows: (string | number)[][], col: number) =>
 rows.reduce((t, r) => t + Number(r[col]), 0);

const handleExportExcel = () => {
 const rows = buildExportRows();
 const data = [
  EXPORT_HEAD,
  ...rows,
  ["TOTAL", "", "", sumColumn(rows, 3), sumColumn(rows, 4), sumColumn(rows, 5)],
 ];
 const ws = XLSX.utils.aoa_to_sheet(data);
 ws["!cols"] = [{ wch: 18 }, { wch: 18 }, { wch: 30 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];
 const wb = XLSX.utils.book_new();
 XLSX.utils.book_append_sheet(wb, ws, "Organization Chart");
 XLSX.writeFile(wb, `Ground_Landscaping_Org_Chart_${Date.now()}.xlsx`);
};

const handleExportPDF = () => {
 const rows = buildExportRows();
 const doc = new jsPDF("landscape", "mm", "a3");

 doc.setFontSize(18);
 doc.text("Ground & Landscaping - Organization Chart", 14, 16);
 doc.setFontSize(10);
 doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 23);

 autoTable(doc, {
  head: [EXPORT_HEAD],
  body: rows,
  foot: [
   ["TOTAL", "", "", sumColumn(rows, 3), sumColumn(rows, 4), sumColumn(rows, 5)],
  ],
  startY: 28,
  theme: "striped",
  headStyles: { fillColor: [14, 122, 110] }, // teal
  footStyles: { fillColor: [14, 122, 110], textColor: 255 },
  styles: { fontSize: 10 },
 });

 doc.save(`Ground_Landscaping_Org_Chart_${Date.now()}.pdf`);
};

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function AboutOperations() {
 const [selectedRole, setSelectedRole] = useState<OrganizationalRole | null>(
  null,
 );
 const [isDetailOpen, setIsDetailOpen] = useState(false);

 const handleOpenDetail = (role: OrganizationalRole) => {
  setSelectedRole(role);
  setIsDetailOpen(true);
 };

 // Helper Badge Color Styling matching Document standard
 const getDepartmentBadge = (type: DivisionType) => {
  switch (type) {
   case "Executive":
    return (
     <Badge className="bg-purple-500/15 text-purple-600 border-purple-500/20">
      Executive
     </Badge>
    );
   case "Operations":
    return (
     <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/20">
      Operations
     </Badge>
    );
   case "Maintenance":
    return (
     <Badge className="bg-blue-500/15 text-blue-600 border-blue-500/20">
      Grounds & Lawn
     </Badge>
    );
   case "Design & Build":
    return (
     <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/20">
      Design & Build
     </Badge>
    );
   case "Safety & Quality":
    return (
     <Badge className="bg-rose-500/15 text-rose-600 border-rose-500/20">
      HSE & Quality
     </Badge>
    );
   default:
    return (
     <Badge className="bg-slate-500/15 text-slate-600 border-slate-500/20">
      General
     </Badge>
    );
  }
 };

 return (
  <div className="container mx-auto p-4 md:p-8 max-w-7xl space-y-8">
   {/* Page Header */}
   <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
     <h1 className="text-3xl font-bold tracking-tight">
      About Operations & Structure
     </h1>
     <p className="text-muted-foreground mt-1">
      Safari Group Grounds & Landscaping management tree, functional
      hierarchy, and team roles.
     </p>
    </div>

    <div className="flex flex-wrap items-center gap-3">
     <Button
      variant="outline"
      onClick={handleExportExcel}
      className="gap-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50"
     >
      <FileSpreadsheet className="w-4 h-4" /> Excel
     </Button>
     <Button
      variant="outline"
      onClick={handleExportPDF}
      className="gap-2 border-rose-600 text-rose-600 hover:bg-rose-50"
     >
      <FileText className="w-4 h-4" /> PDF (A3)
     </Button>
     <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
      <TreePine className="w-4 h-4" /> Download Company Profile
     </Button>
    </div>
   </div>

   {/* Top Banner KPI Grid */}
   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <Card className="border-l-4 border-l-emerald-600">
     <CardContent className="pt-6">
      <div className="flex items-center justify-between">
       <div>
        <p className="text-xs font-medium text-muted-foreground uppercase">
         Total Workforce
        </p>
        <p className="text-2xl font-bold mt-1">120+ Active</p>
       </div>
       <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
        <Users className="w-6 h-6" />
       </div>
      </div>
     </CardContent>
    </Card>

    <Card className="border-l-4 border-l-blue-600">
     <CardContent className="pt-6">
      <div className="flex items-center justify-between">
       <div>
        <p className="text-xs font-medium text-muted-foreground uppercase">
         Ground Divisions
        </p>
        <p className="text-2xl font-bold mt-1">5 Departments</p>
       </div>
       <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
        <Layers className="w-6 h-6" />
       </div>
      </div>
     </CardContent>
    </Card>

    <Card className="border-l-4 border-l-amber-600">
     <CardContent className="pt-6">
      <div className="flex items-center justify-between">
       <div>
        <p className="text-xs font-medium text-muted-foreground uppercase">
         Quality Standards
        </p>
        <p className="text-2xl font-bold mt-1">ISO 14001 Compliant</p>
       </div>
       <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
        <Award className="w-6 h-6" />
       </div>
      </div>
     </CardContent>
    </Card>

    <Card className="border-l-4 border-l-purple-600">
     <CardContent className="pt-6">
      <div className="flex items-center justify-between">
       <div>
        <p className="text-xs font-medium text-muted-foreground uppercase">
         Primary Site Hub
        </p>
        <p className="text-2xl font-bold mt-1">Main Yard Base</p>
       </div>
       <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
        <Building2 className="w-6 h-6" />
       </div>
      </div>
     </CardContent>
    </Card>
   </div>

   {/* ===================================================== */}
   {/* ORGANIZATION CHART (matches the reference image)      */}
   {/* ===================================================== */}
   <Card className="overflow-hidden border-t-4 border-t-[#0e7a6e]">
    <CardContent className="p-0">
     <div className="overflow-x-auto">
      <div className="min-w-[1180px] bg-slate-50 dark:bg-slate-900/60">
       {/* Chart header: logo slots + titles */}
       <div className="relative px-6 pt-5 pb-3 text-center">
        <div className="absolute left-6 top-5 text-[10px] font-bold text-slate-400 tracking-wider">
         LOGO
        </div>
        <p className="text-sm font-bold tracking-[0.25em] text-[#0e7a6e] uppercase">
         Ground &amp; Landscaping
        </p>
        <h2 className="text-2xl font-bold mt-1 text-slate-900 dark:text-slate-100">
         Organization Chart
        </h2>
        {/* Swap these two boxes for <img src="..." /> company logos */}
        <div className="absolute right-6 top-3 flex items-center gap-3">
         <div className="h-10 w-28 rounded border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-[10px] text-slate-400">
          SAFARI logo
         </div>
         <div className="h-10 w-28 rounded border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-[10px] text-slate-400">
          Dammam Airports logo
         </div>
        </div>
       </div>

       {/* Two halves separated by a dashed divider */}
       <div className="flex px-6 pb-6">
        {/* LEFT: Landscaping */}
        <div className="flex-[5] pr-4 space-y-0">
         <div className="max-w-[490px] mx-auto">
          <ManagerBanner
           title="Landscaping Manager"
           subtitle="Shift A: 1"
          />
         </div>
         <VLine />

         {/* Engineer + Admin */}
         <div className="grid grid-cols-2 gap-1 max-w-[580px] mx-auto">
          <ChartCard
           title="Engineer"
           counts={landscapingEngineer}
           accent="teal"
           large
           className="py-4"
          />
          <ChartCard
           title="Admin"
           counts={landscapingAdmin}
           accent="teal"
           large
           className="py-4"
          />
         </div>

         {/* Supervisor columns on a bus line */}
         <div className="flex mt-0">
          {landscapingUnits.map((u, i) => (
           <UnitColumn
            key={u.caption}
            unit={u}
            index={i}
            total={landscapingUnits.length}
           />
          ))}
         </div>
        </div>

        {/* Dashed divider */}
        <div className="border-l border-dashed border-slate-300 dark:border-slate-700" />

        {/* RIGHT: Roads & Grounds */}
        <div className="flex-[2.1] pl-4">
         <div className="max-w-[490px] mx-auto">
          <ManagerBanner
           title="Roads & Grounds Manager"
           subtitle="Shift A: 1"
          />
         </div>
         <VLine />

         <div className="max-w-[270px] mx-auto">
          <ChartCard
           title="Roads Engineer"
           counts={roadsEngineer}
           accent="teal"
           large
           className="py-4"
          />
         </div>

         <div className="flex">
          {roadsUnits.map((u, i) => (
           <UnitColumn
            key={u.caption}
            unit={u}
            index={i}
            total={roadsUnits.length}
           />
          ))}
         </div>
        </div>
       </div>

       {/* Footer: organizational groups */}
       <div className="bg-slate-100/80 dark:bg-slate-900 border-t px-6 py-5">
        <p className="text-xs font-bold uppercase tracking-wider text-[#0e7a6e]">
         Organizational Groups
        </p>
        <div className="border-t border-slate-200 dark:border-slate-700 mt-2 pt-4 flex justify-between gap-8">
         <div>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
           Landscaping Manager
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">
           {landscapingGroups.map((g, i) => (
            <span key={g}>
             {i > 0 && <span className="mx-1.5">·</span>}
             {i + 1}. {g}
            </span>
           ))}
          </p>
         </div>
         <div>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
           Roads &amp; Grounds Manager
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">
           {roadsGroups.map((g, i) => (
            <span key={g}>
             {i > 0 && <span className="mx-1.5">·</span>}
             {i + 1}. {g}
            </span>
           ))}
          </p>
         </div>
        </div>
       </div>
      </div>
     </div>
    </CardContent>
   </Card>

   {/* Detailed Roles & Key Staff Directory Table */}
   <Card>
    <CardHeader>
     <CardTitle className="text-xl">
      Operations Roles & Key Personnel
     </CardTitle>
     <CardDescription>
      Detailed overview of key lead positions, contact points, and
      operational responsibilities.
     </CardDescription>
    </CardHeader>
    <CardContent>
     <div className="relative overflow-x-auto">
      <table className="w-full text-sm text-left">
       <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b">
        <tr>
         <th className="px-4 py-3">Role & Position</th>
         <th className="px-4 py-3">Division</th>
         <th className="px-4 py-3">Lead / Head</th>
         <th className="px-4 py-3">Reports To</th>
         <th className="px-4 py-3 text-center">Team Size</th>
         <th className="px-4 py-3 text-center">Action</th>
        </tr>
       </thead>
       <tbody className="divide-y">
        {orgHierarchyData.map((item) => (
         <tr
          key={item.id}
          className="hover:bg-muted/30 transition-colors"
         >
          <td className="px-4 py-4 font-medium text-foreground">
           <div className="flex items-center gap-2">
            <TreePine className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{item.roleTitle}</span>
           </div>
           <span className="text-[10px] text-muted-foreground block pl-6 font-mono">
            {item.id}
           </span>
          </td>

          <td className="px-4 py-4 whitespace-nowrap">
           {getDepartmentBadge(item.department)}
          </td>

          <td className="px-4 py-4">
           <div className="font-semibold text-foreground">
            {item.employeeName}
           </div>
           <span className="text-xs text-muted-foreground font-mono">
            {item.employeeId}
           </span>
          </td>

          <td className="px-4 py-4 text-xs text-muted-foreground">
           {item.reportsTo ? (
            <span className="flex items-center gap-1">
             <ChevronRight className="w-3 h-3 text-slate-400" />
             {item.reportsTo}
            </span>
           ) : (
            <span className="italic text-emerald-700 font-medium">
             Head of Organization
            </span>
           )}
          </td>

          <td className="px-4 py-4 text-center font-semibold text-slate-700">
           {item.headcount} {item.headcount > 1 ? "Staff" : "Person"}
          </td>

          <td className="px-4 py-4 text-center">
           <Button
            size="sm"
            variant="ghost"
            onClick={() => handleOpenDetail(item)}
            className="h-8 gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
           >
            <Eye className="w-4 h-4" /> View Role
           </Button>
          </td>
         </tr>
        ))}
       </tbody>
      </table>
     </div>
    </CardContent>
   </Card>

   {/* ROLE DETAILS DIALOG MODAL */}
   <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
    <DialogContent className="max-w-lg">
     <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
       <ShieldCheck className="w-5 h-5 text-emerald-600" />
       Role Specification & Profile
      </DialogTitle>
      <DialogDescription>
       Detailed operational duties and contacts in Safari Group EMS.
      </DialogDescription>
     </DialogHeader>

     {selectedRole && (
      <div className="space-y-4 py-2">
       <div className="p-4 bg-muted/40 rounded-lg border space-y-2">
        <div className="flex justify-between items-center">
         <span className="text-xs font-mono text-muted-foreground">
          {selectedRole.id}
         </span>
         {getDepartmentBadge(selectedRole.department)}
        </div>
        <h3 className="font-bold text-lg">{selectedRole.roleTitle}</h3>
        <p className="text-sm text-muted-foreground">
         Assigned Lead:{" "}
         <strong className="text-foreground">
          {selectedRole.employeeName}
         </strong>{" "}
         ({selectedRole.employeeId})
        </p>
       </div>

       <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2">
         <Clock className="w-4 h-4 text-slate-400" />
         <div>
          <span className="text-muted-foreground block text-xs">
           Required Experience
          </span>
          <span className="font-medium">
           {selectedRole.experience}
          </span>
         </div>
        </div>

        <div className="flex items-center gap-2">
         <Users className="w-4 h-4 text-slate-400" />
         <div>
          <span className="text-muted-foreground block text-xs">
           Subordinate Staff
          </span>
          <span className="font-medium">
           {selectedRole.headcount} Direct/Indirect
          </span>
         </div>
        </div>

        <div className="flex items-center gap-2">
         <Phone className="w-4 h-4 text-slate-400" />
         <div>
          <span className="text-muted-foreground block text-xs">
           Direct Phone
          </span>
          <span className="font-mono text-xs font-medium">
           {selectedRole.phone}
          </span>
         </div>
        </div>

        <div className="flex items-center gap-2">
         <Mail className="w-4 h-4 text-slate-400" />
         <div>
          <span className="text-muted-foreground block text-xs">
           Official Email
          </span>
          <span
           className="font-mono text-xs font-medium truncate max-w-[140px] block"
           title={selectedRole.email}
          >
           {selectedRole.email}
          </span>
         </div>
        </div>
       </div>

       <div className="border-t pt-3 space-y-2">
        <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
         Core Operational Responsibilities
        </h4>
        <ul className="space-y-2 text-xs">
         {selectedRole.responsibilities.map((resp, idx) => (
          <li
           key={idx}
           className="flex items-start gap-2 text-slate-700 dark:text-slate-300"
          >
           <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
           <span>{resp}</span>
          </li>
         ))}
        </ul>
       </div>
      </div>
     )}

     <DialogFooter>
      <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
       Close
      </Button>
     </DialogFooter>
    </DialogContent>
   </Dialog>
  </div>
 );
}
