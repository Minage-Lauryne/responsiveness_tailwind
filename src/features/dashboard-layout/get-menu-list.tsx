"use client";

import { GenericIcon } from "@/components/types";
import { Bookmark, FileText, FolderIcon } from "lucide-react";

type Submenu = {
  href: string;
  label: string;
  description: string;
};

type Menu = {
  href: string;
  label: string;
  active: boolean;
  icon: GenericIcon;
  submenus?: Submenu[];
};

type Group = {
  groupLabel?: string;
  menus: Menu[];
};

export function getMenuList(pathname: string): Group[] {
  return [
    {
      menus: [
        {
          href: "/app/history",
          label: "History",
          active: pathname === "/app/history",
          icon: Bookmark,
        },
        {
          href: "/app/reports/create",
          label: "Create Report",
          active: pathname === "/app/reports/create",
          icon: FileText,
        },
      ],
    },
  ];
}
