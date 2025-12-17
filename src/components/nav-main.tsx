"use client";

import { ChevronUp, type LucideIcon } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import Link from "next/link";

export function NavMain({
  title,
  items,
}: {
  title: string;
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: Array<{
      title: string;
      url: string;
      isActive?: boolean;
    }>;
    collapsible?: {
      defaultOpen?: boolean;
      open?: boolean;
      onOpenChange?: (open: boolean) => void;
    };
  }[];
}) {

  return (
    <SidebarGroup className="py-1">
      {title ? <SidebarGroupLabel>{title}</SidebarGroupLabel> : null}
      <SidebarMenu>
        {items.map((item) => {
          // If the item has no subitems, render as a simple link
          if (!item.items || item.items.length === 0) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={item.isActive}
                  asChild
                >
                  <Link href={item.url}>
                    {item.icon && <item.icon className="h-5 w-5" />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          // If the item has subitems, render as collapsible
          const collapsibleConfig = item.collapsible ?? {};
          const defaultOpen =
            collapsibleConfig.defaultOpen !== undefined
              ? collapsibleConfig.defaultOpen
              : true;

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={defaultOpen}
              open={collapsibleConfig.open}
              onOpenChange={collapsibleConfig.onOpenChange}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon && <item.icon className="h-5 w-5" />}
                    <span>{item.title}</span>
                    <ChevronUp className="ml-auto h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent className="max-h-[min(200px,30vh)] overflow-y-auto scrollbar-hide">
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.url}>
                        <SidebarMenuSubButton asChild>
                          <Link href={subItem.url}>
                            <span>{subItem.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
