"use client";
import {
  BookOpen,
  Bot,
  FilePlus,
  Frame,
  Settings2,
  SquareTerminal,
} from "lucide-react";
import { NavMain } from "@/components/layout/nav-main";
import { NavUser } from "@/components/layout/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { useTranslation } from "react-i18next";
import { useLayoutEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const data = {
  user: {
    name: "Demo User",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: SquareTerminal,
      isActive: true,
    },
    {
      title: "admin",
      url: "#",
      icon: Settings2,
      items: [
        { title: "Search Contract", url: "/dashboard/SearchContract", icon: Frame },
        { title: "Target", url: "/dashboard/admin/TargetScreen", icon: Frame },
        { title: "Allocations", url: "/dashboard/SearchContract", icon: Frame },
        { title: "Message Campaign", url: "/dashboard/SearchContract", icon: Frame },

      ],
    },
    {
      title: "Smart View",
      url: "#",
      icon: FilePlus,
      items: [
        {
          title: "New Application",
          url: "/dashboard/new-application",
          icon: FilePlus,
        }, {
          title: "Search Contract",
          url: "/dashboard/new-application",
          icon: FilePlus,
        }, {
          title: "Follow Up",
          url: "/dashboard/new-application",
          icon: FilePlus,
        },
      ],
    },
    // { title: "Scheme Due Day", url: "/dashboard/Lifecycle", icon: Frame },
    // { title: "Due Day", url: "/dashboard/DueDay", icon: BookOpen },
  ],
};

export function AppSidebar({ ...props }) {
  const { i18n } = useTranslation("GetStartedPage");
  const [sideBarRtl, setSideBarRtl] = useState(false);
  const { user } = useAuth() as { user: any };

  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  useLayoutEffect(() => {
    setSideBarRtl(i18n.dir() === "rtl");
  }, [i18n.dir()]);

  return (
    <Sidebar side={sideBarRtl ? "right" : "left"} collapsible="icon" {...props}>
      <SidebarHeader
        className={` transition-all h-24 py-4 items-start  ${isCollapsed ? "px-0.5" : "px-4"
          }`}
      >
        <img
          src="/assets/FULL-LOGO.png"
          alt="Logo"
          className="h-16 w-auto object-contain"
        />
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={data.navMain.map((item) => ({
            title: item.title,
            url: item.url,
            icon: item.icon,
            isActive: item.isActive,
            items: item.items,
          }))}
        />
      </SidebarContent>

      <SidebarFooter>
        {!isCollapsed && (
          <NavUser
            user={{
              name: user?.Username1 || user?.name || user?.userId || "Demo User",
              email: user?.Email || user?.email || "No Email Provided",
              avatar: user?.avatar || "/avatars/shadcn.jpg",
            }}
          />
        )}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
