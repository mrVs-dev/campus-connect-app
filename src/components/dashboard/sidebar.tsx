
"use client";

import * as React from "react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Users,
  BarChart2,
  Settings,
  BookOpen,
  DollarSign,
  ClipboardList,
  Archive,
  History,
  UserPlus,
  BookUser,
} from "lucide-react";
import { Logo } from "@/components/icons/logo";
import { useAuth } from "@/hooks/use-auth";
import { UserNav } from "./user-nav";
import type { AppModule } from "@/lib/modules";

const iconMap: { [key in AppModule]?: React.ReactNode } = {
    Dashboard: <BarChart2 />,
    Students: <Users />,
    Users: <BookUser />,
    Assessments: <ClipboardList />,
    Fees: <DollarSign />,
    Invoicing: <DollarSign />,
    Inventory: <Archive />,
    Admissions: <BookOpen />,
    Enrollment: <UserPlus />,
    'Status History': <History />,
    Settings: <Settings />,
};

interface DashboardSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tabs: { value: string; label: string; module: AppModule }[];
}

export function DashboardSidebar({ activeTab, setActiveTab, tabs }: DashboardSidebarProps) {
  const { state } = useSidebar();
  const { user } = useAuth();

  return (
    <Sidebar variant="floating" collapsible="icon">
      <SidebarHeader>
        <Logo className="h-10 w-10" />
        <div className="flex-1 grow">
          <p className="text-lg font-semibold text-sidebar-foreground">CampusConnect</p>
        </div>
        <SidebarTrigger className="hidden lg:flex" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {tabs.map((tab) => (
            <SidebarMenuItem key={tab.value}>
              <SidebarMenuButton
                onClick={() => setActiveTab(tab.value)}
                isActive={activeTab === tab.value}
                tooltip={{ children: tab.label }}
              >
                {iconMap[tab.module]}
                <span>{tab.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      {state === "collapsed" && (
        <SidebarFooter className="items-center">
            <UserNav userRole={user?.email === "vannak@api-school.com" ? "Admin" : "Teacher"} />
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
