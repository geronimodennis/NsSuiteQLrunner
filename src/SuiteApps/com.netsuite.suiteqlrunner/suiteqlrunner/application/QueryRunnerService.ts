import {
  DEFAULT_MAX_PAGES,
  DEFAULT_PAGE_SIZE,
  HARD_MAX_PAGES,
  HARD_MAX_PAGE_SIZE,
  MIN_PAGE_SIZE
} from '../domain/suiteqlCatalog';
import {
  GatewayExecutionResponse,
  QueryExecutionMeta,
  QueryRunnerGateway,
  QueryRunOptions,
  QueryRunOutcome
} from '../domain/models';
import {analyzeSuiteQL} from './SuiteQLAnalyzer';

export class QueryRunnerService {
  constructor(private readonly gateway: QueryRunnerGateway) {}

  async run(query: string, options: QueryRunOptions): Promise<QueryRunOutcome> {
    const clientStartedAt = Date.now();
    const validationStartedAt = Date.now();
    const hints = analyzeSuiteQL(query);
    const clientValidationMs = Date.now() - validationStartedAt;

    try {
      const response = await this.gateway.execute({
        executionMode: options.executionMode,
        query,
        maxPages: normalizeMaxPages(options.maxPagesText),
        pageSize: normalizePageSize(options.pageSizeText)
      });
      const performance = buildPerformance(response, clientValidationMs, Date.now() - clientStartedAt);

      if (!response.ok) {
        return {
          hints,
          resultRows: [],
          resultColumns: [],
          performance,
          error: formatExecutionError(response)
        };
      }

      return {
        hints,
        resultRows: response.rows || [],
        resultColumns: response.columns || [],
        performance,
        error: null
      };
    } catch (error) {
      return {
        hints,
        resultRows: [],
        resultColumns: [],
        performance: {
          clientValidationMs,
          requestLatencyMs: Date.now() - clientStartedAt
        },
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}

function normalizeMaxPages(value: string): number {
  return normalizeNumber(value, 1, HARD_MAX_PAGES, DEFAULT_MAX_PAGES);
}

function normalizePageSize(value: string): number {
  return normalizeNumber(value, MIN_PAGE_SIZE, HARD_MAX_PAGE_SIZE, DEFAULT_PAGE_SIZE);
}

function normalizeNumber(value: string, min: number, max: number, fallback: number): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

function buildPerformance(
  response: GatewayExecutionResponse,
  clientValidationMs: number,
  requestLatencyMs: number
): QueryExecutionMeta {
  return {
    ...(response.meta || {}),
    clientValidationMs,
    requestLatencyMs,
    httpStatus: response.httpStatus
  };
}

function formatExecutionError(response: GatewayExecutionResponse): string {
  const error = response.error || {};
  const lines = [
    error.name || error.code || 'SuiteQL execution error',
    error.message || 'NetSuite returned an error while executing the query.'
  ];

  if (error.stack) {
    lines.push('', error.stack);
  }

  return lines.join('\n');
}
