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
  action?: 'RUN_SUITEQL';
  executionMode: QueryExecutionMode;
  query: string;
  maxPages: number;
  pageSize: number;
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

export type QueryExecutionMode = 'RUN_SUITEQL' | 'RUN_SUITEQL_PAGED';

export type RecordChatRole = 'user' | 'assistant';

export interface RecordChatMessage {
  role: RecordChatRole;
  text: string;
}

export interface RecordChatRequest {
  action: 'CHAT_RECORDS';
  message: string;
  history: RecordChatMessage[];
}

export interface RecordChatResponse {
  ok: boolean;
  answer: string;
  messages: RecordChatMessage[];
  meta?: QueryExecutionMeta;
  error?: QueryExecutionError;
}

export interface GatewayRecordChatResponse extends RecordChatResponse {
  httpStatus: number;
}

export interface RecordChatGateway {
  askRecordQuestion(request: RecordChatRequest): Promise<GatewayRecordChatResponse>;
}

export interface RecordChatOutcome {
  messages: RecordChatMessage[];
  meta: QueryExecutionMeta;
  error: string | null;
}

export interface QueryRunOutcome {
  hints: QueryHint[];
  resultRows: Record<string, unknown>[];
  resultColumns: string[];
  performance: QueryExecutionMeta;
  error: string | null;
}

export interface QueryRunOptions {
  executionMode: QueryExecutionMode;
  maxPagesText: string;
  pageSizeText: string;
}
