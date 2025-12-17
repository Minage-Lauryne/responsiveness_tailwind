"use client";


import {
 Clock,
 Home,
 Plus,
 Folder,
 Search,
 PanelLeft,
 type LucideIcon,
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
  SidebarTrigger,
  useSidebar,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils/index";
import { api } from "@/trpc/react";
import type { ComparativeAnalysisListItem } from "@/services/django-api";
import { MicroscopeIcon } from "@/features/chat/components/icons";

type MenuItem = {
 title: string;
 url: string;
 icon: LucideIcon;
 isActive?: boolean;
 items?: Array<{
   title: string;
   url: string;
   isActive?: boolean;
 }>;
};


export function AppSidebar({
  className,
  ...props
}: React.ComponentProps<typeof Sidebar>) {
 const { data: user } = api.me.get.useQuery();
 const pathname = usePathname();
 const { state, toggleSidebar } = useSidebar();
 const { data: recentSubjects } = api.subject.list.useQuery({ limit: 3 });
 const [comparativeAnalyses, setComparativeAnalyses] = React.useState<ComparativeAnalysisListItem[]>([]);
 const [isRecentsOpen, setIsRecentsOpen] = React.useState(true);
 const [isProjectFoldersOpen, setIsProjectFoldersOpen] = React.useState(false);
 const utils = api.useUtils();

 const handleRecentsToggle = (open: boolean) => {
   setIsRecentsOpen(open);
   if (open) setIsProjectFoldersOpen(false);
 };

 const handleProjectFoldersToggle = (open: boolean) => {
   setIsProjectFoldersOpen(open);
   if (open) setIsRecentsOpen(false);
 };

 React.useEffect(() => {
   async function fetchComparative() {
     try {
       const response = await fetch("/api/analyze", {
         method: "GET",
         credentials: "include",
         cache: "no-store",
       });
       
       if (response.ok) {
         const data = await response.json();
         const sorted = data
           .sort((a: ComparativeAnalysisListItem, b: ComparativeAnalysisListItem) => 
             new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
           )
           .slice(0, 3);
         setComparativeAnalyses(sorted);
       }
     } catch (error) {
       console.error("Failed to fetch comparative analyses:", error);
     }
   }

   void fetchComparative();
   
   const handleAnalysisUpdate = () => {
     console.log('[Sidebar] Analysis updated - refreshing lists');
     void fetchComparative();
     void utils.subject.list.invalidate();
   };
   
   window.addEventListener("analysis:updated", handleAnalysisUpdate);
   return () => {
     window.removeEventListener("analysis:updated", handleAnalysisUpdate);
   };
 }, [utils]);

 const userData = {
   name: user?.name ?? "Loading...",
   email: user?.email ?? "Loading...",
   isAdmin: user?.isAdmin ?? false,
};


  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        "[&_[data-sidebar=sidebar]]:bg-gradient-to-b",
        "[&_[data-sidebar=sidebar]]:from-[#D1F4F4]",
        "[&_[data-sidebar=sidebar]]:to-white",
        "[&_[data-sidebar=sidebar]]:text-[#162436]",
        className,
      )}
      {...props}
    >
      <SidebarHeader className="pt-8 pb-6">
        {state === "expanded" ? (
          <div className="flex items-center gap-3">
            <Image
              src="/logo/logo-secondary.svg"
              alt="Complēre Icon"
              width={36}
              height={36}
              className="h-9 w-9"
              priority
            />
            <Image
              src="/logo/logo-primary.svg"
              alt="Complēre"
              width={132}
              height={28}
              className="h-7 w-auto"
              priority
            />
          </div>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center">
            <Image
              src="/logo/logo-secondary.svg"
              alt="Complēre"
              width={32}
              height={32}
              className="h-8 w-8"
              priority
            />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="flex flex-col">
      <SidebarGroup className="py-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Home"
              isActive={pathname === "/app"}
              asChild
            >
              <Link href="/app">
                <Home className="h-5 w-5" />
                <span>Home</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="All Analyses"
              isActive={pathname === "/app/subject/list"}
              asChild
            >
              <Link href="/app/subject/list">
              <MicroscopeIcon size={20} />

                <span>All Analyses</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="New Analysis"
              isActive={pathname === "/app"}
              asChild
            >
              <Link href="/app">
                <Plus className="h-5 w-5 text-cyan-500" />
                <span>New Analysis</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      <NavMain 
        title="" 
        items={[
          {
            title: "Recents",
            url: "#",
            icon: Clock,
            collapsible: {
              open: isRecentsOpen,
              onOpenChange: handleRecentsToggle,
            },
            items: (() => {
              const items: Array<{ title: string; url: string; isActive: boolean }> = [];
              recentSubjects?.forEach((subject: any) => {
                items.push({
                  title: subject.title || `Analysis ${subject.id.slice(0, 8)}`,
                  url: `/app/subject/${subject.id}`,
                  isActive: pathname === `/app/subject/${subject.id}`,
                });
              });
              comparativeAnalyses.forEach((analysis) => {
                items.push({
                  title: analysis.title || `Analysis ${analysis.id.slice(0, 8)}`,
                  url: `/app/comparative/analysis/${analysis.id}`,
                  isActive: pathname === `/app/comparative/analysis/${analysis.id}`,
                });
              });
              if (items.length === 0) {
                return [
                  { title: "Self Org Analysis", url: "#", isActive: false },
                ];
              }
              return items.slice(0, 3);
            })(),
          }
        ]} 
      />

      <NavMain 
        title="" 
        items={[
          {
            title: "Project Folders",
            url: "#",
            icon: Folder,
            collapsible: {
              open: isProjectFoldersOpen,
              onOpenChange: handleProjectFoldersToggle,
            },
            items: [
              
              { title: "2025 Funding", url: "/app/folders/2025-funding", isActive: false },
            ],
          }
        ]} 
      />

      <SidebarGroup className="py-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Find Organizations"
              isActive={pathname === "/app/organizations/search"}
              asChild
            >
              <Link href="/app/organizations/search">
                <Search className="h-5 w-5" />
                <span>Find Organizations</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      <div className="flex-1 min-h-0" />
      
      <div className="flex-shrink-0">
        <SidebarGroup className="py-1">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Toolbar View"
                onClick={toggleSidebar}
                className="cursor-pointer"
              >
                <PanelLeft className="h-5 w-5" />
                <span>Toolbar View</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </div>
    </SidebarContent>

     <SidebarFooter className="flex-shrink-0">
       <div className="px-3 pb-2 pt-4">
         <p className="text-xs font-medium text-gray-500">Profiles</p>
       </div>
       <NavUser user={userData} />
     </SidebarFooter>

     <SidebarRail />
   </Sidebar>
 );
}