"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { api } from "@/trpc/react";
import { type RouterOutputs } from "@/trpc/shared";
import { useState } from "react";
import { columns } from "./columns";
import { LoadingCardSpinner } from "@/features/shared/loading-spinner";

type ResearchDocumentList =
  RouterOutputs["researchDocuments"]["list"]["items"][number];

export function ResearchDocumentsTable() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading } = api.researchDocuments.list.useQuery({
    page,
    pageSize,
  });

  return (
    <div className="rounded-lg bg-transparent p-6 shadow">
      <div className="mb-4 text-sm text-muted-foreground">
        {(data?.total ?? 0).toLocaleString()} documents indexed
      </div>
      {isLoading ? (
        <LoadingCardSpinner />
      ) : (
        <DataTable
          columns={
            columns as unknown as ColumnDef<ResearchDocumentList, unknown>[]
          }
          data={data?.items ?? []}
          pagination={{
            page,
            pageSize,
            pageCount: data?.pageCount ?? 0,
            total: data?.total ?? 0,
            onPageChange: setPage,
            onPageSizeChange: setPageSize,
          }}
        />
      )}
    </div>
  );
}
