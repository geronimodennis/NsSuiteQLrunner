export type HintSeverity = 'error' | 'warning' | 'info';

export interface QueryHint {
  severity: HintSeverity;
  message: string;
  detail: string;
}

export interface CompletionItem {
  name: string;
  insert: string;
  type: string;
  description: string;
}

export interface QueryExecutionRequest {
  query: string;
  maxRows: number;
  pageSize?: number;
  params?: unknown[];
}

export interface QueryExecutionError {
  code?: string;
  name?: string;
  message?: string;
  stack?: string | null;
}

export interface QueryExecutionMeta {
  [key: string]: unknown;
}

export interface QueryExecutionResponse {
  ok: boolean;
  rows: Record<string, unknown>[];
  columns: string[];
  meta?: QueryExecutionMeta;
  error?: QueryExecutionError;
}

export interface GatewayExecutionResponse extends QueryExecutionResponse {
  httpStatus: number;
}

export interface QueryRunnerGateway {
  execute(request: QueryExecutionRequest): Promise<GatewayExecutionResponse>;
}

export interface QueryRunOutcome {
  hints: QueryHint[];
  resultRows: Record<string, unknown>[];
  resultColumns: string[];
  performance: QueryExecutionMeta;
  error: string | null;
}

