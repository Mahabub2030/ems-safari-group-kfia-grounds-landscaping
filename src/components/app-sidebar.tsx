import * as React from "react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  LayoutDashboardIcon,
  UsersIcon,
  CalendarDaysIcon,
  FileClockIcon,
  FolderOpenIcon,
  Settings2Icon,
  CircleHelpIcon,
  SearchIcon,
  CommandIcon,
} from "lucide-react"

const data = {
  user: {
    name: "Nabatat Admin",
    email: "admin@nabatat.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/Dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Employees",
      url: "/Employees",
      icon: <UsersIcon />,
    },
    {
      title: "Vacations",
      url: "/Vacation",
      icon: <CalendarDaysIcon />,
    },
    {
      title: "Expirations",
      url: "/Expiration",
      icon: <FileClockIcon />,
    },
    {
      title: "Documents",
      url: "/EmployeeDocuments",
      icon: <FolderOpenIcon />,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/AboutOperations",
      icon: <Settings2Icon />,
    },
    {
      title: "Get Help",
      url: "#",
      icon: <CircleHelpIcon />,
    },
    {
      title: "Search",
      url: "#",
      icon: <SearchIcon />,
    },
  ],
  documents: [
    {
      name: "Operations Report",
      url: "/AboutOperations",
      icon: <FolderOpenIcon />,
    },
    {
      name: "Employee Files",
      url: "/EmployeeDocuments",
      icon: <FolderOpenIcon />,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="border-b border-sidebar-border/70 bg-[#1f3a2b] text-white">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5! hover:bg-[#2b4d3d] hover:text-white"
            >
              <a href="/Dashboard">
                <CommandIcon className="size-5" />
                <span className="text-base font-semibold">Nabatat</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="bg-[#f6f6f3]">
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/70 bg-[#f6f6f3]">
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
