"use client";

import { Button } from "@/components/ui/button";
import { createColumnHelper } from "@tanstack/react-table";
import { inferRouterOutputs } from "@trpc/server";
import { type AppRouter } from "@/server/api/root";
import { formatDistanceToNow } from "date-fns";
import {
  Eye,
  FileText,
  MoreHorizontal,
  ExternalLink,
  Archive,
} from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { RoleOnlyView } from "@/components/organization/role-guard";
import { getCreatorDisplayName } from "@/lib/utils/user-deletion";

type RouterOutput = inferRouterOutputs<AppRouter>;
type SubjectListItem = RouterOutput["subject"]["list"][number];

const columnHelper = createColumnHelper<SubjectListItem>();

function ArchiveButton({ subjectId }: { subjectId: string }) {
  const utils = api.useUtils();
  const archiveMutation = api.subject.archive.useMutation({
    onSuccess: async () => {
      await utils.subject.list.invalidate();
      toast.success("Archived ✔️");
    },
  });

  const handleArchive = () => {
    archiveMutation.mutate(subjectId);
  };

  return (
    <DropdownMenuItem
      onClick={handleArchive}
      disabled={archiveMutation.isLoading}
      className="flex items-center gap-2 cursor-pointer"
    >
      <Archive className="h-4 w-4" />
      Archive
    </DropdownMenuItem>
  );
}

export const columns = [
  columnHelper.accessor("title", {
    size: 400,
    header: "Title",
    cell: (props) => {
      const subject = props.row.original;
      const title = props.getValue() || `Analysis ${subject.id.slice(0, 8)}`;
      const truncatedTitle = title.length > 35 ? `${title.slice(0, 35)}...` : title;

      return (
        <div className="flex flex-col space-y-1">
          <Link
            href={`/app/subject/${subject.id}`}
            className="font-medium text-foreground hover:text-primary hover:underline"
            title={title}
          >
            {truncatedTitle}
          </Link>
          {subject.context && (
            <div className="line-clamp-2 text-sm text-muted-foreground">
              {subject.context}
            </div>
          )}
        </div>
      );
    },
  }),

  columnHelper.accessor("documents", {
    size: 280,
    header: "Documents",
    cell: (props) => {
      const documents = props.getValue();
      const subject = props.row.original;

      if (!documents || documents.length === 0) {
        return (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            No documents
          </div>
        );
      }

      return (
        <div className="space-y-1">
          {documents.slice(0, 2).map((doc, index) => {
            const truncatedName = doc.name.length > 35 ? `${doc.name.slice(0, 35)}...` : doc.name;
            return (
              <div key={index} className="flex items-center gap-2 text-sm">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                <Link
                  href={`/app/subject/${subject.id}`}
                  className="text-foreground hover:text-primary hover:underline"
                  title={doc.name}
                >
                  {truncatedName}
                </Link>
              </div>
            );
          })}
          {documents.length > 2 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-3.5 w-3.5" />
              <span>+{documents.length - 2} more</span>
            </div>
          )}
        </div>
      );
    },
  }),

  columnHelper.accessor("createdBy", {
    size: 140,
    header: "Created By",
    cell: (props) => {
      const subject = props.row.original;
      const creator = subject.originalCreatedBy || props.getValue();
      const name = getCreatorDisplayName(creator);
      const isDeleted = !!creator?.deletedAt;

      return (
        <div className={`text-sm ${isDeleted ? 'text-muted-foreground italic' : 'text-foreground'}`}>
          {name}
        </div>
      );
    },
  }),

  columnHelper.accessor("createdAt", {
    size: 140,
    header: "Created",
    cell: (props) => {
      const createdAt = props.getValue();

      return (
        <div className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(createdAt), {
            addSuffix: true,
          })}
        </div>
      );
    },
  }),

  columnHelper.display({
    id: "actions",
    size: 60,
    header: "",
    cell: (props) => {
      const subject = props.row.original;

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
                  href={`/app/subject/${subject.id}`}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={`/app/subject/${subject.id}`}
                  target="_blank"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open in New Tab
                </Link>
              </DropdownMenuItem>
              <RoleOnlyView allowedRoles={['ADMIN']}><ArchiveButton subjectId={subject.id} /></RoleOnlyView>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  }),
];