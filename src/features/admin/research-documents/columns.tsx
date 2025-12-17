"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/trpc/react";
import { createColumnHelper } from "@tanstack/react-table";
import { Check, ExternalLink, Eye, Pencil, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { DataTableColumnHeader } from "./column-header";
import { ResearchDocument } from "./types";

const columnHelper = createColumnHelper<ResearchDocument>();

// Separate component for editable study title
function EditableStudyTitle({ file }: { file: ResearchDocument }) {
  const id = file.id;
  const initialValue = file.studyTitle;
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialValue);

  const utils = api.useUtils();
  const updateMutation = api.researchDocuments.update.useMutation({
    onSuccess: () => {
      void utils.researchDocuments.list.invalidate();
      toast.success("Title updated");
      setEditing(false);
    },
    onError: (error) => {
      toast.error(`Error updating title: ${error.message}`);
      setValue(initialValue);
      setEditing(false);
    },
  });

  const onSave = () => {
    if (value.trim() === "") {
      setValue(initialValue);
      setEditing(false);
      return;
    }

    updateMutation.mutate({
      id,
      data: {
        studyTitle: value,
        abstract: file.abstract,
        citation: file.citation,
        studyLink: file.studyLink ?? "",
        gdiveLink: file.gdiveLink ?? undefined,
        metaAnalysisTitle: file.metaAnalysisTitle ?? undefined,
        wsippLink: file.wsippLink ?? undefined,
        gdriveMetaAnalysisLink: file.gdriveMetaAnalysisLink ?? undefined,
        status: file.status,
      },
    });
  };

  const onCancel = () => {
    setValue(initialValue);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-8 w-[180px]"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") onSave();
            if (e.key === "Escape") onCancel();
          }}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onSave}
          disabled={updateMutation.isLoading}
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onCancel}
          disabled={updateMutation.isLoading}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-2">
      <div className="flex flex-col space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{initialValue}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100"
            onClick={() => setEditing(true)}
          >
            <Pencil className="h-3 w-3" />
          </Button>
        </div>
        {file.metaAnalysisTitle && (
          <span className="text-sm text-muted-foreground">
            Meta Analysis: {file.metaAnalysisTitle}
          </span>
        )}
      </div>
    </div>
  );
}

export const columns = [
  columnHelper.accessor("studyTitle", {
    size: 400,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Study" />
    ),
    cell: ({ row }) => {
      const doc = row.original;
      return (
        <div className="flex flex-col space-y-2 py-2">
          <EditableStudyTitle file={doc} />
          <div className="line-clamp-2 text-sm text-muted-foreground">
            {doc.abstract}
          </div>
          <div className="flex flex-wrap gap-2">
            {doc.studyLink && (
              <a
                href={doc.studyLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Study
              </a>
            )}
            {doc.gdiveLink && (
              <a
                href={doc.gdiveLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                GDive
              </a>
            )}
            {doc.wsippLink && (
              <a
                href={doc.wsippLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                WSIPP
              </a>
            )}
            {doc.gdriveMetaAnalysisLink && (
              <a
                href={doc.gdriveMetaAnalysisLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Meta Analysis
              </a>
            )}
          </div>
        </div>
      );
    },
  }),
  columnHelper.accessor("citation", {
    size: 300,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Citation" />
    ),
    cell: ({ row }) => (
      <div className="line-clamp-3 py-2 text-sm text-muted-foreground">
        {row.original.citation}
      </div>
    ),
  }),
  columnHelper.accessor("status", {
    size: 120,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => <div className="text-sm">{row.original.status}</div>,
  }),
  columnHelper.display({
    id: "actions",
    size: 70,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Actions" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex">
          <Link
            href={`/app/admin/documents/${row.original.id}`}
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            <Eye className="h-4 w-4" />
            View
          </Link>
        </div>
      );
    },
  }),
];
