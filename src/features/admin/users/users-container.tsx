"use client";

import { AdminFilter, BetaFilter } from "@/components/admin-filter";
import { CopyToClipboard } from "@/components/copy-to-clipboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DataTableColumnHeader from "@/components/ui/data-table/header";
import DataTablePagination from "@/components/ui/data-table/pagination";
import DataTableViewOptions from "@/components/ui/data-table/view-options";
import { InputBlock } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ViewUser } from "@/features/admin/users/types";
import PageContainer from "@/features/dashboard-layout/page-container";
import { LoadingBlur } from "@/app/app/subject/components/loading-blur";
import { api } from "@/trpc/react";
import { Cross2Icon } from "@radix-ui/react-icons";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import {
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React from "react";
import { parseAsString, useQueryState } from "nuqs";
import { CreateUserModal } from "./create-user-modal";

const userColumnHelper = createColumnHelper<ViewUser>();

// Custom filter function for admin status with autoRemove
const adminFilterFn = (
  row: { getValue: (id: string) => unknown },
  id: string,
  value: boolean | undefined,
) => {
  const isAdmin = row.getValue(id) as boolean;
  if (value === undefined) return true; // Show all when no filter
  return isAdmin === value;
};
// Remove filter when value is undefined (following TanStack Table best practices)
adminFilterFn.autoRemove = (val: unknown) => val === undefined;

// Custom filter function for beta user status with autoRemove
const betaUserFilterFn = (
  row: { getValue: (id: string) => unknown },
  id: string,
  value: boolean | undefined,
) => {
  const isBetaUser = row.getValue(id) as boolean;
  if (value === undefined) return true; // Show all when no filter
  return isBetaUser === value;
};
// Remove filter when value is undefined (following TanStack Table best practices)
betaUserFilterFn.autoRemove = (val: unknown) => val === undefined;

// Custom filter function for organization filtering
const organizationFilterFn = (
  row: { getValue: (id: string) => unknown },
  id: string,
  value: string | undefined,
) => {
  if (!value) return true; // Show all when no filter
  const organizations = row.getValue(id) as { id: string; name: string }[];
  return organizations?.some((org) => org.id === value) || false;
};
// Remove filter when value is undefined
organizationFilterFn.autoRemove = (val: unknown) => val === undefined;

const userColumns = [
  userColumnHelper.accessor("isAdmin", {
    enableSorting: true,
    enableGlobalFilter: false,
    filterFn: adminFilterFn,
  }),
  userColumnHelper.accessor("name", {
    filterFn: (row, id, value: string) => value.includes(row.getValue(id)),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} name={"User"} />
    ),
    cell: (props) => {
      const name = props.getValue<string>();
      const isAdmin = props.row.original.isAdmin;

      return (
        <div className="flex items-center space-x-2">
          <Link
            href={`/app/admin/users/${props.row.original.id}`}
            className="font-medium underline underline-offset-4 hover:text-primary"
          >
            {name || "—"}
          </Link>
          {isAdmin && (
            <Badge variant="outline" className="px-2 py-0.5 text-xs">
              Admin
            </Badge>
          )}
          {props.row.original.isBetaUser && (
            <Badge variant="secondary" className="px-2 py-0.5 text-xs">
              Beta
            </Badge>
          )}
        </div>
      );
    },
    enableSorting: true,
    enableGlobalFilter: true,
  }),
  userColumnHelper.accessor("email", {
    filterFn: (row, id, value: string) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      const email = row.getValue(id) as string;
      return email?.toLowerCase().includes(value.toLowerCase()) ?? false;
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} name={"Email"} />
    ),
    cell: (props) => {
      const email = props.getValue<string>();
      return (
        <CopyToClipboard className="text-sm">{email || "—"}</CopyToClipboard>
      );
    },
    enableSorting: true,
    enableGlobalFilter: true,
  }),
  userColumnHelper.accessor("lastActive", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} name={"Last Active"} />
    ),
    cell: (props) => {
      const lastActive = props.getValue();

      return (
        <div className="pl-2">
          {lastActive ? (
            <Tooltip>
              <TooltipTrigger className="text-sm">
                {formatDistanceToNow(lastActive, { addSuffix: true })}
              </TooltipTrigger>
              <TooltipContent>
                {lastActive.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}{" "}
                at{" "}
                {lastActive.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "numeric",
                })}
              </TooltipContent>
            </Tooltip>
          ) : (
            <span className="text-sm text-muted-foreground">Never</span>
          )}
        </div>
      );
    },
    enableSorting: true,
    sortingFn: (rowA, rowB) => {
      const a = rowA.original.lastActive;
      const b = rowB.original.lastActive;
      if (!a && !b) return 0;
      if (!a) return 1; // Put "Never" users at the end
      if (!b) return -1; // Put "Never" users at the end
      return b.getTime() - a.getTime(); // Most recent first
    },
  }),
  userColumnHelper.accessor("chatActivity", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} name={"Chat Count"} />
    ),
    cell: (props) => {
      const chatActivity = props.getValue();
      return (
        <div className="pl-2">
          <span className="text-sm font-medium">{chatActivity}</span>
        </div>
      );
    },
    enableSorting: true,
    enableGlobalFilter: false,
  }),

  userColumnHelper.accessor("organizations", {
    id: "organizations",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} name={"Organizations"} />
    ),
    cell: (props) => {
      const organizations = props.getValue();

      if (!organizations || organizations.length === 0) {
        return (
          <div className="pl-2">
            <span className="text-sm text-muted-foreground">—</span>
          </div>
        );
      }

      return (
        <div className="pl-2">
          <div className="flex flex-wrap gap-1">
            {organizations.map((org, index) => (
              <span key={org.id}>
                <Link
                  href={`/app/admin/organizations?organizationId=${org.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  {org.name}
                </Link>
                {index < organizations.length - 1 && (
                  <span className="text-sm text-muted-foreground">, </span>
                )}
              </span>
            ))}
          </div>
        </div>
      );
    },
    enableSorting: true,
    enableGlobalFilter: true,
    filterFn: organizationFilterFn,
  }),
  userColumnHelper.accessor("interests", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} name={"Interests"} />
    ),
    cell: (props) => {
      const interests = props.getValue<string[]>();
      return interests && interests.length > 0 ? interests.join(", ") : "-";
    },
    enableSorting: true,
    enableGlobalFilter: true,
  }),
  userColumnHelper.accessor("url", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} name={"URL"} />
    ),
    cell: (props) => {
      const url = props.getValue<string>();
      return url ? <CopyToClipboard>{url}</CopyToClipboard> : "-";
    },
    enableSorting: true,
    enableGlobalFilter: true,
  }),
  userColumnHelper.accessor("location", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} name={"Location"} />
    ),
    cell: (props) => props.getValue() || "-",
    enableSorting: true,
    enableGlobalFilter: true,
  }),
  userColumnHelper.accessor("isBetaUser", {
    id: "isBetaUser",
    enableGlobalFilter: false,
    filterFn: betaUserFilterFn,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} name={"In Beta Program"} />
    ),
    cell: (props) => {
      const isBetaUser = props.getValue<boolean>();
      return (
        <div className="pl-2">
          <span className="text-sm">{isBetaUser ? "Yes" : "No"}</span>
        </div>
      );
    },
  }),
];

function DataTable({ data }: { data: ViewUser[] }) {
  const searchParams = useSearchParams();
  const initialSearch =
    searchParams.get("email") ?? searchParams.get("name") ?? "";

  // URL state management with nuqs
  const [organizationIdFilter, setOrganizationIdFilter] = useQueryState(
    "organizationId",
    parseAsString.withDefault(""),
  );

  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      isAdmin: false,
      url: false,
      interests: false,
      location: false,
      isBetaUser: false, // Hide beta column by default
    });

  // Initialize column filters based on URL parameters
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([
    {
      id: "isAdmin",
      value: false, // Default to showing non-admins
    },
    ...(organizationIdFilter
      ? [{ id: "organizations", value: organizationIdFilter }]
      : []),
  ]);

  // Update column filters when URL organizationId changes
  React.useEffect(() => {
    const baseFilters = [{ id: "isAdmin", value: false }];
    if (organizationIdFilter) {
      setColumnFilters([
        ...baseFilters,
        { id: "organizations", value: organizationIdFilter },
      ]);
    } else {
      setColumnFilters(baseFilters);
    }
  }, [organizationIdFilter]);
  const [sorting, setSorting] = React.useState<SortingState>([
    {
      id: "lastActive",
      desc: false,
    },
  ]);

  const table = useReactTable({
    data,
    columns: userColumns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    initialState: {
      pagination: {
        pageSize: 50,
      },
    },
  });

  React.useEffect(() => {
    if (initialSearch) {
      table.setGlobalFilter(initialSearch);
    }
  }, [initialSearch, table]);

  const allRows = table.getCoreRowModel().rows;
  const isFiltered = table.getState().columnFilters.length > 0;
  const filteredRowsLength = table.getFilteredRowModel().rows.length;

  // Get current admin filter value
  const adminFilter = table.getColumn("isAdmin");
  const adminFilterValue = adminFilter?.getFilterValue() as boolean | undefined;

  const handleAdminFilterChange = (value: boolean | undefined) => {
    adminFilter?.setFilterValue(value);
  };

  // Get current beta filter value
  const betaFilter = table.getColumn("isBetaUser");
  const betaFilterValue = betaFilter?.getFilterValue() as boolean | undefined;

  const handleBetaFilterChange = (value: boolean | undefined) => {
    betaFilter?.setFilterValue(value);
  };

  return (
    <div className="w-full p-2">
      <div className="mb-8 flex flex-row items-start gap-4">
        <div className="flex justify-start space-x-2">
          <InputBlock
            placeholder="Search by name or email"
            className="w-96"
            defaultValue={initialSearch}
            onChange={(e) => {
              const searchValue = e.target.value;
              table.setGlobalFilter(searchValue);

              // Clear column filters when user starts searching to avoid confusion
              if (searchValue.trim()) {
                table.resetColumnFilters();
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                setOrganizationIdFilter("");
              } else {
                // If search is cleared, restore default admin filter (show non-admins) and organization filter if present
                table.getColumn("isAdmin")?.setFilterValue(false);
                table.getColumn("isBetaUser")?.setFilterValue(undefined);
                if (organizationIdFilter) {
                  table
                    .getColumn("organizations")
                    ?.setFilterValue(organizationIdFilter);
                }
              }
            }}
          />
        </div>
        <AdminFilter
          value={adminFilterValue}
          onChange={handleAdminFilterChange}
          className="min-w-[120px]"
        />
        <BetaFilter
          value={betaFilterValue}
          onChange={handleBetaFilterChange}
          className="min-w-[120px]"
        />
        <DataTableViewOptions table={table} />
      </div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center text-sm text-muted-foreground">
          {isFiltered ? (
            <>
              Viewing {filteredRowsLength.toLocaleString()} of{" "}
              {allRows.length.toLocaleString()} rows{" "}
              <Button
                variant="ghost"
                onClick={() => {
                  table.resetGlobalFilter();
                  table.resetColumnFilters();
                  // Reset to default state (show non-admins)
                  table.getColumn("isAdmin")?.setFilterValue(false);
                  // Reset beta filter to default (no filter)
                  table.getColumn("isBetaUser")?.setFilterValue(undefined);
                  // Clear organization ID from URL
                  // eslint-disable-next-line @typescript-eslint/no-floating-promises
                  setOrganizationIdFilter("");
                }}
                className="ml-2 h-8 px-2 lg:px-3"
              >
                Reset
                <Cross2Icon className="ml-2 h-4 w-4" />
              </Button>
            </>
          ) : (
            <>Viewing all {filteredRowsLength.toLocaleString()} rows</>
          )}
        </div>
        <DataTablePagination table={table} />
      </div>
      <TooltipProvider>
        <Table className="w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="bg-background px-4 py-3"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={userColumns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TooltipProvider>
    </div>
  );
}

export function AdminUsersList() {
  const { data: users, isLoading: isLoadingUsers } = api.user.list.useQuery();

  console.log(users);

  return (
    <PageContainer
      breadcrumbs={[
        {
          name: "Admin",
          href: "/app/admin",
        },
        {
          name: "Users",
        },
      ]}
    >
      <div className="flex flex-col space-y-8">
        <div>
          <div className="flex items-center justify-end">
            <CreateUserModal />
          </div>
          <DataTable data={users ?? []} />
          <LoadingBlur loading={isLoadingUsers} />
        </div>
      </div>
    </PageContainer>
  );
}
