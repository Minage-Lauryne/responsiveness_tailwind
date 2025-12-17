"use client";

import { createColumnHelper } from "@tanstack/react-table";
import Link from "next/link";

import DataTableColumnHeader from "@/components/ui/data-table/header";
import type { OrganizationsAdminView } from "./types";

import { formatDistanceToNow } from "date-fns";

const columnHelper = createColumnHelper<OrganizationsAdminView>();

export const columns = [
  columnHelper.accessor("id", {
    id: "id",
    filterFn: (row, id, value) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      const rowId = row.getValue(id) as string;
      return rowId === value;
    },
  }),
  columnHelper.accessor("name", {
    id: "name",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} name={"Name"} />;
    },
    cell: (props) => {
      const value = props.getValue<string>();
      return (
        <div className="flex flex-col items-start gap-2">
          <div className="font-medium">{value}</div>
        </div>
      );
    },
    enableGlobalFilter: true,
  }),
  columnHelper.accessor("freeForever", {
    id: "freeForever",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} name={"Free Forever"} />;
    },
    cell: (props) => {
      const isFreeForever = props.getValue<boolean>();
      return <div>{isFreeForever ? "Yes" : "No"}</div>;
    },
  }),
  columnHelper.accessor("trialEndsAt", {
    id: "trial",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} name={"Trial"} />;
    },
    cell: (props) => {
      const trialEndsAt = props.getValue<Date | null>();
      const org = props.row.original;

      if (org.freeForever) {
        return <div className="text-muted-foreground">Free Forever</div>;
      }

      if (!trialEndsAt) {
        return <div className="text-muted-foreground">No trial</div>;
      }

      const now = new Date();
      const isExpired = trialEndsAt < now;

      return (
        <div className={isExpired ? "text-destructive" : ""}>
          {isExpired ? "Expired " : "Ends "}
          {formatDistanceToNow(trialEndsAt, { addSuffix: true })}
        </div>
      );
    },
  }),
  columnHelper.accessor("members", {
    id: "memberCount",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} name={"Members"} />;
    },
    cell: (props) => {
      const members = props.getValue();
      const organizationId = props.row.original.id;
      const memberCount = members?.length || 0;

      return (
        <div>
          {memberCount > 0 ? (
            <Link
              href={`/app/admin/users?organizationId=${organizationId}`}
              className="text-primary hover:underline"
            >
              {memberCount} members
            </Link>
          ) : (
            <span className="text-muted-foreground">0 members</span>
          )}
        </div>
      );
    },
  }),
  columnHelper.accessor("domains", {
    id: "domains",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} name={"Domains"} />;
    },
    cell: (props) => {
      const domains = props.getValue<Array<{ domain: string }>>();
      const domainNames = domains?.map((d) => d.domain) || [];

      if (domainNames.length === 0) {
        return <div className="text-muted-foreground">—</div>;
      }

      return <div>{domainNames.join(", ")}</div>;
    },
    enableGlobalFilter: true,
  }),
  columnHelper.accessor("createdAt", {
    id: "createdAt",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} name={"Created"} />;
    },
    cell: (props) => {
      const createdAt = props.getValue<Date>();
      return <div>{formatDistanceToNow(createdAt, { addSuffix: true })}</div>;
    },
  }),
];
// Removed actions column - functionality moved to organization detail sheet
