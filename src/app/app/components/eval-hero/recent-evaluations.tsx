"use client";

import { PromptIcon } from "@/components/ui/icons";
import { api } from "@/trpc/react";
import { ArrowRight, FileText} from "lucide-react";
import Link from "next/link";
// import type { ComparativeAnalysisListItem } from "@/services/django-api";

export function RecentEvaluations() {
  // const [comparativeAnalyses, setComparativeAnalyses] = useState<ComparativeAnalysisListItem[]>([]);
  // const [comparativeLoading, setComparativeLoading] = useState(false);

  const { data: singleAnalyses } = api.subject.list.useQuery({
    limit: 3,
  });

  // useEffect(() => {
  //   async function fetchComparative() {
  //     setComparativeLoading(true);
  //     try {
  //       const response = await fetch("/api/analyze", {
  //         method: "GET",
  //         credentials: "include",
  //         cache: "no-store",
  //       });

  //       if (response.ok) {
  //         const data = await response.json();
  //         const sorted = data
  //           .sort((a: ComparativeAnalysisListItem, b: ComparativeAnalysisListItem) => 
  //             new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  //           )
  //           .slice(0, 3);
  //         setComparativeAnalyses(sorted);
  //       }
  //     } catch (error) {
  //       console.error("Failed to fetch comparative analyses:", error);
  //     } finally {
  //       setComparativeLoading(false);
  //     }
  //   }

  //   fetchComparative();
  // }, []);

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[23.31px] font-semibold leading-[44.12px] text-espresso">
          Your Recent Analyses
        </h2>

        {singleAnalyses && singleAnalyses.length > 0 && (
          <Link
            href="/app/subject/list"
            className="inline-flex items-center justify-center w-[74.58px] h-[29.13px] rounded-[16.32px] border-[1.17px] border-greyish text-[11.65px] font-normal text-greyish mx-3 my-4 transition-opacity hover:opacity-70"
          >
            SEE ALL
          </Link>
        )}
      </div>

      <div className="space-y-4">
        {!singleAnalyses || singleAnalyses.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-granite">
            No recent analyses yet
          </div>
        ) : (
          singleAnalyses.map((analysis) => (
            <Link key={analysis.id} href={`/app/subject/${analysis.id}`}>
              <div className="cursor-pointer rounded-2xl border border-transparent bg-white px-6 py-4 transition-all hover:border-stone hover:shadow-md">
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="font-montserrat text-[20.88px] font-normal leading-[33.8px] text-espresso">
                    {analysis.title || "Untitled Analysis"}
                  </h3>
                  <ArrowRight className="h-5 w-5 flex-shrink-0 text-espresso" />
                </div>

                {analysis.context && (
                  <div className="mb-2 flex items-start gap-2">
                    <PromptIcon className="mt-1 h-4 w-4 flex-shrink-0 text-granite" />
                    <p className="font-montserrat text-[13.98px] font-normal leading-[25.64px] text-granite line-clamp-2">
                      “ {analysis.context}”
                    </p>
                  </div>
                )}

                {analysis.documents && analysis.documents.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-4 w-4 flex-shrink-0 text-granite" />
                    <span className="font-montserrat text-[13.98px] font-normal leading-[25.64px] text-granite">
                      {analysis.documents.map((doc, index) => (
                        <span key={index}>
                          {doc.name}
                          {index < analysis.documents.length - 1 && ", "}
                          {index === 1 && analysis.documents.length > 2 && ` +${analysis.documents.length - 2} more`}
                        </span>
                      ))}
                    </span>
                  </div>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
