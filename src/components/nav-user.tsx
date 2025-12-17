"use client";

import {
  BadgeCheck,
  ChevronUp,
  CreditCard,
  LockKeyhole,
  LogOut,
  Building2,
  TrendingUp,
  Users,
  Mail,
  ClipboardList,
} from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useSignOut } from "@/features/auth/utils";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    isAdmin?: boolean;
    avatar?: string;
  };
}) {
  const signOut = useSignOut();
  const router = useRouter();
  const { data: session } = api.me.get.useQuery();
  const utils = api.useUtils();

  const logout = () => {
    signOut.mutate();
  };

  const { isMobile } = useSidebar();
  const activeOrg = session?.activeOrganization;
  const isOrgAdmin = session?.activeOrganizationMember?.role === "ADMIN";

  const getInitials = (name: string, email: string) => {
    if (name && name !== "Loading..." && name !== "Unknown User") {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (email && email !== "Loading..." && email !== "No email") {
      return email[0]?.toUpperCase() ?? "U";
    }
    return "U";
  };

  const initials = getInitials(user.name, user.email);
  
  const getOrgInitial = (name: string) => {
    if (!name) return "P";
    return name.trim()[0]?.toUpperCase() ?? "P";
  };
  
  const orgInitials = activeOrg?.name ? getOrgInitial(activeOrg.name) : "P";

  const getOrganizationColor = (name: string) => {
    const colors = [
      "bg-teal-500",
      "bg-blue-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-red-500",
      "bg-indigo-500",
      "bg-orange-500",
      "bg-cyan-500",
    ];
    const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length] ?? "bg-teal-500";
  };

  const orgBadgeColor = activeOrg?.name ? getOrganizationColor(activeOrg.name) : "bg-teal-500";

  return (
    <div className="flex flex-col gap-3 px-0">
      {activeOrg && (
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="default"
                  className="h-10 font-medium data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-10 group-data-[collapsible=icon]:!p-2"
                  tooltip={{
                    children: activeOrg.name,
                    hidden: false,
                  }}
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${activeOrg.logo ? 'bg-white' : orgBadgeColor} text-white font-bold text-sm shrink-0 overflow-hidden`}>
                    {activeOrg.logo ? (
                      <img src={activeOrg.logo} alt={activeOrg.name} className="h-full w-full object-cover" />
                    ) : (
                      orgInitials
                    )}
                  </div>
                  <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-semibold text-xs">{activeOrg.name}</span>
                  </div>
                  <ChevronUp className="ml-auto size-3 shrink-0 transition-transform data-[state=open]:rotate-180 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side={isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-2 py-1.5">
                  Current Organization
                </DropdownMenuLabel>
                <DropdownMenuGroup>
                  <DropdownMenuItem className="cursor-default flex items-center gap-2 py-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${activeOrg.logo ? 'bg-white' : orgBadgeColor} text-white font-bold text-sm shrink-0 overflow-hidden`}>
                      {activeOrg.logo ? (
                        <img src={activeOrg.logo} alt={activeOrg.name} className="h-full w-full object-cover" />
                      ) : (
                        orgInitials
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">{activeOrg.name}</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                
                {isOrgAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-2 py-1.5">
                      Organization Admin
                    </DropdownMenuLabel>
                    <DropdownMenuGroup>
                      <Link href="/app/organization-admin/dashboard">
                        <DropdownMenuItem className="cursor-pointer">
                          <TrendingUp className="mr-2 h-4 w-4" />
                          Dashboard
                        </DropdownMenuItem>
                      </Link>
                    </DropdownMenuGroup>
                  </>
                )}
                
                {session?.organizations && session.organizations.length > 1 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-2 py-1.5">
                      Switch Organizations
                    </DropdownMenuLabel>
                    <DropdownMenuGroup>
                      {session.organizations.filter(org => org.id !== activeOrg.id).map((org) => {
                        const orgBadgeColor = org.name ? getOrganizationColor(org.name) : "bg-teal-500";
                        const orgInitial = org.name ? getOrgInitial(org.name) : "O";
                        
                        return (
                          <DropdownMenuItem
                            key={org.id ?? 'personal'}
                            className="cursor-pointer"
                            onClick={async () => {
                              await authClient.organization.setActive({ organizationId: org.id });
                              await utils.invalidate();
                              router.push("/app");
                            }}
                          >
                            <div className={`flex h-6 w-6 items-center justify-center rounded-md ${org.logo ? 'bg-white' : orgBadgeColor} text-white font-semibold text-xs shrink-0 mr-2 overflow-hidden`}>
                              {org.logo ? (
                                <img src={org.logo} alt={org.name} className="h-full w-full object-cover" />
                              ) : (
                                orgInitial
                              )}
                            </div>
                          <span className="whitespace-nowrap">{org.name}</span>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuGroup>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      )}

      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="default"
                className="h-10 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-10 group-data-[collapsible=icon]:!p-2"
                tooltip={{
                  children: user.name,
                  hidden: false,
                }}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  {user.avatar && (
                    <AvatarImage src={user.avatar} alt={user.name} />
                  )}
                  <AvatarFallback className="bg-orange-500 text-white font-semibold text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-semibold text-xs">{user.name}</span>
                </div>
                <ChevronUp className="ml-auto size-3 shrink-0 transition-transform data-[state=open]:rotate-180 group-data-[collapsible=icon]:hidden" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-2 py-1.5">
                Profiles
              </DropdownMenuLabel>
              <DropdownMenuLabel className="p-0 font-normal">
                <Link href="/app/settings/profile">
                  <div className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground">
                    <Avatar className="h-8 w-8 shrink-0">
                      {user.avatar && (
                        <AvatarImage src={user.avatar} alt={user.name} />
                      )}
                      <AvatarFallback className="bg-orange-500 text-white font-semibold text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left leading-tight">
                      <span className="truncate font-semibold text-sm">{user.name}</span>
                      <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </div>
                </Link>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <Link href="/app/settings/profile">
                  <DropdownMenuItem className="cursor-pointer">
                    <BadgeCheck className="mr-2 h-4 w-4" />
                    Account
                  </DropdownMenuItem>
                </Link>
                <Link href="/app/settings/billing">
                  <DropdownMenuItem className="cursor-pointer">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Billing
                  </DropdownMenuItem>
                </Link>
                {user.isAdmin && (
                  <Link href="/app/admin">
                    <DropdownMenuItem className="cursor-pointer">
                      <LockKeyhole className="mr-2 h-4 w-4" />
                      Admin
                    </DropdownMenuItem>
                  </Link>
                )}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => logout()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </div>
  );
}