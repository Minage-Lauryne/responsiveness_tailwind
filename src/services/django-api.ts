"use client";

import type { AnalysisData } from "@/app/app/comparative/analysis/types";

export type ComparativeAnalysisListItem = {
  id: string;
  title: string;
  analysis_type: "rfp_based" | "instruction_based";
  analysis_type_display: string;
  rfp_filename: string;
  rfp_file_url: string | null;
  rfp_summary: any;
  instructions: string;
  proposal_count: number;
  has_final_recommendation: boolean;
  user_id: string;
  user_name: string;
  user_email: string;
  created_at: string;
  updated_at: string;
};


export async function fetchComparativeAnalyses(): Promise<ComparativeAnalysisListItem[]> {
  const response = await fetch("/api/analyze", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch comparative analyses: ${response.status}`);
  }

  return response.json();
}


export async function fetchComparativeAnalysis(id: string): Promise<AnalysisData> {
  const response = await fetch(`/api/analyze?id=${id}`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch analysis: ${response.status}`);
  }

  return response.json();
}


export async function deleteComparativeAnalysis(id: string): Promise<void> {
  const response = await fetch(`/api/analyze?id=${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to delete analysis: ${error}`);
  }
}