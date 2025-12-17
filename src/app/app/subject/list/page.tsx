"use client";

import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { LoadingCardSpinner } from "@/features/shared/loading-spinner";
import { type AppRouter } from "@/server/api/root";
import { api } from "@/trpc/react";
import { type ColumnDef } from "@tanstack/react-table";
import { type inferRouterOutputs } from "@trpc/server";
import { FileText, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { columns } from "./columns";
// import { comparativeColumns } from "./comparative-columns";
import { cn } from "@/lib/utils";
// import type { ComparativeAnalysisListItem } from "@/services/django-api";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getCreatorDisplayName } from "@/lib/utils/user-deletion";

type RouterOutput = inferRouterOutputs<AppRouter>;
type SubjectListItem = RouterOutput["subject"]["list"][number];
// type AnalysisTab = "single" | "comparative";
type AnalysisTab = "single"; 

export default function SubjectListPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<AnalysisTab>("single");
  // const [comparativeAnalyses, setComparativeAnalyses] = useState<ComparativeAnalysisListItem[]>([]);
  // const [comparativeLoading, setComparativeLoading] = useState(false);
  // const [comparativeError, setComparativeError] = useState<string | null>(null);

  const { data: subjects, isLoading: singlesLoading } = api.subject.list.useQuery({ limit: 0 });

  // useEffect(() => {
  //   async function fetchComparative() {
  //     setComparativeLoading(true);
  //     setComparativeError(null);
  //     try {
  //       const response = await fetch("/api/analyze", {
  //         method: "GET",
  //         credentials: "include",
  //         cache: "no-store",
  //       });
  //
  //       if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
  //
  //       const data = await response.json();
  //       setComparativeAnalyses(data);
  //     } catch (error) {
  //       console.error("Failed to fetch comparative analyses:", error);
  //       setComparativeError((error as Error).message);
  //     } finally {
  //       setComparativeLoading(false);
  //     }
  //   }
  //
  //   if (activeTab === "comparative") fetchComparative();
  // }, [activeTab]);

  const filteredSubjects = useMemo(() => {
    if (!subjects || !searchQuery.trim()) return subjects || [];
    const query = searchQuery.toLowerCase().trim();
    return subjects.filter((subject) => {
      const title = subject.title || `Analysis ${subject.id.slice(0, 8)}`;
      if (title.toLowerCase().includes(query)) return true;
      if (subject.context?.toLowerCase().includes(query)) return true;
      if (subject.documents?.some((doc) => doc.name.toLowerCase().includes(query))) return true;
      const creatorName = getCreatorDisplayName(subject.createdBy);
      if (creatorName.toLowerCase().includes(query)) return true;
      return false;
    });
  }, [subjects, searchQuery]);

  // const filteredComparative = useMemo(() => {
  //   if (!searchQuery.trim()) return comparativeAnalyses;
  //   const query = searchQuery.toLowerCase().trim();
  //   return comparativeAnalyses.filter((analysis) => {
  //     if (analysis.title.toLowerCase().includes(query)) return true;
  //     if (analysis.rfp_filename.toLowerCase().includes(query)) return true;
  //     if (analysis.instructions.toLowerCase().includes(query)) return true;
  //     if (analysis.user_name.toLowerCase().includes(query)) return true;
  //     return false;
  //   });
  // }, [comparativeAnalyses, searchQuery]);

  const isLoading = singlesLoading; // activeTab === "single" ? singlesLoading : comparativeLoading;
  const hasData = subjects && subjects.length > 0; // activeTab === "single" ? (subjects && subjects.length > 0) : (comparativeAnalyses.length > 0);
  const hasFilteredResults = filteredSubjects.length > 0; // activeTab === "single" ? filteredSubjects.length > 0 : filteredComparative.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-8 p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">All Analysis</h1>
            <p className="text-muted-foreground">Manage and view all your analysis.</p>
          </div>
          <Link href="/app/subject"> {/* activeTab === "single" ? "/app/subject" : "/app/comparative/create" */}
            <div className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
              <Plus className="h-4 w-4" />
               Create analysis
            </div>
          </Link>
        </div>

        <div className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20"><LoadingCardSpinner /></div>
          ) : hasData ? (
            <div className="space-y-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search analyses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              {hasFilteredResults ? (
                <DataTable
                  columns={columns as unknown as ColumnDef<SubjectListItem, unknown>[]}
                  data={filteredSubjects}
                />
              ) : searchQuery.trim() ? (
                <NoResults searchQuery={searchQuery} />
              ) : null}
            </div>
          ) : (
            <EmptyState tab="single" />
          )}
        </div>

        {/* <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AnalysisTab)} className="w-full">
          <TabsList className="bg-[#e1f2fe] w-full mb-6 grid grid-cols-2">
            <TabsTrigger value="single" className="flex-1">Single Analysis</TabsTrigger>
            <TabsTrigger value="comparative" className="flex-1">Comparative Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="single">
            {isLoading ? (
              <div className="flex items-center justify-center py-20"><LoadingCardSpinner /></div>
            ) : hasData ? (
              <div className="space-y-4">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search analyses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {hasFilteredResults ? (
                  <DataTable
                    columns={columns as unknown as ColumnDef<SubjectListItem, unknown>[]}
                    data={filteredSubjects}
                  />
                ) : searchQuery.trim() ? (
                  <NoResults searchQuery={searchQuery} />
                ) : null}
              </div>
            ) : (
              <EmptyState tab="single" />
            )}
          </TabsContent>

          <TabsContent value="comparative">
            {isLoading ? (
              <div className="flex items-center justify-center py-20"><LoadingCardSpinner /></div>
            ) : comparativeError ? (
              <ErrorState message={comparativeError} />
            ) : hasData ? (
              <div className="space-y-4">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search analyses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {hasFilteredResults ? (
                  <DataTable
                    columns={comparativeColumns as unknown as ColumnDef<ComparativeAnalysisListItem, unknown>[]}
                    data={filteredComparative}
                  />
                ) : searchQuery.trim() ? (
                  <NoResults searchQuery={searchQuery} />
                ) : null}
              </div>
            ) : (
              <EmptyState tab="comparative" />
            )}
          </TabsContent>
        </Tabs> */}
      </div>
    </div>
  );
}

function NoResults({ searchQuery }: { searchQuery: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted py-20">
      <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <Search className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">No results found</h3>
        <p className="mb-4 mt-2 text-sm text-muted-foreground">
          No analyses match your search for "{searchQuery}". Try a different search term.
        </p>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-red-200 bg-red-50 py-20">
      <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
        <h3 className="mt-4 text-lg font-semibold text-red-800">Error loading analyses</h3>
        <p className="mb-4 mt-2 text-sm text-red-600">{message}</p>
      </div>
    </div>
  );
}

function EmptyState({ tab }: { tab: "single" | "comparative" }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted py-20">
      <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <FileText className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">No analysis yet</h3>
        <p className="mb-4 mt-2 text-sm text-muted-foreground">
          You haven't created any {tab} analyses yet. Get started by creating your first analysis.
        </p>
        <Link href={tab === "single" ? "/app/subject" : "#"}>
          <div className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Create Your First Analysis
          </div>
        </Link>
      </div>
    </div>
  );
}