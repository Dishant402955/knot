"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

import { LogoMark } from "@/components/logo";

import {
  Bell,
  Folder,
  Home,
  Settings,
  Video,
  type LucideIcon,
} from "lucide-react";

const navMain: {
  title: string;
  url: string;
  icon: LucideIcon;
}[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Videos",
    url: "/dashboard/videos",
    icon: Video,
  },
  {
    title: "Folders",
    url: "/dashboard/folders",
    icon: Folder,
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
  },
  {
    title: "Notifications",
    url: "/dashboard/notifications",
    icon: Bell,
  },
];

const isNavActive = (url: string, pathname: string) => {
  if (url === "/dashboard") {
    return pathname === "/dashboard";
  }

  if (url === "/dashboard/folders") {
    return (
      pathname === "/dashboard/folders" ||
      pathname.startsWith("/dashboard/folder/")
    );
  }

  return pathname === url || pathname.startsWith(`${url}/`);
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className="hover:bg-transparent active:bg-transparent"
            >
              <Link href="/dashboard" prefetch>
                <LogoMark className="size-7" />

                <span className="font-extrabold text-lg">Knot</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>

          <SidebarMenu>
            {navMain.map((item) => {
              const active = isNavActive(item.url, pathname);
              const Icon = item.icon;

              return (
                <SidebarMenuItem key={item.title} className="my-0.5">
                  <SidebarMenuButton
                    asChild
                    isActive={active}
                    tooltip={item.title}
                    className="h-9 text-[15px]"
                  >
                    <Link href={item.url} prefetch>
                      <Icon className="size-5" />

                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
