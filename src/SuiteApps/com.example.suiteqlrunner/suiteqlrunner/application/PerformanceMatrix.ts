import {QueryExecutionMeta} from '../domain/models';

const METRICS: ReadonlyArray<readonly [string, string, string]> = [
  ['Client validation', 'clientValidationMs', 'ms'],
  ['Request latency', 'requestLatencyMs', 'ms'],
  ['Server execution', 'serverExecutionMs', 'ms'],
  ['Rows returned', 'returnedRows', 'rows'],
  ['Total result count', 'resultCount', 'rows'],
  ['Truncated', 'truncated', 'boolean'],
  ['Columns', 'columnCount', 'columns'],
  ['Pages fetched', 'pagesFetched', 'pages'],
  ['Page size', 'pageSize', 'rows'],
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

