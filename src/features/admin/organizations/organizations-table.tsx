"use client";

import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";
import { parseAsString, useQueryState } from "nuqs";
import * as React from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import DataTablePagination from "@/components/ui/data-table/pagination";
import { InputBlock } from "@/components/ui/input";
import { X } from "lucide-react";
import { columns } from "./columns";
import type { OrganizationsAdminView } from "./types";

export default function OrganizationsTable({
  data,
  refetch,
  onOpenSheet,
}: {
  data: OrganizationsAdminView[];
  refetch: () => Promise<unknown>;
  onOpenSheet: (organizationId: string) => void;
}) {
  // URL state management with nuqs
  const [organizationIdFilter, setOrganizationIdFilter] = useQueryState(
    "organizationId",
    parseAsString.withDefault(""),
  );

  const [sorting, setSorting] = React.useState<SortingState>([
    {
      id: "createdAt",
      desc: true,
    },
  ]);

  const [globalFilter, setGlobalFilter] = React.useState("");

  const [rowSelection, setRowSelection] = React.useState({});

  // Initialize column filters based on URL parameters
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    organizationIdFilter ? [{ id: "id", value: organizationIdFilter }] : [],
  );

  // Update column filters when URL organizationId changes
  React.useEffect(() => {
    if (organizationIdFilter) {
      setColumnFilters([{ id: "id", value: organizationIdFilter }]);
    } else {
      setColumnFilters([]);
    }
  }, [organizationIdFilter]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility: {
        id: false,
      },
      rowSelection,
      columnFilters,
      globalFilter,
    },
    enableRowSelection: true,
    enableGlobalFilter: true,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    initialState: {
      pagination: {
        pageSize: 50,
      },
    },
  });

  const filteredRowsCount = table.getFilteredRowModel().rows.length;

  return (
    <div className="">
      <div className="z-20 flex flex-col bg-background lg:col-span-2">
        <div className="mb-4 flex items-center justify-between p-4">
          <div className="flex items-center space-x-2">
            <InputBlock
              placeholder="Search organizations by name"
              className="w-96"
              value={globalFilter}
              onChange={(e) => {
                const searchValue = e.target.value;
                setGlobalFilter(searchValue);

                // Clear column filters when user starts searching to avoid confusion
                if (searchValue.trim()) {
                  setColumnFilters([]);
                  // eslint-disable-next-line @typescript-eslint/no-floating-promises
                  setOrganizationIdFilter("");
                }
              }}
            />
            {organizationIdFilter && (
              <div className="text-sm text-primary">
                Showing organization: {organizationIdFilter.slice(-8)}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-muted-foreground">
              {filteredRowsCount} total
            </div>
            <DataTablePagination table={table} />
            {columnFilters.length || organizationIdFilter || globalFilter ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setColumnFilters([]);
                  // eslint-disable-next-line @typescript-eslint/no-floating-promises
                  setOrganizationIdFilter("");
                  setGlobalFilter("");
                }}
              >
                <X className="h-4 w-4" />
                Clear filters
              </Button>
            ) : null}
          </div>
        </div>
      </div>
      <Table className="w-full">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead
                    className="bg-background px-4 py-3"
                    key={header.id}
                    colSpan={header.colSpan}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row, index) => (
              <TableRow
                key={row.id}
                onClick={() => {
                  onOpenSheet(row.original.id);
                }}
                className="cursor-pointer hover:bg-muted/50"
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, {
                      ...cell.getContext(),
                      refetch,
                    })}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                <div className="pb-2 text-muted-foreground">
                  No organizations found.
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
