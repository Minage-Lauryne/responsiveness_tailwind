export type EvidenceSource = {
  chunk_id: string;
  paper_id: string;
  filename: string;
  section: string;
  domain: string;
  quote: string;
  relevance: string;
};

export type AlignmentDetail = {
  score: number;
  summary: string;
  evidence_sources: EvidenceSource[];
};

export type EvidenceAlignment = {
  organization_name: string;
  evidence_alignment_score: number;
  summary: string;
  what_alignment: AlignmentDetail;
  how_alignment: AlignmentDetail;
  who_alignment: AlignmentDetail;
  research_chunks_used?: Array<{
    id: number;
    chunk_id: string;
    paper_id: string;
    filename: string;
    section: string;
    domain: string;
    content: string;
    distance: number;
  }>;
};

export type Proposal = {
  organization_name: string;
  filename: string;
  recommendation: string;
  budget: string;
  timeline: string;
  overall_alignment_score: number;
  alignment: {
    what_text: string;
    what_aligned: boolean;
    how_text: string;
    how_aligned: boolean;
    who_text: string;
    who_aligned: boolean;
    why_text: string;
  };
  evidence: {
    what: string[];
    how: string[];
    who: string[];
  };
  evidence_sources?: {
    what: EvidenceSource[];
    how: EvidenceSource[];
    who: EvidenceSource[];
  };
  verification: {
    org_name: string;
    name_confidence: number;
    verified: boolean;
    ein: string | number | null;
    legal_name: string;
    irs_confidence: number;
    revenue: number | null;
    assets: number | null;
    tax_status: string;
    filing_status: string;
    tax_year: string;
    sanction_checked: boolean;
    sanction_clear: boolean | null;
    sanction_details: any[];
    sanction_lists: any[];
    risk_level: string;
    verified_at: string;
  };
  evidence_alignment?: EvidenceAlignment;
};

export type RfpSummary = {
  title?: string;
  executive_summary: string;
  key_requirements: string[];
  target_population: string;
  budget_range: string;
  timeline_expectations: string;
  evaluation_criteria: string[];
};

export type FinalRecommendation = {
  final_recommendation: string;
  recommended_proposal: string;
  recommended_organization: string;
  comparative_analysis: string;
  key_findings: string[];
  selection_criteria_used: {
    primary_factors: string[];
    risk_considerations: string[];
    value_assessment: string[];
  };
};

export type AnalysisData = {
  rfp_id: string;
  rfp_title: string;
  rfp_file_url?: string | null;
  rfp_summary: RfpSummary;
  proposals: Proposal[];
  final_recommendation?: FinalRecommendation;
  analysis_type?: string;
  instructions?: string;
};