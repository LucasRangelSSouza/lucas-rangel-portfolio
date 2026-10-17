export type Citation = {
  chunk_id?: string;
  document_id?: string;
  title: string;
  source_uri: string;
  license_note?: string;
  dataset?: {
    slug: string;
    version: number;
    manifest_sha256?: string;
  };
  record_ids?: string[];
  query?: { sql: string; columns: string[]; rows: (string | number | boolean | null)[][]; explanation?: string };
  score?: number;
};

export type SearchMode = "lexical" | "hybrid";

export type Answer = {
  status: "answered" | "abstained" | "refused";
  answer: string;
  citations: Citation[];
  safety_reason?: string | null;
  grounded?: boolean;
  /** "lexical" while embeddings are off; "hybrid" when vector search is fused with text search. */
  search_mode?: SearchMode;
};

export type CorpusInfo = {
  id: string;
  label: string;
  release_version?: string;
  data_cutoff?: string;
  record_count?: number;
};

export type CorpusHealth = {
  corpora?: CorpusInfo[];
  status: "ready" | "degraded" | "pending" | "unavailable";
  corpus_name: string;
  release_version?: string;
  data_cutoff?: string;
  table_count?: number;
  record_count?: number;
  model_status?: "ready" | "extractive" | "unavailable";
  search_mode?: SearchMode;
  db_unavailable?: boolean;
};
