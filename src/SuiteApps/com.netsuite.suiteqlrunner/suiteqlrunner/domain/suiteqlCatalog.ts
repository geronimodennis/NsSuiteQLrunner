import {CompletionItem} from './models';

export const DEFAULT_MAX_PAGES = 50;
export const DEFAULT_PAGE_SIZE = 1000;
export const HARD_MAX_PAGES = 100;
export const HARD_MAX_PAGE_SIZE = 1000;
export const MIN_PAGE_SIZE = 5;

export const SAMPLE_QUERY = `SELECT
    t.id,
    t.tranid,
    t.trandate,
    t.type,
    BUILTIN.DF(t.entity) AS entity_name
FROM
    transaction t
WHERE
    t.mainline = 'T'
ORDER BY
    t.trandate DESC`;

export const KEYWORDS = [
  'SELECT',
  'DISTINCT',
  'FROM',
  'WHERE',
  'JOIN',
  'INNER',
  'LEFT',
  'RIGHT',
  'FULL',
  'OUTER',
  'CROSS',
  'ON',
  'AND',
  'OR',
  'NOT',
  'IN',
  'EXISTS',
  'BETWEEN',
  'LIKE',
  'IS',
  'NULL',
  'GROUP',
  'BY',
  'HAVING',
  'ORDER',
  'ASC',
  'DESC',
  'CASE',
  'WHEN',
  'THEN',
  'ELSE',
  'END',
  'WITH',
  'AS',
  'UNION',
  'ALL',
  'FETCH',
  'FIRST',
  'ROWS',
  'ONLY',
  'OFFSET',
  'ROWNUM',
  'TOP'
];

export const SUITEQL_FUNCTIONS: ReadonlyArray<readonly [string, string, string, string]> = [
  ['BUILTIN.DF', 'BUILTIN.DF(field)', 'SuiteQL', 'Returns the display value for a field reference.'],
  ['BUILTIN.CF', 'BUILTIN.CF(field)', 'SuiteQL', 'Returns consolidated exchange rate field values.'],
  ['BUILTIN.HIERARCHY', 'BUILTIN.HIERARCHY(field, level)', 'SuiteQL', 'Works with hierarchy field values.'],
  ['BUILTIN.NAMED_GROUP', 'BUILTIN.NAMED_GROUP(field, group)', 'SuiteQL', 'Filters records by a named group.'],
  ['BUILTIN.PERIOD', 'BUILTIN.PERIOD(period, type)', 'SuiteQL', 'Returns period boundaries or attributes.'],
  ['BUILTIN.RELATIVE_RANGES', 'BUILTIN.RELATIVE_RANGES(range, value)', 'SuiteQL', 'Resolves relative date range values.'],
  ['BUILTIN.RESULT_TYPE', 'BUILTIN.RESULT_TYPE(expression)', 'SuiteQL', 'Returns the result type for an expression.']
];

export const ORACLE_FUNCTIONS: ReadonlyArray<readonly [string, string, string, string]> = [
  ['ABS', 'ABS(number)', 'Oracle', 'Absolute value.'],
  ['ADD_MONTHS', 'ADD_MONTHS(date, months)', 'Oracle', 'Adds months to a date.'],
  ['CAST', 'CAST(expression AS type)', 'Oracle', 'Converts an expression to another data type.'],
  ['CEIL', 'CEIL(number)', 'Oracle', 'Smallest integer greater than or equal to a number.'],
  ['COALESCE', 'COALESCE(value1, value2)', 'Oracle', 'Returns the first non-null value.'],
  ['COUNT', 'COUNT(*)', 'Oracle', 'Counts rows or non-null values.'],
  ['CURRENT_DATE', 'CURRENT_DATE', 'Oracle', 'Current session date.'],
  ['DENSE_RANK', 'DENSE_RANK() OVER (ORDER BY expression)', 'Oracle', 'Analytic dense rank.'],
  ['EXTRACT', 'EXTRACT(YEAR FROM date)', 'Oracle', 'Extracts a date part.'],
  ['FLOOR', 'FLOOR(number)', 'Oracle', 'Largest integer less than or equal to a number.'],
  ['LOWER', 'LOWER(text)', 'Oracle', 'Lowercase text.'],
  ['MAX', 'MAX(expression)', 'Oracle', 'Maximum value.'],
  ['MIN', 'MIN(expression)', 'Oracle', 'Minimum value.'],
  ['MOD', 'MOD(number, divisor)', 'Oracle', 'Remainder after division.'],
  ['NVL', 'NVL(value, fallback)', 'Oracle', 'Replaces null with a fallback value.'],
  ['NVL2', 'NVL2(value, not_null_value, null_value)', 'Oracle', 'Conditional null replacement.'],
  ['RANK', 'RANK() OVER (ORDER BY expression)', 'Oracle', 'Analytic rank.'],
  ['ROUND', 'ROUND(value, precision)', 'Oracle', 'Rounds number or date values.'],
  ['ROW_NUMBER', 'ROW_NUMBER() OVER (ORDER BY expression)', 'Oracle', 'Analytic row number.'],
  ['SUBSTR', 'SUBSTR(text, start, length)', 'Oracle', 'Returns a substring.'],
  ['SUM', 'SUM(expression)', 'Oracle', 'Sums numeric values.'],
  ['SYSDATE', 'SYSDATE', 'Oracle', 'Database server date.'],
  ['TO_CHAR', 'TO_CHAR(value, format)', 'Oracle', 'Formats dates or numbers as text.'],
  ['TO_DATE', 'TO_DATE(text, format)', 'Oracle', 'Parses text as a date.'],
  ['TRUNC', 'TRUNC(value, precision)', 'Oracle', 'Truncates date or numeric values.'],
  ['UPPER', 'UPPER(text)', 'Oracle', 'Uppercase text.']
];

export const COMMON_RECORDS = [
  'account',
  'accountingbook',
  'classification',
  'currency',
  'customer',
  'department',
  'employee',
  'entity',
  'item',
  'location',
  'subsidiary',
  'transaction',
  'transactionaccountingline',
  'transactionline',
  'vendor'
];

export const FORBIDDEN_MUTATION_KEYWORDS = [
  'ALTER',
  'CREATE',
  'DELETE',
  'DROP',
  'GRANT',
  'INSERT',
  'MERGE',
  'REPLACE',
  'REVOKE',
  'TRUNCATE',
  'UPDATE'
];

export const SQL_SERVER_PATTERNS: ReadonlyArray<readonly [string, string]> = [
  ['GETDATE', 'Use SYSDATE or CURRENT_DATE instead of SQL Server GETDATE().'],
  ['DATEADD', 'Use Oracle date arithmetic or ADD_MONTHS where applicable.'],
  ['DATEDIFF', 'Use Oracle date subtraction or EXTRACT-based expressions.'],
  ['LEN', 'Use LENGTH for Oracle-style string length.'],
  ['ISNULL', 'Use NVL or COALESCE for Oracle-style null handling.'],
  ['CONVERT', 'Use CAST, TO_CHAR, TO_DATE, or TO_NUMBER.']
];

export const COMPLETIONS: CompletionItem[] = [
  ...KEYWORDS.map((keyword) => ({
    name: keyword,
    insert: keyword,
    type: 'Keyword',
    description: 'SuiteQL keyword'
  })),
  ...SUITEQL_FUNCTIONS.map(([name, insert, type, description]) => ({name, insert, type, description})),
  ...ORACLE_FUNCTIONS.map(([name, insert, type, description]) => ({name, insert, type, description})),
  ...COMMON_RECORDS.map((name) => ({
    name,
    insert: name,
    type: 'Record',
    description: 'Common NetSuite record or dataset name'
  }))
];
