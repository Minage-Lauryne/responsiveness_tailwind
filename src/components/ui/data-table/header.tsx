"use client";

import { Button } from "@/components/ui/button";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CaretSortIcon,
} from "@radix-ui/react-icons";
import type { Column } from "@tanstack/react-table";
import { cn } from "@/lib/utils";

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  name: string;
}

export default function DataTableColumnHeader<TData, TValue>({
  column,
  name,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return (
      <div className={cn(className)}>
        <span className="font-medium">{name}</span>
      </div>
    );
  }

  const handleClick = () => {
    const currentSort = column.getIsSorted();
    if (currentSort === false) {
      // Not sorted -> sort ascending
      column.toggleSorting(false);
    } else if (currentSort === "asc") {
      // Ascending -> sort descending
      column.toggleSorting(true);
    } else {
      // Descending -> clear sort
      column.clearSorting();
    }
  };

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 hover:bg-accent"
        onClick={handleClick}
      >
        <span className="font-medium">{name}</span>
        {column.getIsSorted() === "desc" ? (
          <ArrowDownIcon className="ml-2 h-4 w-4" />
        ) : column.getIsSorted() === "asc" ? (
          <ArrowUpIcon className="ml-2 h-4 w-4" />
        ) : (
          <CaretSortIcon className="ml-2 h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
