"use client";

import { Button } from "@/components/ui/button";
import { createColumnHelper } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import { Eye, FileText, MoreHorizontal, ExternalLink } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ComparativeAnalysisListItem } from "@/services/django-api";
import { toast } from "sonner";
import { useState } from "react";

const columnHelper = createColumnHelper<ComparativeAnalysisListItem>();

export const comparativeColumns = [
  columnHelper.accessor("title", {
    size: 350,
    header: "RFP/Instructions",
    cell: (props) => {
      const analysis = props.row.original;
      const title = props.getValue() || `Analysis ${analysis.id.slice(0, 8)}`;
      const truncatedTitle = title.length > 35 ? `${title.slice(0, 35)}...` : title;

      return (
        <div className="flex flex-col space-y-1">
          <Link
            href={`/app/comparative/analysis/${analysis.id}`}
            className="font-medium text-foreground hover:text-primary hover:underline"
            title={title}
          >
            {truncatedTitle}
          </Link>
          {analysis.instructions && (
            <div className="line-clamp-2 text-sm text-muted-foreground">
              {analysis.instructions.slice(0, 100)}
              {analysis.instructions.length > 100 ? "..." : ""}
            </div>
          )}
        </div>
      );
    },
  }),

  columnHelper.accessor("proposal_count", {
    size: 180,
    header: "Proposals",
    cell: (props) => {
      const analysis = props.row.original;
      const count = props.getValue();

      return (
        <Link
          href={`/app/comparative/analysis/${analysis.id}`}
          className="block space-y-1 hover:opacity-80 transition-opacity"
        >
          <div className="text-sm text-foreground font-medium">
            {count} {count === 1 ? "proposal" : "proposals"}
          </div>
          {analysis.rfp_filename && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <FileText className="h-3 w-3" />
              <span className="truncate max-w-[150px]">{analysis.rfp_filename}</span>
            </div>
          )}
          <div className="text-xs text-primary hover:underline font-medium">
            View more details →
          </div>
        </Link>
      );
    },
  }),

  columnHelper.accessor("user_name", {
    size: 150,
    header: "Created by",
    cell: (props) => {
      const name = props.getValue() || "Unknown";
      return <div className="text-sm text-foreground">{name}</div>;
    },
  }),

  columnHelper.accessor("created_at", {
    size: 150,
    header: "Created",
    cell: (props) => {
      const createdAt = props.getValue();
      return (
        <div className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
        </div>
      );
    },
  }),

  columnHelper.display({
    id: "actions",
    size: 60,
    header: "",
    cell: (props) => {
      const analysis = props.row.original;

      return (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link
                  href={`/app/comparative/analysis/${analysis.id}`}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={`/app/comparative/analysis/${analysis.id}`}
                  target="_blank"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open in New Tab
                </Link>
              </DropdownMenuItem>
              {/* Archive button */}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  }),
];
