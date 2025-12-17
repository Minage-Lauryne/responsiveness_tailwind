

export type AnalysisType =
  | "ANALYSIS"
  | "BIAS"
  | "COUNTERPOINT"
  | "LANDSCAPE_ANALYSIS"
  | "SUMMARY"
  | "BOARD_MEMO"
  | "COMPREHENSIVE_REPORT"
  | "DISCUSSION_QUESTIONS"
  | "FINANCIAL_ANALYSIS"
  | "LEADERSHIP_ANALYSIS"
  | "PROGRAM_ANALYSIS"
  | "RELEVANT_RESEARCH"
  | "SITE_VISIT_PREP_GUIDE"
  | "STRATEGIC_PLANNING_GUIDE"
  | "DATA_CITATION"
  | "NARRATIVE";

export type AnalysisMode = "standard" | "query_based" | "context_aware" | "";

export interface GenerateUploadURLsRequest {
  filenames: string[];
  chat_type: AnalysisType;
  domain?: string;
  parent_analysis_id?: string;
}

export interface DocumentUpload {
  upload_url: string;
  file_path: string;
  filename: string;
}

export interface GenerateUploadURLsResponse {
  analysis_id: string;
  document_uploads: DocumentUpload[];
}

export interface CreateAnalysisRequest {
  document_paths?: string[];
  message?: string;
  chat_type: AnalysisType;
  domain?: string;
  top_k?: number; 
  max_tokens?: number; 
  parent_analysis_id?: string;
}

export interface Citation {
  text: string;
  source: string;
  page?: number;
  url?: string;
}

export interface FileMetadata {
  filename: string;
  length: number;
  storage_path: string;
}

export interface ContentAnalysis {
  total_documents: number;
  total_chars: number;
  total_words: number;
  avg_document_size: number;
  query_only?: boolean;
}

export interface SingleAnalysisResponse {
  id: string;
  title: string;
  chat_type: AnalysisType;
  chat_type_display: string;
  domain: string;

  analysis_mode: AnalysisMode;
  user_query: string;

  response_text: string;
  citations: Citation[];

  has_research: boolean;
  num_sources: number;
  source_type: "none" | "research" | "documents";

  file_count: number;
  file_metadata: FileMetadata[];
  content_analysis: ContentAnalysis;
  storage_paths: string[];

  parent_analysis: string | null;
  context_aware: boolean;
  context_used: boolean;

  user_name: string;
  user_email: string;
  organization_id: string | null;
  organization_name: string;

  generation_status: "generating" | "completed" | "failed";

  created_at: string;
  updated_at: string;

  is_initial_analysis: boolean;
  specialized_analyses_count: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  citations?: Citation[];
  has_research?: boolean;
  num_sources?: number;
}

export interface ChatRequest {
  analysis_id: string;
  message: string;
  domain?: string;
  top_k?: number; 
  max_tokens?: number;
}

export interface ChatResponse {
  session_id: string;
  analysis_id: string;
  messages: ChatMessage[];
  user_message?: ChatMessage;
  ai_message?: ChatMessage;
}

export interface SingleAnalysisListItem {
  id: string;
  title: string;
  chat_type: AnalysisType;
  chat_type_display: string;
  analysis_mode: AnalysisMode;
  file_count: number;
  has_research: boolean;
  parent_analysis: string | null;
  created_at: string;
  updated_at: string;
}
