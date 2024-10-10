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

export const CLAUSES: ReadonlyArray<readonly [string, string, string, string]> = [
  ['SELECT', 'SELECT ', 'Clause', 'Starts a SuiteQL SELECT statement.'],
  ['SELECT DISTINCT', 'SELECT DISTINCT ', 'Clause', 'Starts a SELECT statement with duplicate elimination.'],
  ['FROM', 'FROM ', 'Clause', 'Identifies the record or query source.'],
  ['WHERE', 'WHERE ', 'Clause', 'Filters rows returned by a query.'],
  ['INNER JOIN', 'INNER JOIN  ON ', 'Clause', 'Returns rows that match both joined sources.'],
  ['LEFT JOIN', 'LEFT JOIN  ON ', 'Clause', 'Returns matching rows plus unmatched rows from the left source.'],
  ['RIGHT JOIN', 'RIGHT JOIN  ON ', 'Clause', 'Returns matching rows plus unmatched rows from the right source.'],
  ['CROSS JOIN', 'CROSS JOIN ', 'Clause', 'Returns the Cartesian product of two sources.'],
  ['GROUP BY', 'GROUP BY ', 'Clause', 'Groups rows for aggregate calculations.'],
  ['HAVING', 'HAVING ', 'Clause', 'Filters grouped aggregate results.'],
  ['ORDER BY', 'ORDER BY ', 'Clause', 'Sorts query results.'],
  ['UNION', 'UNION ', 'Clause', 'Combines compatible query result sets.'],
  ['UNION ALL', 'UNION ALL ', 'Clause', 'Combines compatible result sets without duplicate elimination.'],
  ['WITH', 'WITH  AS ()', 'Clause', 'Defines a common table expression.'],
  ['CASE', 'CASE WHEN  THEN  ELSE  END', 'Clause', 'Builds conditional values in a SELECT, WHERE, or ORDER expression.'],
  ['FETCH FIRST', 'FETCH FIRST  ROWS ONLY', 'Clause', 'Limits returned rows using Oracle row limiting syntax.'],
  ['OFFSET', 'OFFSET  ROWS', 'Clause', 'Skips rows before returning a result window.']
];

export const SUITEQL_FUNCTIONS: ReadonlyArray<readonly [string, string, string, string]> = [
  ['BUILTIN.DF', 'BUILTIN.DF(field)', 'SuiteQL', 'Returns the display value for a field reference.'],
  ['BUILTIN.CF', 'BUILTIN.CF(field)', 'SuiteQL', 'Returns consolidated exchange rate field values.'],
  ['BUILTIN.CONSOLIDATE', 'BUILTIN.CONSOLIDATE(amount, fromSubsidiary, toSubsidiary, book, period, rateType)', 'SuiteQL', 'Consolidates currency amounts.'],
  ['BUILTIN.CURRENCY', 'BUILTIN.CURRENCY(amount, currency)', 'SuiteQL', 'Formats an amount with currency context.'],
  ['BUILTIN.CURRENCY_CONVERT', 'BUILTIN.CURRENCY_CONVERT(amount, sourceCurrency, targetCurrency, date)', 'SuiteQL', 'Converts an amount between currencies.'],
  ['BUILTIN.HIERARCHY', 'BUILTIN.HIERARCHY(field, level)', 'SuiteQL', 'Works with hierarchy field values.'],
  ['BUILTIN.MNFILTER', 'BUILTIN.MNFILTER(field, operator, values)', 'SuiteQL', 'Filters multiselect field values.'],
  ['BUILTIN.NAMED_GROUP', 'BUILTIN.NAMED_GROUP(field, group)', 'SuiteQL', 'Filters records by a named group.'],
  ['BUILTIN.PERIOD', 'BUILTIN.PERIOD(period, type)', 'SuiteQL', 'Returns period boundaries or attributes.'],
  ['BUILTIN.RELATIVE_RANGES', 'BUILTIN.RELATIVE_RANGES(range, value)', 'SuiteQL', 'Resolves relative date range values.']
];

export const ORACLE_FUNCTIONS: ReadonlyArray<readonly [string, string, string, string]> = [
  ['ABS', 'ABS(number)', 'Oracle', 'Absolute value.'],
  ['ACOS', 'ACOS(number)', 'Oracle', 'Arc cosine.'],
  ['ADD_MONTHS', 'ADD_MONTHS(date, months)', 'Oracle', 'Adds months to a date.'],
  ['APPROX_COUNT_DISTINCT', 'APPROX_COUNT_DISTINCT(expression)', 'Oracle', 'Approximate distinct count.'],
  ['ASCII', 'ASCII(text)', 'Oracle', 'Character code for the first character.'],
  ['ASIN', 'ASIN(number)', 'Oracle', 'Arc sine.'],
  ['ATAN', 'ATAN(number)', 'Oracle', 'Arc tangent.'],
  ['AVG', 'AVG(expression)', 'Oracle', 'Average numeric value.'],
  ['CAST', 'CAST(expression AS type)', 'Oracle', 'Converts an expression to another data type.'],
  ['CEIL', 'CEIL(number)', 'Oracle', 'Smallest integer greater than or equal to a number.'],
  ['CHR', 'CHR(number)', 'Oracle', 'Character for a numeric code.'],
  ['COALESCE', 'COALESCE(value1, value2)', 'Oracle', 'Returns the first non-null value.'],
  ['CONCAT', 'CONCAT(text1, text2)', 'Oracle', 'Concatenates two strings.'],
  ['COUNT', 'COUNT(*)', 'Oracle', 'Counts rows or non-null values.'],
  ['DECODE', 'DECODE(expression, search, result, default)', 'Oracle', 'Oracle conditional expression.'],
  ['DENSE_RANK', 'DENSE_RANK() OVER (ORDER BY expression)', 'Oracle', 'Analytic dense rank.'],
  ['EXTRACT', 'EXTRACT(YEAR FROM date)', 'Oracle', 'Extracts a date part.'],
  ['FLOOR', 'FLOOR(number)', 'Oracle', 'Largest integer less than or equal to a number.'],
  ['GREATEST', 'GREATEST(value1, value2)', 'Oracle', 'Greatest value in a list.'],
  ['INITCAP', 'INITCAP(text)', 'Oracle', 'Capitalizes the first letter of each word.'],
  ['INSTR', 'INSTR(text, substring)', 'Oracle', 'Position of a substring.'],
  ['LAST_DAY', 'LAST_DAY(date)', 'Oracle', 'Last day of the month for a date.'],
  ['LEAST', 'LEAST(value1, value2)', 'Oracle', 'Least value in a list.'],
  ['LENGTH', 'LENGTH(text)', 'Oracle', 'Character length.'],
  ['LOWER', 'LOWER(text)', 'Oracle', 'Lowercase text.'],
  ['LPAD', 'LPAD(text, length, pad_text)', 'Oracle', 'Left-pads text.'],
  ['LTRIM', 'LTRIM(text)', 'Oracle', 'Trims leading characters.'],
  ['MAX', 'MAX(expression)', 'Oracle', 'Maximum value.'],
  ['MEDIAN', 'MEDIAN(expression)', 'Oracle', 'Median value.'],
  ['MIN', 'MIN(expression)', 'Oracle', 'Minimum value.'],
  ['MOD', 'MOD(number, divisor)', 'Oracle', 'Remainder after division.'],
  ['MONTHS_BETWEEN', 'MONTHS_BETWEEN(date1, date2)', 'Oracle', 'Months between two dates.'],
  ['NULLIF', 'NULLIF(value1, value2)', 'Oracle', 'Returns null when two values match.'],
  ['NVL', 'NVL(value, fallback)', 'Oracle', 'Replaces null with a fallback value.'],
  ['NVL2', 'NVL2(value, not_null_value, null_value)', 'Oracle', 'Conditional null replacement.'],
  ['POWER', 'POWER(number, exponent)', 'Oracle', 'Raises a number to a power.'],
  ['RANK', 'RANK() OVER (ORDER BY expression)', 'Oracle', 'Analytic rank.'],
  ['REGEXP_INSTR', 'REGEXP_INSTR(text, pattern)', 'Oracle', 'Regular expression match position.'],
  ['REGEXP_REPLACE', 'REGEXP_REPLACE(text, pattern, replacement)', 'Oracle', 'Regular expression replacement.'],
  ['REGEXP_SUBSTR', 'REGEXP_SUBSTR(text, pattern)', 'Oracle', 'Regular expression substring.'],
  ['REPLACE', 'REPLACE(text, search, replacement)', 'Oracle', 'Replaces matching text.'],
  ['ROUND', 'ROUND(value, precision)', 'Oracle', 'Rounds number or date values.'],
  ['ROW_NUMBER', 'ROW_NUMBER() OVER (ORDER BY expression)', 'Oracle', 'Analytic row number.'],
  ['RPAD', 'RPAD(text, length, pad_text)', 'Oracle', 'Right-pads text.'],
  ['RTRIM', 'RTRIM(text)', 'Oracle', 'Trims trailing characters.'],
  ['SIGN', 'SIGN(number)', 'Oracle', 'Sign of a number.'],
  ['SQRT', 'SQRT(number)', 'Oracle', 'Square root.'],
  ['SUBSTR', 'SUBSTR(text, start, length)', 'Oracle', 'Returns a substring.'],
  ['SUM', 'SUM(expression)', 'Oracle', 'Sums numeric values.'],
  ['TO_CHAR', 'TO_CHAR(value, format)', 'Oracle', 'Formats dates or numbers as text.'],
  ['TO_DATE', 'TO_DATE(text, format)', 'Oracle', 'Parses text as a date.'],
  ['TO_NUMBER', 'TO_NUMBER(text)', 'Oracle', 'Converts text to a number.'],
  ['TO_TIMESTAMP', 'TO_TIMESTAMP(text, format)', 'Oracle', 'Parses text as a timestamp.'],
  ['TRANSLATE', 'TRANSLATE(text, from_text, to_text)', 'Oracle', 'Translates characters in text.'],
  ['TRIM', 'TRIM(text)', 'Oracle', 'Trims leading and trailing characters.'],
  ['TRUNC', 'TRUNC(value, precision)', 'Oracle', 'Truncates date or numeric values.'],
  ['UPPER', 'UPPER(text)', 'Oracle', 'Uppercase text.']
];

export const SQL_VARIABLES: CompletionItem[] = [
  {
    name: '?',
    insert: '?',
    type: 'Variable',
    description: 'SuiteScript positional bind parameter.'
  },
  {
    name: ':parameter',
    insert: ':parameter',
    type: 'Variable',
    description: 'Named bind-style placeholder for query drafts.'
  },
  {
    name: 'ROWNUM',
    insert: 'ROWNUM',
    type: 'Variable',
    description: 'Oracle pseudo-column for row numbering.'
  },
  {
    name: 'LEVEL',
    insert: 'LEVEL',
    type: 'Variable',
    description: 'Oracle hierarchical query pseudo-column.'
  },
  {
    name: 'USER',
    insert: 'USER',
    type: 'Variable',
    description: 'Current database user expression.'
  },
  {
    name: 'SYSDATE',
    insert: 'SYSDATE',
    type: 'Variable',
    description: 'Current database date.'
  },
  {
    name: 'CURRENT_DATE',
    insert: 'CURRENT_DATE',
    type: 'Variable',
    description: 'Current session date.'
  },
  {
    name: 'CURRENT_TIMESTAMP',
    insert: 'CURRENT_TIMESTAMP',
    type: 'Variable',
    description: 'Current session timestamp.'
  }
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
  ...CLAUSES.map(([name, insert, type, description]) => ({name, insert, type, description})),
  ...KEYWORDS.map((keyword) => ({
    name: keyword,
    insert: keyword,
    type: 'Keyword',
    description: 'SuiteQL keyword'
  })),
  ...SUITEQL_FUNCTIONS.map(([name, insert, type, description]) => ({name, insert, type, description})),
  ...ORACLE_FUNCTIONS.map(([name, insert, type, description]) => ({name, insert, type, description})),
  ...SQL_VARIABLES
];
