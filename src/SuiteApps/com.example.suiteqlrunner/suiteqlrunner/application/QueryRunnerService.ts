import {
  HARD_MAX_ROWS,
  DEFAULT_MAX_ROWS
} from '../domain/suiteqlCatalog';
import {
  GatewayExecutionResponse,
  QueryExecutionMeta,
  QueryRunnerGateway,
  QueryRunOutcome
} from '../domain/models';
import {analyzeSuiteQL} from './SuiteQLAnalyzer';

export class QueryRunnerService {
  constructor(private readonly gateway: QueryRunnerGateway) {}

  async run(query: string, maxRowsText: string): Promise<QueryRunOutcome> {
    const clientStartedAt = Date.now();
    const validationStartedAt = Date.now();
    const hints = analyzeSuiteQL(query);
    const clientValidationMs = Date.now() - validationStartedAt;

    try {
      const response = await this.gateway.execute({
        query,
        maxRows: normalizeMaxRows(maxRowsText)
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

function normalizeMaxRows(value: string): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return DEFAULT_MAX_ROWS;
  }

  return Math.min(HARD_MAX_ROWS, Math.max(1, Math.floor(parsed)));
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

