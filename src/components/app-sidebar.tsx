"use client";

import {
  Clock,
  Home,
  Plus,
  Folder,
  Search,
  PanelLeft,
} from "lucide-react";
import * as React from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import type { ComparativeAnalysisListItem } from "@/services/django-api";
import { MicroscopeIcon } from "@/features/chat/components/icons";

export function AppSidebar({
  className,
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { state, toggleSidebar } = useSidebar();

  const { data: user } = api.me.get.useQuery();
  const { data: recentSubjects } = api.subject.list.useQuery({ limit: 3 });
  const utils = api.useUtils();

  const [comparativeAnalyses, setComparativeAnalyses] = React.useState<
    ComparativeAnalysisListItem[]
  >([]);
  const [isRecentsOpen, setIsRecentsOpen] = React.useState(true);
  const [isProjectFoldersOpen, setIsProjectFoldersOpen] =
    React.useState(false);
  const fetchComparative = React.useCallback(async () => {
    try {
      const response = await fetch("/api/analyze", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        setComparativeAnalyses(
          data
            .sort(
              (a: ComparativeAnalysisListItem, b: ComparativeAnalysisListItem) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            )
            .slice(0, 3)
        );
      }
    } catch (err) {
      console.error("Failed to fetch comparative analyses", err);
    }
  }, []);

  React.useEffect(() => {
    fetchComparative();

    const handleUpdate = () => {
      fetchComparative();
      utils.subject.list.invalidate();
    };

    window.addEventListener("analysis:updated", handleUpdate);
    return () => window.removeEventListener("analysis:updated", handleUpdate);
  }, [utils, fetchComparative]);

  const handleRecentsToggle = async (open: boolean) => {
    setIsRecentsOpen(open);
    if (open) {
      setIsProjectFoldersOpen(false);
      try {
        await utils.subject.list.invalidate();
      } catch (err) {
        console.warn("Failed to invalidate subjects utils", err);
      }
      await fetchComparative();
    }
  };

  const userData = {
    name: user?.name ?? "Loading...",
    email: user?.email ?? "Loading...",
    isAdmin: user?.isAdmin ?? false,
  };

  const recentItems = React.useMemo(() => {
    const subjects =
      recentSubjects?.map((subject: any) => ({
        title: subject.title || `Analysis ${subject.id.slice(0, 8)}`,
        url: `/app/subject/${subject.id}`,
        isActive: pathname === `/app/subject/${subject.id}`,
      })) ?? [];

    const comparative =
      comparativeAnalyses.map((analysis) => ({
        title: analysis.title || `Analysis ${analysis.id.slice(0, 8)}`,
        url: `/app/comparative/analysis/${analysis.id}`,
        isActive:
          pathname === `/app/comparative/analysis/${analysis.id}`,
      })) ?? [];

    return [...subjects, ...comparative].slice(0, 3);
  }, [recentSubjects, comparativeAnalyses, pathname]);

  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        "h-screen flex flex-col",
        "[&_[data-sidebar=sidebar]]:bg-gradient-to-b",
        "[&_[data-sidebar=sidebar]]:from-[#D1F4F4]",
        "[&_[data-sidebar=sidebar]]:to-white",
        "[&_[data-sidebar=sidebar]]:text-[#162436]",
        className
      )}
      {...props}
    >
      <SidebarHeader className="shrink-0 pt-8 pb-6">
        {state === "expanded" ? (
          <div className="flex items-center gap-3">
            <Image
              src="/logo/logo-secondary.svg"
              alt="Complēre Icon"
              width={36}
              height={36}
              priority
            />
            <Image
              src="/logo/logo-primary.svg"
              alt="Complēre"
              width={132}
              height={28}
              priority
            />
          </div>
        ) : (
          <Image
            src="/logo/logo-secondary.svg"
            alt="Complēre"
            width={32}
            height={32}
            priority
          />
        )}
      </SidebarHeader>

      <SidebarContent className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center max-[1512px]:items-center 2xl:items-end 2xl:pb-14 xl:items-end xl:pb-10">
          <div className="w-full">
            <SidebarGroup>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={pathname === "/app"}
                    asChild
                  >
                    <Link href="/app">
                      <Home className="h-5 w-5" />
                      <span className="text-sm xl:text-[14px] lg:text-[12px] leading-tight">Home</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={pathname === "/app/subject/list"}
                    asChild
                  >
                    <Link href="/app/subject/list">
                      <MicroscopeIcon size={20} />
                      <span className="text-sm xl:text-[14px] lg:text-[12px] leading-tight" >All Analyses</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/app">
                      <Plus className="h-5 w-5 text-cyan-500" />
                      <span className="text-sm xl:text-[14px] lg:text-[12px] leading-tight">New Analysis</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>

          <div className="text-sm xl:text-[14px] lg:text-[12px] leading-tight">
            <NavMain
              items={[
                {
                  title: "Recents",
                  url: "#",
                  icon: Clock,
                  collapsible: {
                    open: isRecentsOpen,
                    onOpenChange: (open) => handleRecentsToggle(open),
                  },
                  items: recentItems,
                },
              ]}
            />
            </div>

          <div className="text-sm xl:text-[14px] lg:text-[12px] leading-tight">
            <NavMain
              items={[
                {
                  title: "Project Folders",
                  url: "#",
                  icon: Folder,
                  collapsible: {
                    open: isProjectFoldersOpen,
                    onOpenChange: (open) => {
                      setIsProjectFoldersOpen(open);
                      if (open) setIsRecentsOpen(false);
                    },
                  },
                  items: [
                    {
                      title: "2025 Funding",
                      url: "/app/folders/2025-funding",
                      isActive: false,
                    },
                  ],
                },
              ]}
            />
            </div>

            <SidebarGroup>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={pathname === "/app/organizations/search"}
                    asChild
                  >
                    <Link href="/app/organizations/search">
                      <Search className="h-5 w-5" />
                      <span className="text-sm xl:text-[14px] lg:text-[12px] leading-tight">Find Organizations</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </div>
        </div>
      </SidebarContent>

      <div className="shrink-0">
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={toggleSidebar}>
                <PanelLeft className="h-5 w-5" />
                <span className="text-sm xl:text-[14px] lg:text-[12px] leading-tight">Toolbar View</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </div>

      <SidebarFooter className="shrink-0">
        <div className="px-3 pb-2 pt-4">
          <p className="text-xs font-medium text-gray-500">Profiles</p>
        </div>
        <NavUser user={userData} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
