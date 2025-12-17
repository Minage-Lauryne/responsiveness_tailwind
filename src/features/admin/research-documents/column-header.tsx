import {
  ArrowDownIcon,
  ArrowUpIcon,
  CaretSortIcon,
} from "@radix-ui/react-icons";
import { Column } from "@tanstack/react-table";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface DataTableColumnHeaderProps<RouterOutputTrial>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<RouterOutputTrial>;
  title: string;
}

export function DataTableColumnHeader<RouterOutputTrial>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<RouterOutputTrial>) {
  if (!column.getCanSort()) {
    return (
      <div className={cn(className)}>
        <span className="font-medium">{title}</span>
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
        <span className="font-medium">{title}</span>
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
