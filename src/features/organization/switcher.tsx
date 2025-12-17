"use client";

import { ChevronsUpDown, Plus } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
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
import { authClient } from "@/lib/auth-client";
import { Organization } from "@prisma/client";

export function OrganizationSwitcher({
  organizations,
  activeOrganization,
}: {
  organizations: Organization[];
  activeOrganization?: Organization;
}) {
  const { isMobile } = useSidebar();

  if (!activeOrganization) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 flex-row items-center justify-center rounded-lg bg-white text-sidebar-primary-foreground">
                <span className="text-sm font-semibold text-black">
                  {activeOrganization.name
                    ? activeOrganization.name
                        .split(" ")
                        .map((word) => word[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    : ""}
                </span>
              </div>
              <span className="truncate font-medium">
                {activeOrganization.name}
              </span>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Teams
            </DropdownMenuLabel>
            {organizations.map((organization) => (
              <DropdownMenuItem
                key={organization.name}
                onClick={() =>
                  authClient.organization.setActive({
                    organizationId: organization.id,
                  })
                }
                className="gap-2 p-2"
              >
                {/* <div className="flex size-6 items-center justify-center rounded-md border">
                  <team.logo className="size-3.5 shrink-0" />
                </div> */}
                {organization.name}
                {/* <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut> */}
              </DropdownMenuItem>
            ))}
            {/* <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">Add team</div>
            </DropdownMenuItem> */}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
