"use client";

import { InputBlock } from "@/components/ui/input";
import { Table } from "@tanstack/react-table";
import { Search } from "lucide-react";
import { ResearchDocument } from "./types";

interface DataTableToolbarProps {
  table: Table<ResearchDocument>;
}

export function DataTableToolbar({ table }: DataTableToolbarProps) {
  return (
    <div className="flex w-full items-center space-x-2">
      <div className="relative w-1/2">
        <InputBlock
          leftIcon={<Search className="h-4 w-4 text-muted-foreground" />}
          placeholder="Search documents..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("title")?.setFilterValue(event.target.value)
          }
          className="w-full pl-8"
        />
      </div>
      {/* <Button variant="outline">Upload File</Button> */}
    </div>
  );
}
