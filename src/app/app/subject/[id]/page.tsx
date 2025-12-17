import { redirect } from "next/navigation";
import { db } from "@/server/db";

export default async function ViewSubjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const subject = await db.subject.findUnique({
    where: { id },
    select: { 
      djangoAnalysisIds: true,
    },
  });

  if (!subject) {
    redirect("/app");
  }

  const routeMap: Record<string, string> = {
    "ANALYSIS": "analysis",
    "LANDSCAPE_ANALYSIS": "landscape",
    "COUNTERPOINT": "counterpoint",
    "SUMMARY": "summary",
    "FINANCIAL_ANALYSIS": "counterpoint",
    "BIAS": "bias",
    "LEADERSHIP_ANALYSIS": "leadership",
    "PROGRAM_ANALYSIS": "program",
  };

  let chatType = "ANALYSIS";
  
  if (subject.djangoAnalysisIds) {
    try {
      const analysisIds = subject.djangoAnalysisIds as Record<string, string>;
      const existingType = Object.keys(analysisIds).find(key => analysisIds[key]);
      if (existingType) {
        chatType = existingType;
      }
    } catch (error) {
      console.error("Failed to parse djangoAnalysisIds:", error);
    }
  }

  const route = routeMap[chatType] || "analysis";
  redirect(`/app/subject/${id}/${route}`);
}
