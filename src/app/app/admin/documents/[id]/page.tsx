"use client";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ResearchDocumentForm,
  Status,
} from "@/features/admin/research-documents/form";
import { LoadingCardSpinner } from "@/features/shared/loading-spinner";
import { api } from "@/trpc/react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FiArrowLeft, FiInfo } from "react-icons/fi";
import { toast } from "sonner";

export default function DocumentDetail() {
  const params = useParams();
  const id = params.id as string;

  const utils = api.useUtils();

  const { data: document, isLoading } = api.researchDocuments.getById.useQuery(
    { id },
    {
      enabled: !!id,
    },
  );

  const handleSubmit = async () => {
    try {
      toast.success("Updated");
      void utils.researchDocuments.getById.invalidate({ id });
    } catch (error) {
      toast.error("Failed to update document");
    }
  };

  if (isLoading) {
    return <LoadingCardSpinner />;
  }

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <h1 className="text-2xl font-bold">Document not found</h1>
        <div className="text-muted-foreground">
          The document you are looking for does not exist.
        </div>
        <Link href="/app/admin">
          <Button className="mt-4">Back to Documents</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/app/admin">
            <Button variant="ghost" size="icon" className="mr-4">
              <FiArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Edit Document</h1>
            <div className="mt-1 text-sm text-muted-foreground">
              Added{" "}
              {formatDistanceToNow(document.uploadDate, { addSuffix: true })}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <ResearchDocumentForm
          initialData={{
            study_title: document.studyTitle,
            abstract: document.abstract,
            citation: document.citation,
            study_link: document.studyLink ?? "",
            gdive_link: document.gdiveLink ?? "",
            meta_analysis_title: document.metaAnalysisTitle ?? "",
            wsipp_link: document.wsippLink ?? "",
            gdrive_meta_analysis_link: document.gdriveMetaAnalysisLink ?? "",
            status: document.status as Status,
            isArchived: document.isArchived,
          }}
          onSubmit={handleSubmit}
          isEditing={true}
          documentId={id}
        />

        {/* Technical Details (Collapsible) */}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              className="flex w-full items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <FiInfo className="h-4 w-4" />
                <span>Technical Details</span>
              </div>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-4 grid grid-cols-1 gap-4 rounded-lg border bg-card p-6 lg:grid-cols-2">
              <div>
                <h3 className="text-sm font-medium">Document Details</h3>
                <dl className="mt-2 space-y-2">
                  <div>
                    <dt className="text-xs text-muted-foreground">ID</dt>
                    <dd className="font-mono text-sm">{document.id}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">File Type</dt>
                    <dd className="font-mono text-sm">{document.fileType}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      Word Count
                    </dt>
                    <dd className="font-mono text-sm">
                      {document.wordCount?.toLocaleString() ?? 0} words
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="text-sm font-medium">Processing Info</h3>
                <dl className="mt-2 space-y-2">
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      Content Chunks
                    </dt>
                    <dd className="font-mono text-sm">
                      {document.chunks.length} chunks
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      Upload Date
                    </dt>
                    <dd className="font-mono text-sm">
                      {document.uploadDate.toLocaleDateString()}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const getStatusColor = () => {
    switch (status) {
      case "FREE":
        return "bg-green-100 text-green-800 border-green-200";
      case "WSIPP":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "PURCHASE":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "NO PDFs AVAILABLE FOR DOWNLOAD":
        return "bg-red-100 text-red-800 border-red-200";
      case "NO LINK TO PDF":
        return "bg-red-100 text-red-800 border-red-200";
      case "ACCESS REQUIRED":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "PHOTOCOPY":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "UNPUBLISHED":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "WORKING PAPER":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${getStatusColor()}`}
    >
      {status}
    </span>
  );
}
