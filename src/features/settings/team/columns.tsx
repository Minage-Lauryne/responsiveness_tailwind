"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";

import { OrganizationMembersOutput } from "./types";
import DataTableColumnHeader from "@/components/ui/data-table/header";

const columnHelper = createColumnHelper<OrganizationMembersOutput>();

export const columns = [
  columnHelper.accessor("user.name", {
    id: "name",
    size: 300,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} name="Name" />
    ),
    cell: ({ getValue }) => {
      const name = getValue();
      return name || "—";
    },
  }),
  columnHelper.accessor((row) => row.organizationEmail || row.user.email, {
    id: "email",
    size: 300,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} name="Email" />
    ),
  }),
  columnHelper.accessor("role", {
    id: "role",
    size: 150,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} name="Role" />
    ),
    cell: ({ getValue }) => {
      const role = getValue();
      return (
        <Badge variant={role === "ADMIN" ? "default" : "secondary"}>
          {role}
        </Badge>
      );
    },
  }),
  columnHelper.accessor("createdAt", {
    id: "joinedAt",
    size: 200,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} name="Joined" />
    ),
    cell: ({ getValue }) => {
      const date = getValue();
      return new Date(date).toLocaleDateString();
    },
  }),
];