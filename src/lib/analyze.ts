import type { AnalysisData } from "@/app/app/comparative/analysis/types";

export function normalizeBackendSubmission(submission: any): AnalysisData {
  const s = submission ?? {};

  const mapVerification = (p: any) => {
    const v = p.verification ?? {};
    return {
      org_name: v.org_name ?? v.organization_name ?? p.organization_name ?? "",
      name_confidence: typeof v.name_confidence === "number" ? v.name_confidence : (v.name_confidence ? Number(v.name_confidence) : undefined),
      verified: typeof v.verified === "boolean" ? v.verified : Boolean(v.verified),
      ein: v.ein ?? v.tax_id ?? null,
      legal_name: v.legal_name ?? "",
      irs_confidence: typeof v.irs_confidence === "number" ? v.irs_confidence : (v.irs_confidence ? Number(v.irs_confidence) : undefined),
      revenue: typeof v.revenue === "number" ? v.revenue : (v.revenue ? Number(v.revenue) : null),
      assets: typeof v.assets === "number" ? v.assets : (v.assets ? Number(v.assets) : null),
      tax_status: v.tax_status ?? "",
      filing_status: v.filing_status ?? "",
      tax_year: v.tax_year ?? "",
      sanction_checked: typeof v.sanction_checked === "boolean" ? v.sanction_checked : Boolean(v.sanction_checked),
      sanction_clear: typeof v.sanction_clear === "boolean" ? v.sanction_clear : (v.sanction_clear === null ? null : Boolean(v.sanction_clear)),
      sanction_details: v.sanction_details ?? [],
      sanction_lists: v.sanction_lists ?? [],
      risk_level: v.risk_level ?? "",
      verified_at: v.verified_at ?? null,
    };
  };

  const proposals = (s.proposals ?? []).map((p: any) => {
    const verification = mapVerification(p);

    const organization_name_display = (verification.org_name && String(verification.org_name).trim().length > 0)
      ? String(verification.org_name).trim()
      : (p.organization_name ?? p.filename ?? "Unknown");

    return {
      organization_name: organization_name_display,
      filename: p.filename ?? p.organization_name ?? "unknown.pdf",
      file_url: p.file_url ?? p.proposal_file ?? null,
      recommendation: p.recommendation ?? "Unscored",
      budget: p.budget ?? "Not specified",
      timeline: p.timeline ?? "Not specified",
      overall_alignment_score: p.overall_alignment_score ?? p.score ?? 0,
      alignment: {
        what_text: p.alignment?.what_text ?? p.analysis?.alignment?.what_text ?? "",
        what_aligned: p.alignment?.what_aligned ?? p.analysis?.alignment?.what_aligned ?? false,
        how_text: p.alignment?.how_text ?? p.analysis?.alignment?.how_text ?? "",
        how_aligned: p.alignment?.how_aligned ?? p.analysis?.alignment?.how_aligned ?? false,
        who_text: p.alignment?.who_text ?? p.analysis?.alignment?.who_text ?? "",
        who_aligned: p.alignment?.who_aligned ?? p.analysis?.alignment?.who_aligned ?? false,
        why_text: p.alignment?.why_text ?? p.analysis?.alignment?.why_text ?? "",
      },
      evidence: {
        what: p.evidence?.what ?? p.analysis?.evidence?.what ?? [],
        how: p.evidence?.how ?? p.analysis?.evidence?.how ?? [],
        who: p.evidence?.who ?? p.analysis?.evidence?.who ?? [],
      },
      verification,
    };
  });

  const final = s.final_recommendation ?? s.finalRecommendation ?? null;

  const finalRecommendationNormalized = final
    ? {
        final_recommendation: final.final_recommendation ?? final.summary ?? final.text ?? "",
        recommended_proposal: final.recommended_proposal ?? final.recommendedProposal ?? null,
        recommended_organization: final.recommended_organization ?? final.recommendedOrganization ?? null,
        comparative_analysis: final.comparative_analysis ?? final.comparativeAnalysis ?? final.text ?? "",
        key_findings: final.key_findings ?? final.keyFindings ?? [],
        selection_criteria_used: final.selection_criteria_used ?? final.selectionCriteriaUsed ?? {},
      }
    : undefined;

  const normalized: AnalysisData = {
    rfp_id: s.rfp_id ?? s.id ?? "",
    rfp_title: s.rfp_title ?? s.title ?? "",
    rfp_file_url: s.rfp_file_url ?? (s.rfp_file ? (typeof s.rfp_file === "string" ? s.rfp_file : s.rfp_file.url) : null),
    rfp_summary: s.rfp_summary ?? s.rfpSummary ?? {},
    proposals,
    final_recommendation: finalRecommendationNormalized,
    analysis_type: s.analysis_type ?? null,
    instructions: s.instructions ?? "",
  };

  return normalized;
}

export async function fetchAnalyses() {
  try {
    const response = await fetch(`/api/analyze`, { 
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include", 
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error("fetchAnalyses error: " + (error as Error).message);
  }
}

export async function submitAnalysis(formData: FormData) {
  try {
    const response = await fetch(`/api/analyze`, { 
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      const txt = await response.text();
      throw new Error(txt || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error("submitAnalysis error: " + (error as Error).message);
  }
}


export function formatTimeline(text?: string | null, maxLen = 40): { short: string; full: string } {
  const full = text ? String(text).trim() : "";

  if (!full) {
    return { short: "-", full: "" };
  }

  const rangeRegex = /(\d{1,3}\s*(?:–|-|to)\s*\d{1,3}\s*(?:months?|years?|yrs?|mos?))/i;
  const singleRegex = /(\d{1,3}\s*(?:months?|years?|yrs?|mos?))/i;

  const rangeMatch = full.match(rangeRegex);
  if (rangeMatch && rangeMatch[1]) {
    return { short: rangeMatch[1].replace(/\s+/g, " ").trim(), full };
  }

  const singleMatch = full.match(singleRegex);
  if (singleMatch && singleMatch[1]) {
    return { short: singleMatch[1].replace(/\s+/g, " ").trim(), full };
  }

  if (full.length <= maxLen) return { short: full, full };
  const truncated = `${full.substring(0, maxLen).trim()}...`;
  return { short: truncated, full };
}