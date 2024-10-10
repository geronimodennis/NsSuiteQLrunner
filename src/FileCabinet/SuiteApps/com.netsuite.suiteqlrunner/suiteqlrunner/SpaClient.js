define(['exports', '@uif-js/core/jsx-runtime', '@uif-js/component', '@uif-js/core', 'N/url'], (function (exports, jsxRuntime, component, core, url) { 'use strict';

    function _interopNamespaceDefault(e) {
        var n = Object.create(null);
        if (e) {
            Object.keys(e).forEach(function (k) {
                if (k !== 'default') {
                    var d = Object.getOwnPropertyDescriptor(e, k);
                    Object.defineProperty(n, k, d.get ? d : {
                        enumerable: true,
                        get: function () { return e[k]; }
                    });
                }
            });
        }
        n.default = e;
        return Object.freeze(n);
    }

    var url__namespace = /*#__PURE__*/_interopNamespaceDefault(url);

    const DEFAULT_MAX_PAGES = 50;
    const DEFAULT_PAGE_SIZE = 1000;
    const HARD_MAX_PAGES = 100;
    const HARD_MAX_PAGE_SIZE = 1000;
    const MIN_PAGE_SIZE = 5;
    const SAMPLE_QUERY = `SELECT
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
    const KEYWORDS = [
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
    const CLAUSES = [
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
    const SUITEQL_FUNCTIONS = [
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
    const ORACLE_FUNCTIONS = [
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
    const SQL_VARIABLES = [
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
    const FORBIDDEN_MUTATION_KEYWORDS = [
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
    const SQL_SERVER_PATTERNS = [
        ['GETDATE', 'Use SYSDATE or CURRENT_DATE instead of SQL Server GETDATE().'],
        ['DATEADD', 'Use Oracle date arithmetic or ADD_MONTHS where applicable.'],
        ['DATEDIFF', 'Use Oracle date subtraction or EXTRACT-based expressions.'],
        ['LEN', 'Use LENGTH for Oracle-style string length.'],
        ['ISNULL', 'Use NVL or COALESCE for Oracle-style null handling.'],
        ['CONVERT', 'Use CAST, TO_CHAR, TO_DATE, or TO_NUMBER.']
    ];
    const COMPLETIONS = [
        ...CLAUSES.map(([name, insert, type, description]) => ({ name, insert, type, description })),
        ...KEYWORDS.map((keyword) => ({
            name: keyword,
            insert: keyword,
            type: 'Keyword',
            description: 'SuiteQL keyword'
        })),
        ...SUITEQL_FUNCTIONS.map(([name, insert, type, description]) => ({ name, insert, type, description })),
        ...ORACLE_FUNCTIONS.map(([name, insert, type, description]) => ({ name, insert, type, description })),
        ...SQL_VARIABLES
    ];

    function getActiveToken(query, caretPosition) {
        let start = caretPosition;
        while (start > 0 && /[A-Za-z0-9_.$#]/.test(query[start - 1])) {
            start -= 1;
        }
        return query.slice(start, caretPosition);
    }
    function replaceActiveToken(query, caretPosition, replacement) {
        let start = caretPosition;
        while (start > 0 && /[A-Za-z0-9_.$#]/.test(query[start - 1])) {
            start -= 1;
        }
        const nextQuery = `${query.slice(0, start)}${replacement}${query.slice(caretPosition)}`;
        return {
            query: nextQuery,
            caret: start + replacement.length
        };
    }
    function stripCommentsAndLiterals(query) {
        return query.replace(/(--[^\n\r]*|\/\*[\s\S]*?\*\/|'(?:''|[^'])*'|"(?:[^"]|"")*")/g, ' ');
    }

    const DEFAULT_COMPLETION_LIMIT = 12;
    function getCompletions(query, caretPosition) {
        const token = getActiveToken(query, caretPosition).toUpperCase();
        if (!token) {
            return COMPLETIONS.slice(0, DEFAULT_COMPLETION_LIMIT);
        }
        return COMPLETIONS.filter((item) => item.name.toUpperCase().startsWith(token)).slice(0, DEFAULT_COMPLETION_LIMIT);
    }

    function analyzeSuiteQL(query) {
        const hints = [];
        const trimmed = query.trim();
        if (!trimmed) {
            return [
                {
                    severity: 'error',
                    message: 'Query is empty.',
                    detail: 'The RESTlet will return an empty query error.'
                }
            ];
        }
        const analysisText = stripCommentsAndLiterals(query).toUpperCase();
        const firstKeyword = (analysisText.match(/\b[A-Z][A-Z0-9_$#]*\b/) || [])[0];
        if (firstKeyword && firstKeyword !== 'SELECT' && firstKeyword !== 'WITH') {
            hints.push({
                severity: 'warning',
                message: `Query starts with ${firstKeyword}.`,
                detail: 'SuiteQL runners should normally execute SELECT or WITH queries.'
            });
        }
        if (hasMultipleStatements(analysisText)) {
            hints.push({
                severity: 'warning',
                message: 'Possible multiple statements detected.',
                detail: 'SuiteQL execution expects a single statement. The Run button remains enabled so NetSuite can return the exact error.'
            });
        }
        addMutationHints(analysisText, hints);
        addSqlServerDialectHints(analysisText, hints);
        addIdentifierHints(query, hints);
        addOracleLimitHint(analysisText, hints);
        addPerformanceHints(analysisText, hints);
        const balanceHint = getBalanceHint(query);
        if (balanceHint) {
            hints.push(balanceHint);
        }
        if (!/\bFROM\b/i.test(analysisText)) {
            hints.push({
                severity: 'info',
                message: 'No FROM clause detected.',
                detail: 'Some Oracle expressions can work without a record source, but most SuiteQL queries need a FROM clause.'
            });
        }
        if (hints.length === 0) {
            hints.push({
                severity: 'info',
                message: 'No local hints found.',
                detail: 'This is a static check. NetSuite remains the source of truth at execution time.'
            });
        }
        return hints;
    }
    function addMutationHints(analysisText, hints) {
        FORBIDDEN_MUTATION_KEYWORDS.forEach((keyword) => {
            if (new RegExp(`\\b${keyword}\\b`, 'i').test(analysisText)) {
                hints.push({
                    severity: 'error',
                    message: `${keyword} is not valid for this SuiteQL runner.`,
                    detail: 'SuiteQL is a query language surface. DDL and DML are not supported by this runner.'
                });
            }
        });
    }
    function addSqlServerDialectHints(analysisText, hints) {
        SQL_SERVER_PATTERNS.forEach(([functionName, detail]) => {
            if (new RegExp(`\\b${functionName}\\s*\\(`, 'i').test(analysisText)) {
                hints.push({
                    severity: 'warning',
                    message: `${functionName} looks like SQL Server syntax.`,
                    detail
                });
            }
        });
    }
    function addIdentifierHints(query, hints) {
        if (/\[[^\]]+\]/.test(query)) {
            hints.push({
                severity: 'warning',
                message: 'Square-bracket identifiers detected.',
                detail: 'Oracle and SuiteQL identifiers use unquoted names or double quotes, not SQL Server square brackets.'
            });
        }
    }
    function addOracleLimitHint(analysisText, hints) {
        if (/\bLIMIT\b/i.test(analysisText)) {
            hints.push({
                severity: 'warning',
                message: 'LIMIT detected.',
                detail: 'Use SuiteQL TOP, ROWNUM, or Oracle row limiting syntax depending on the target account support.'
            });
        }
    }
    function addPerformanceHints(analysisText, hints) {
        if (/\bSELECT\s+\*/i.test(analysisText)) {
            hints.push({
                severity: 'info',
                message: 'SELECT * can be expensive.',
                detail: 'For repeatable performance, select only the columns needed by the analysis.'
            });
        }
    }
    function hasMultipleStatements(analysisText) {
        const withoutTrailingSemicolon = analysisText.trim().replace(/;+\s*$/, '');
        return /;/.test(withoutTrailingSemicolon);
    }
    function getBalanceHint(query) {
        let parenDepth = 0;
        let inSingle = false;
        let inDouble = false;
        let inLineComment = false;
        let inBlockComment = false;
        for (let i = 0; i < query.length; i += 1) {
            const char = query[i];
            const next = query[i + 1];
            if (inLineComment) {
                if (char === '\n' || char === '\r') {
                    inLineComment = false;
                }
                continue;
            }
            if (inBlockComment) {
                if (char === '*' && next === '/') {
                    inBlockComment = false;
                    i += 1;
                }
                continue;
            }
            if (!inSingle && !inDouble && char === '-' && next === '-') {
                inLineComment = true;
                i += 1;
                continue;
            }
            if (!inSingle && !inDouble && char === '/' && next === '*') {
                inBlockComment = true;
                i += 1;
                continue;
            }
            if (!inDouble && char === "'") {
                if (inSingle && next === "'") {
                    i += 1;
                }
                else {
                    inSingle = !inSingle;
                }
                continue;
            }
            if (!inSingle && char === '"') {
                inDouble = !inDouble;
                continue;
            }
            if (inSingle || inDouble) {
                continue;
            }
            if (char === '(') {
                parenDepth += 1;
            }
            else if (char === ')') {
                parenDepth -= 1;
            }
            if (parenDepth < 0) {
                return {
                    severity: 'error',
                    message: 'Closing parenthesis has no matching opening parenthesis.',
                    detail: 'Check nested functions, joins, and WHERE predicates near the highlighted structure.'
                };
            }
        }
        if (inSingle) {
            return {
                severity: 'error',
                message: 'Unclosed single-quoted string.',
                detail: 'SuiteQL string literals must close with a matching single quote.'
            };
        }
        if (inDouble) {
            return {
                severity: 'warning',
                message: 'Unclosed double-quoted identifier.',
                detail: 'Quoted identifiers must close with a matching double quote.'
            };
        }
        if (inBlockComment) {
            return {
                severity: 'warning',
                message: 'Unclosed block comment.',
                detail: 'Close block comments with */ before executing.'
            };
        }
        if (parenDepth > 0) {
            return {
                severity: 'error',
                message: 'Opening parenthesis has no matching closing parenthesis.',
                detail: 'Check function calls, subqueries, and predicates.'
            };
        }
        return null;
    }

    class QueryRunnerService {
        gateway;
        constructor(gateway) {
            this.gateway = gateway;
        }
        async run(query, options) {
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
            }
            catch (error) {
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
    function normalizeMaxPages(value) {
        return normalizeNumber(value, 1, HARD_MAX_PAGES, DEFAULT_MAX_PAGES);
    }
    function normalizePageSize(value) {
        return normalizeNumber(value, MIN_PAGE_SIZE, HARD_MAX_PAGE_SIZE, DEFAULT_PAGE_SIZE);
    }
    function normalizeNumber(value, min, max, fallback) {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) {
            return fallback;
        }
        return Math.min(max, Math.max(min, Math.floor(parsed)));
    }
    function buildPerformance(response, clientValidationMs, requestLatencyMs) {
        return {
            ...(response.meta || {}),
            clientValidationMs,
            requestLatencyMs,
            httpStatus: response.httpStatus
        };
    }
    function formatExecutionError(response) {
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

    const KEYWORD_PATTERN = new RegExp(`\\b(${KEYWORDS.join('|')})\\b`, 'gi');
    function formatSuiteQL(query) {
        if (!query.trim()) {
            return query;
        }
        const literals = [];
        let protectedSql = protectLiterals(query, literals);
        protectedSql = protectedSql.replace(/\s+/g, ' ').trim();
        protectedSql = protectedSql.replace(KEYWORD_PATTERN, (match) => match.toUpperCase());
        protectedSql = breakBeforeClauses(protectedSql);
        protectedSql = applyMssqlStyleIndentation(protectedSql);
        return restoreLiterals(protectedSql, literals);
    }
    function protectLiterals(query, literals) {
        return query.replace(/(--[^\n\r]*|\/\*[\s\S]*?\*\/|'(?:''|[^'])*'|"(?:[^"]|"")*")/g, (match) => {
            const token = `@@SQL_LITERAL_${literals.length}@@`;
            literals.push(match);
            return token;
        });
    }
    function breakBeforeClauses(query) {
        const multiWordClauses = [
            'UNION ALL',
            'LEFT OUTER JOIN',
            'RIGHT OUTER JOIN',
            'FULL OUTER JOIN',
            'INNER JOIN',
            'LEFT JOIN',
            'RIGHT JOIN',
            'FULL JOIN',
            'CROSS JOIN',
            'GROUP BY',
            'ORDER BY',
            'FETCH FIRST'
        ];
        let formatted = query;
        multiWordClauses.forEach((clause) => {
            formatted = formatted.replace(new RegExp(`\\s*\\b${clause}\\b\\s*`, 'gi'), `\n${clause} `);
        });
        ['SELECT', 'FROM', 'WHERE', 'HAVING', 'UNION'].forEach((clause) => {
            formatted = formatted.replace(new RegExp(`\\s*\\b${clause}\\b\\s*`, 'gi'), `\n${clause} `);
        });
        return formatted;
    }
    function applyMssqlStyleIndentation(query) {
        return query
            .replace(/\s*,\s*/g, ',\n    ')
            .replace(/\s+\bON\b\s+/gi, '\n    ON ')
            .replace(/\s+\bAND\b\s+/gi, '\n    AND ')
            .replace(/\s+\bOR\b\s+/gi, '\n    OR ')
            .replace(/\nSELECT\s+/i, 'SELECT\n    ')
            .replace(/\nFROM\s+/i, '\nFROM\n    ')
            .replace(/\nWHERE\s+/i, '\nWHERE\n    ')
            .replace(/\nGROUP BY\s+/i, '\nGROUP BY\n    ')
            .replace(/\nORDER BY\s+/i, '\nORDER BY\n    ')
            .replace(/\nHAVING\s+/i, '\nHAVING\n    ')
            .replace(/^\n/, '')
            .replace(/[ \t]+\n/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }
    function restoreLiterals(query, literals) {
        let formatted = query;
        literals.forEach((literal, index) => {
            formatted = formatted.replace(`@@SQL_LITERAL_${index}@@`, literal);
        });
        return formatted;
    }

    const RESTLET_SCRIPT_ID = 'customscript_nsqlr_restlet';
    const RESTLET_DEPLOYMENT_ID = 'customdeploy_nsqlr_restlet';
    class NetSuiteRestletQueryGateway {
        async execute(request) {
            const response = await fetch(resolveRestletUrl(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(request)
            });
            const payload = await response.json();
            return {
                ok: Boolean(payload.ok),
                rows: payload.rows || [],
                columns: payload.columns || [],
                meta: payload.meta || {},
                error: payload.error,
                httpStatus: response.status
            };
        }
    }
    function resolveRestletUrl() {
        return url__namespace.resolveScript({
            scriptId: RESTLET_SCRIPT_ID,
            deploymentId: RESTLET_DEPLOYMENT_ID,
            returnExternalUrl: false
        });
    }

    function AutocompletePanel({ suggestions, onInsert }) {
        return (jsxRuntime.jsx(component.Portlet, { title: 'Autocomplete', icon: core.SystemIcon.HELP, children: jsxRuntime.jsx(component.StackPanel.Vertical, { itemGap: component.StackPanel.GapSize.SMALL, children: suggestions.map((suggestion) => (jsxRuntime.jsx(component.StackPanel.Item, { children: jsxRuntime.jsx(component.Button, { label: `${suggestion.name} - ${suggestion.type}`, action: () => onInsert(suggestion), rootStyle: { width: '100%', justifyContent: 'flex-start' } }) }, `${suggestion.type}-${suggestion.name}`))) }) }));
    }

    const METRICS = [
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
    function buildPerformanceRows(meta) {
        return METRICS.map(([metric, key, unit]) => ({
            metric,
            value: meta[key] === undefined || meta[key] === null ? '-' : String(meta[key]),
            unit
        }));
    }

    function textColumn(name, label = name) {
        return {
            name,
            binding: name,
            label,
            type: component.DataGrid.ColumnType.TEXT_BOX
        };
    }

    function PerformanceMatrixPanel({ performance }) {
        return (jsxRuntime.jsx(component.Portlet, { title: 'SuiteQL Performance Matrix', icon: core.SystemIcon.PERFORMANCE, children: jsxRuntime.jsx(component.DataGrid, { dataSource: new core.ArrayDataSource(buildPerformanceRows(performance || {})), columns: columns$1() }) }));
    }
    function columns$1() {
        return [textColumn('metric', 'Metric'), textColumn('value', 'Value'), textColumn('unit', 'Unit')];
    }

    const EXECUTION_MODES = new core.ArrayDataSource([
        {
            id: 'RUN_SUITEQL_PAGED',
            label: 'runSuiteQLPaged'
        },
        {
            id: 'RUN_SUITEQL',
            label: 'runSuiteQL'
        }
    ]);
    function QueryEditor(props) {
        return (jsxRuntime.jsx(component.Portlet, { title: 'Query Editor', icon: core.SystemIcon.EDIT, children: jsxRuntime.jsxs(component.StackPanel.Vertical, { itemGap: component.StackPanel.GapSize.MEDIUM, children: [jsxRuntime.jsx(component.StackPanel.Item, { children: jsxRuntime.jsxs(component.StackPanel, { alignment: component.StackPanel.Alignment.CENTER, itemGap: component.StackPanel.GapSize.MEDIUM, children: [jsxRuntime.jsx(component.StackPanel.Item, { shrink: 0, children: jsxRuntime.jsx(component.Button, { label: props.running ? 'Running...' : 'Run SuiteQL', type: component.Button.Type.PRIMARY, action: props.onRun }) }), jsxRuntime.jsx(component.StackPanel.Item, { shrink: 0, children: jsxRuntime.jsx(component.Button, { label: 'Format SuiteQL', action: props.onFormat }) }), jsxRuntime.jsx(component.StackPanel.Item, { shrink: 0, children: jsxRuntime.jsx(component.Button, { label: 'Analyze', action: props.onAnalyze }) }), jsxRuntime.jsx(component.StackPanel.Item, { shrink: 0, children: jsxRuntime.jsx(component.Dropdown, { dataSource: EXECUTION_MODES, valueMember: 'id', displayMember: 'label', selectedValue: props.executionMode, onSelectionChanged: ({ value }) => props.onExecutionModeChanged(value), rootStyle: { width: '160px' } }) }), jsxRuntime.jsx(component.StackPanel.Item, { shrink: 0, children: jsxRuntime.jsx(component.TextBox, { text: props.pageSize, placeholder: 'Rows/page', onTextChanged: ({ text }) => props.onPageSizeChanged(text), rootStyle: { width: '110px' } }) }), jsxRuntime.jsx(component.StackPanel.Item, { shrink: 0, children: jsxRuntime.jsx(component.TextBox, { text: props.maxPages, placeholder: 'Pages', onTextChanged: ({ text }) => props.onMaxPagesChanged(text), rootStyle: { width: '90px' } }) }), jsxRuntime.jsx(component.StackPanel.Item, { grow: 1, children: jsxRuntime.jsx(component.Text, { color: component.Text.Color.SECONDARY, children: "Paged mode fetches multiple pages. Direct mode falls back to paged results when the result appears capped." }) })] }) }), jsxRuntime.jsx(component.StackPanel.Item, { children: jsxRuntime.jsx(component.TextArea, { text: props.query, rowCount: 18, resizable: true, resizeDirection: component.TextArea.ResizeDirection.VERTICAL, autoComplete: 'off', rootStyle: {
                                fontFamily: 'Consolas, Monaco, monospace',
                                width: '100%'
                            }, onTextChanged: (args, sender) => props.onQueryChanged(args.text, sender.selection.end || args.text.length) }) })] }) }));
    }

    function QueryHintsPanel({ hints }) {
        return (jsxRuntime.jsx(component.Portlet, { title: 'SuiteQL Hints', icon: core.SystemIcon.INFO, children: jsxRuntime.jsx(component.DataGrid, { dataSource: new core.ArrayDataSource(toRows(hints)), columns: columns() }) }));
    }
    function toRows(hints) {
        return hints.map((hint, index) => ({
            id: index + 1,
            severity: hint.severity.toUpperCase(),
            message: hint.message,
            detail: hint.detail
        }));
    }
    function columns() {
        return [textColumn('severity', 'Severity'), textColumn('message', 'Message'), textColumn('detail', 'Detail')];
    }

    function ResultsPanel(props) {
        if (props.error) {
            return (jsxRuntime.jsx(component.Portlet, { title: 'Result', icon: core.SystemIcon.ERROR, children: jsxRuntime.jsx(component.Code, { content: props.error, language: component.Code.Language.TEXT, background: component.Code.Background.ERROR, lineWrapping: true }) }));
        }
        if (props.rows.length === 0) {
            return (jsxRuntime.jsx(component.Portlet, { title: 'Result', icon: core.SystemIcon.LIST, children: jsxRuntime.jsx(component.Text, { color: component.Text.Color.SECONDARY, children: "No results yet. Run a SuiteQL query to populate the grid." }) }));
        }
        return (jsxRuntime.jsx(component.Portlet, { title: `Result (${props.rows.length} rows shown)`, icon: core.SystemIcon.LIST, children: jsxRuntime.jsx(component.DataGrid, { dataSource: new core.ArrayDataSource(props.rows), columns: props.columns.map((column) => textColumn(column)) }) }));
    }

    class SuiteQLRunner extends core.PureComponent {
        queryRunner = new QueryRunnerService(new NetSuiteRestletQueryGateway());
        constructor(props, context) {
            super(props, context);
            this.state = {
                query: SAMPLE_QUERY,
                hints: analyzeSuiteQL(SAMPLE_QUERY),
                suggestions: getCompletions(SAMPLE_QUERY, SAMPLE_QUERY.length),
                resultRows: [],
                resultColumns: [],
                error: null,
                executionMode: 'RUN_SUITEQL_PAGED',
                running: false,
                maxPages: String(DEFAULT_MAX_PAGES),
                pageSize: String(DEFAULT_PAGE_SIZE),
                caretPosition: SAMPLE_QUERY.length,
                performance: {}
            };
        }
        render() {
            return (jsxRuntime.jsx(component.ThemeSelector, { supportedThemes: [core.Theme.Name.REDWOOD, core.Theme.Name.REFRESHED], children: jsxRuntime.jsxs(component.StackPanel.Vertical, { rootStyle: { height: '100%' }, children: [jsxRuntime.jsx(component.StackPanel.Item, { shrink: 0, children: jsxRuntime.jsx(component.ApplicationHeader, { icon: core.SystemIcon.SEARCH, title: 'SuiteQL Runner', subtitle: 'Format, inspect, execute, and measure SuiteQL', actions: [
                                    {
                                        label: 'Run SuiteQL',
                                        action: () => this.runQuery()
                                    },
                                    {
                                        label: 'Format',
                                        action: () => this.formatQuery()
                                    }
                                ] }) }), jsxRuntime.jsx(component.StackPanel.Item, { grow: 1, children: jsxRuntime.jsx(component.ScrollPanel, { orientation: component.ScrollPanel.Orientation.VERTICAL, children: jsxRuntime.jsx(component.ContentPanel, { outerGap: component.ContentPanel.GapSize.LARGE, children: jsxRuntime.jsxs(component.StackPanel.Vertical, { itemGap: component.StackPanel.GapSize.LARGE, children: [jsxRuntime.jsx(component.StackPanel.Item, { children: jsxRuntime.jsx(QueryEditor, { executionMode: this.state.executionMode, maxPages: this.state.maxPages, pageSize: this.state.pageSize, query: this.state.query, running: this.state.running, onAnalyze: () => this.analyzeQuery(), onExecutionModeChanged: (executionMode) => this.setState({ executionMode }), onFormat: () => this.formatQuery(), onMaxPagesChanged: (maxPages) => this.setState({ maxPages }), onPageSizeChanged: (pageSize) => this.setState({ pageSize }), onQueryChanged: (query, caretPosition) => this.onQueryChanged(query, caretPosition), onRun: () => this.runQuery() }) }), jsxRuntime.jsx(component.StackPanel.Item, { children: this.renderAnalysisAndSuggestions() }), jsxRuntime.jsx(component.StackPanel.Item, { children: jsxRuntime.jsx(PerformanceMatrixPanel, { performance: this.state.performance }) }), jsxRuntime.jsx(component.StackPanel.Item, { children: jsxRuntime.jsx(ResultsPanel, { columns: this.state.resultColumns, error: this.state.error, rows: this.state.resultRows }) })] }) }) }) })] }) }));
        }
        renderAnalysisAndSuggestions() {
            return (jsxRuntime.jsxs(component.GridPanel, { columns: ['2fr', '1fr'], gap: component.GridPanel.GapSize.LARGE, children: [jsxRuntime.jsx(component.GridPanel.Item, { rowIndex: 0, columnIndex: 0, children: jsxRuntime.jsx(QueryHintsPanel, { hints: this.state.hints }) }), jsxRuntime.jsx(component.GridPanel.Item, { rowIndex: 0, columnIndex: 1, children: jsxRuntime.jsx(AutocompletePanel, { suggestions: this.state.suggestions, onInsert: (suggestion) => this.insertSuggestion(suggestion) }) })] }));
        }
        onQueryChanged(query, caretPosition) {
            this.setState({
                query,
                caretPosition,
                hints: analyzeSuiteQL(query),
                suggestions: getCompletions(query, caretPosition)
            });
        }
        formatQuery() {
            const formatted = formatSuiteQL(this.state.query);
            this.setState({
                query: formatted,
                hints: analyzeSuiteQL(formatted),
                suggestions: getCompletions(formatted, formatted.length),
                caretPosition: formatted.length
            });
        }
        analyzeQuery() {
            this.setState({
                hints: analyzeSuiteQL(this.state.query),
                suggestions: getCompletions(this.state.query, this.state.caretPosition)
            });
        }
        insertSuggestion(suggestion) {
            const replacement = replaceActiveToken(this.state.query, this.state.caretPosition, suggestion.insert);
            this.setState({
                query: replacement.query,
                caretPosition: replacement.caret,
                hints: analyzeSuiteQL(replacement.query),
                suggestions: getCompletions(replacement.query, replacement.caret)
            });
        }
        async runQuery() {
            this.setState({
                running: true,
                error: null,
                resultRows: [],
                resultColumns: []
            });
            const outcome = await this.queryRunner.run(this.state.query, {
                executionMode: this.state.executionMode,
                maxPagesText: this.state.maxPages,
                pageSizeText: this.state.pageSize
            });
            this.setState({
                running: false,
                hints: outcome.hints,
                error: outcome.error,
                resultRows: outcome.resultRows,
                resultColumns: outcome.resultColumns,
                performance: outcome.performance
            });
        }
    }

    const run = (context) => {
        context.setLayout('application');
        context.setContent(jsxRuntime.jsx(SuiteQLRunner, {}));
    };

    exports.run = run;

}));
