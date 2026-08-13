import { useState } from "react";
import {
  Users,
  TreePine,
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  ChevronRight,
  Sparkles,
  Award,
  Layers,

  Clock,
  Eye,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// Role & Hierarchy Types
type DivisionType = "Executive" | "Operations" | "Maintenance" | "Design & Build" | "Safety & Quality";

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

// Hierarchy Dataset matching Safari Group EMS style
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

export default function AboutOperations() {
  const [selectedRole, setSelectedRole] = useState<OrganizationalRole | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleOpenDetail = (role: OrganizationalRole) => {
    setSelectedRole(role);
    setIsDetailOpen(true);
  };

  // Helper Badge Color Styling matching Document standard
  const getDepartmentBadge = (type: DivisionType) => {
    switch (type) {
      case "Executive":
        return <Badge className="bg-purple-500/15 text-purple-600 border-purple-500/20">Executive</Badge>;
      case "Operations":
        return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/20">Operations</Badge>;
      case "Maintenance":
        return <Badge className="bg-blue-500/15 text-blue-600 border-blue-500/20">Grounds & Lawn</Badge>;
      case "Design & Build":
        return <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/20">Design & Build</Badge>;
      case "Safety & Quality":
        return <Badge className="bg-rose-500/15 text-rose-600 border-rose-500/20">HSE & Quality</Badge>;
      default:
        return <Badge className="bg-slate-500/15 text-slate-600 border-slate-500/20">General</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">About Operations & Structure</h1>
          <p className="text-muted-foreground mt-1">
            Safari Group Grounds & Landscaping management tree, functional hierarchy, and team roles.
          </p>
        </div>

        <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
          <TreePine className="w-4 h-4" /> Download Company Profile
        </Button>
      </div>

      {/* Top Banner KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Total Workforce</p>
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
                <p className="text-xs font-medium text-muted-foreground uppercase">Ground Divisions</p>
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
                <p className="text-xs font-medium text-muted-foreground uppercase">Quality Standards</p>
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
                <p className="text-xs font-medium text-muted-foreground uppercase">Primary Site Hub</p>
                <p className="text-2xl font-bold mt-1">Main Yard Base</p>
              </div>
              <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                <Building2 className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organizational Structure Chart Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            Operations Organizational Hierarchy
          </CardTitle>
          <CardDescription>
            Visual map representing leadership flow, project reporting routes, and on-field execution channels.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-6 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 space-y-6">

            {/* Tier 1 - Top Leadership */}
            <div className="flex justify-center">
              <div className="w-full max-w-sm p-4 bg-white dark:bg-slate-950 rounded-lg border-2 border-emerald-600 shadow-md text-center space-y-1">
                <Badge className="bg-emerald-600 text-white mb-1">Top Executive</Badge>
                <h3 className="font-bold text-base">General Manager / Director</h3>
                <p className="text-xs text-muted-foreground">Mahabub Alam (EMP-001)</p>
                <p className="text-[11px] text-emerald-600 font-medium pt-1">Oversees Overall Group Strategy & EMS Systems</p>
              </div>
            </div>

            {/* Connecting Vertical Line */}
            <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-auto" />

            {/* Tier 2 - Department Managers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
              <div className="p-4 bg-white dark:bg-slate-950 rounded-lg border shadow-sm text-center space-y-1 relative">
                {getDepartmentBadge("Operations")}
                <h4 className="font-semibold text-sm mt-1">Operations Manager</h4>
                <p className="text-xs text-muted-foreground">John Doe (EMP-002)</p>
                <span className="text-[10px] text-muted-foreground block">Field Execution & Logistics</span>
              </div>

              <div className="p-4 bg-white dark:bg-slate-950 rounded-lg border shadow-sm text-center space-y-1">
                {getDepartmentBadge("Design & Build")}
                <h4 className="font-semibold text-sm mt-1">Landscape Architect & Design Lead</h4>
                <p className="text-xs text-muted-foreground">Sarah Jenkins (EMP-005)</p>
                <span className="text-[10px] text-muted-foreground block">3D Layouts & Engineering</span>
              </div>
            </div>

            {/* Connecting Vertical Line */}
            <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-auto" />

            {/* Tier 3 - Supervisory & Field Execution */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-white dark:bg-slate-950 rounded-lg border text-center space-y-1">
                {getDepartmentBadge("Maintenance")}
                <h5 className="font-medium text-xs mt-1">Grounds & Lawn Supervisor</h5>
                <p className="text-[11px] text-muted-foreground">Ahmed Al-Mansoor</p>
              </div>

              <div className="p-3 bg-white dark:bg-slate-950 rounded-lg border text-center space-y-1">
                {getDepartmentBadge("Safety & Quality")}
                <h5 className="font-medium text-xs mt-1">HSE & Quality Inspector</h5>
                <p className="text-[11px] text-muted-foreground">Tariq Hassan</p>
              </div>

              <div className="p-3 bg-white dark:bg-slate-950 rounded-lg border text-center space-y-1">
                {getDepartmentBadge("Operations")}
                <h5 className="font-medium text-xs mt-1">Crew Leaders & Technicians</h5>
                <p className="text-[11px] text-muted-foreground">15+ Field Team Leads</p>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Detailed Roles & Key Staff Directory Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Operations Roles & Key Personnel</CardTitle>
          <CardDescription>
            Detailed overview of key lead positions, contact points, and operational responsibilities.
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
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
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
                      <div className="font-semibold text-foreground">{item.employeeName}</div>
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
                        <span className="italic text-emerald-700 font-medium">Head of Organization</span>
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
                  <span className="text-xs font-mono text-muted-foreground">{selectedRole.id}</span>
                  {getDepartmentBadge(selectedRole.department)}
                </div>
                <h3 className="font-bold text-lg">{selectedRole.roleTitle}</h3>
                <p className="text-sm text-muted-foreground">
                  Assigned Lead: <strong className="text-foreground">{selectedRole.employeeName}</strong> ({selectedRole.employeeId})
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-muted-foreground block text-xs">Required Experience</span>
                    <span className="font-medium">{selectedRole.experience}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-muted-foreground block text-xs">Subordinate Staff</span>
                    <span className="font-medium">{selectedRole.headcount} Direct/Indirect</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-muted-foreground block text-xs">Direct Phone</span>
                    <span className="font-mono text-xs font-medium">{selectedRole.phone}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-muted-foreground block text-xs">Official Email</span>
                    <span className="font-mono text-xs font-medium truncate max-w-[140px] block" title={selectedRole.email}>
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
                    <li key={idx} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
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
