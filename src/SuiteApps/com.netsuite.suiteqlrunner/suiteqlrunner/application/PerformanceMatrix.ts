import {QueryExecutionMeta} from '../domain/models';

const METRICS: ReadonlyArray<readonly [string, string, string]> = [
  ['Execution mode', 'executionMode', 'mode'],
  ['Query API', 'queryApi', 'method'],
  ['Auto paged fallback', 'autoPagedFallback', 'boolean'],
  ['Client validation', 'clientValidationMs', 'ms'],
  ['Request latency', 'requestLatencyMs', 'ms'],
  ['Server execution', 'serverExecutionMs', 'ms'],
  ['Rows returned', 'returnedRows', 'rows'],
  ['Total result count', 'resultCount', 'rows'],
  ['Truncated', 'truncated', 'boolean'],
  ['Columns', 'columnCount', 'columns'],
  ['Pages fetched', 'pagesFetched', 'pages'],
  ['Page size', 'pageSize', 'rows/page'],
  ['Max pages', 'maxPages', 'pages'],
  ['Row capacity', 'rowCapacity', 'rows'],
  ['Usage consumed', 'usageConsumed', 'units'],
  ['HTTP status', 'httpStatus', 'code']
];

export function buildPerformanceRows(meta: QueryExecutionMeta) {
  return METRICS.map(([metric, key, unit]) => ({
    metric,
    value: meta[key] === undefined || meta[key] === null ? '-' : String(meta[key]),
    unit
  }));
}
