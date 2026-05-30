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

    const COMMON_UNSUPPORTED_FUNCTIONS = [
        ['CURDATE', 'Use CURRENT_DATE or SYSDATE for Oracle-style current date expressions.'],
        ['DATE_FORMAT', 'Use TO_CHAR(date_value, format_mask) for Oracle-style date formatting.'],
        ['DAY', 'Use EXTRACT(DAY FROM date_value) for Oracle-style date parts.'],
        ['IF', 'Use CASE WHEN ... THEN ... ELSE ... END for conditional expressions.'],
        ['IFNULL', 'Use NVL or COALESCE for Oracle-style null handling.'],
        ['IIF', 'Use CASE WHEN ... THEN ... ELSE ... END for conditional expressions.'],
        ['MONTH', 'Use EXTRACT(MONTH FROM date_value) for Oracle-style date parts.'],
        ['NOW', 'Use CURRENT_TIMESTAMP or SYSDATE for Oracle-style current time expressions.'],
        ['STR_TO_DATE', 'Use TO_DATE(text_value, format_mask) for Oracle-style date parsing.'],
        ['YEAR', 'Use EXTRACT(YEAR FROM date_value) for Oracle-style date parts.']
    ];
    const KNOWN_FUNCTIONS = new Set([
        ...ORACLE_FUNCTIONS.map(([name]) => name.toUpperCase()),
        ...SUITEQL_FUNCTIONS.map(([name]) => name.toUpperCase()),
        ...SQL_SERVER_PATTERNS.map(([name]) => name.toUpperCase())
    ]);
    const COMMON_UNSUPPORTED_FUNCTION_NAMES = new Set(COMMON_UNSUPPORTED_FUNCTIONS.map(([name]) => name.toUpperCase()));
    const FUNCTION_SYNTAX_WORDS = new Set([
        'AS',
        'CASE',
        'EXISTS',
        'EXTRACT',
        'FROM',
        'IN',
        'NOT',
        'OVER',
        'SELECT',
        'WITH'
    ]);
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
        const syntaxText = maskLiteralsForSyntax(query).toUpperCase();
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
        addPotentialSyntaxHints(syntaxText, hints);
        addUnsupportedFunctionHints(analysisText, hints);
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
    function addPotentialSyntaxHints(analysisText, hints) {
        const compact = analysisText.replace(/\s+/g, ' ').trim();
        if (/\bSELECT\s+FROM\b/i.test(compact)) {
            hints.push({
                severity: 'error',
                message: 'SELECT has no columns before FROM.',
                detail: 'Add at least one expression or column between SELECT and FROM.'
            });
        }
        if (/\bSELECT\s*,/i.test(compact)) {
            hints.push({
                severity: 'error',
                message: 'SELECT list starts with a comma.',
                detail: 'Remove the leading comma or add the missing first selected expression.'
            });
        }
        if (/,\s*(FROM|WHERE|GROUP\s+BY|HAVING|ORDER\s+BY|FETCH|OFFSET|$)/i.test(compact)) {
            hints.push({
                severity: 'error',
                message: 'Possible trailing comma in query clause.',
                detail: 'Check the SELECT list, GROUP BY list, or ORDER BY list for a comma before the next clause.'
            });
        }
        if (/\b(WHERE|ON|HAVING)\s*(GROUP\s+BY|ORDER\s+BY|FETCH|OFFSET|$)/i.test(compact)) {
            hints.push({
                severity: 'error',
                message: 'Predicate clause appears to be empty.',
                detail: 'Add a condition after WHERE, ON, or HAVING before starting the next clause.'
            });
        }
        if (/\b(AND|OR)\s*(GROUP\s+BY|ORDER\s+BY|HAVING|FETCH|OFFSET|$)/i.test(compact)) {
            hints.push({
                severity: 'error',
                message: 'Boolean operator has no right-hand condition.',
                detail: 'Add a condition after AND/OR or remove the dangling operator.'
            });
        }
        if (/(=|<>|!=|<|>|<=|>=|\+|-|\*|\/)\s*(GROUP\s+BY|ORDER\s+BY|HAVING|FETCH|OFFSET|$)/i.test(compact)) {
            hints.push({
                severity: 'error',
                message: 'Operator appears to be missing a right-hand value.',
                detail: 'Check comparison and arithmetic expressions for an incomplete right side.'
            });
        }
        if (/\bJOIN\s+[A-Z0-9_$#."]+\s*(JOIN|WHERE|GROUP\s+BY|ORDER\s+BY|HAVING|FETCH|OFFSET|$)/i.test(compact)) {
            hints.push({
                severity: 'warning',
                message: 'JOIN may be missing an ON condition.',
                detail: 'Most SuiteQL joins should include ON. Use CROSS JOIN only when a Cartesian join is intentional.'
            });
        }
        addMalformedOrderByHints(compact, hints);
    }
    function addMalformedOrderByHints(compact, hints) {
        const orderByMatch = compact.match(/\bORDER\s+BY\s+(.+?)(\bFETCH\b|\bOFFSET\b|$)/i);
        if (!orderByMatch) {
            return;
        }
        const orderByText = orderByMatch[1].trim();
        if (!orderByText) {
            hints.push({
                severity: 'error',
                message: 'ORDER BY has no sort expression.',
                detail: 'Add one or more columns or expressions after ORDER BY.'
            });
            return;
        }
        splitTopLevelComma(orderByText).forEach((expression) => {
            const normalized = expression.trim();
            const withoutDirection = normalized.replace(/\s+(ASC|DESC)(\s+NULLS\s+(FIRST|LAST))?$/i, '').trim();
            if (/\b(ASC|DESC)\s+[A-Z_][A-Z0-9_$#.]*(\s+[A-Z_][A-Z0-9_$#.]*)+/i.test(normalized)) {
                hints.push({
                    severity: 'error',
                    message: 'ORDER BY sort direction is followed by extra tokens.',
                    detail: 'ASC or DESC must end that ORDER BY expression except for optional NULLS FIRST/LAST. Use commas between additional sort expressions.'
                });
                return;
            }
            if (hasRepeatedBareWords(withoutDirection)) {
                hints.push({
                    severity: 'error',
                    message: 'ORDER BY expression appears malformed.',
                    detail: `The expression "${normalized}" contains repeated bare words. Use commas between sort expressions or remove the extra tokens.`
                });
            }
        });
    }
    function addUnsupportedFunctionHints(analysisText, hints) {
        COMMON_UNSUPPORTED_FUNCTIONS.forEach(([functionName, detail]) => {
            if (new RegExp(`\\b${functionName}\\s*\\(`, 'i').test(analysisText)) {
                hints.push({
                    severity: 'warning',
                    message: `${functionName} may not be supported by Oracle/SuiteQL.`,
                    detail
                });
            }
        });
        getFunctionCalls(analysisText).forEach((functionName) => {
            if (KNOWN_FUNCTIONS.has(functionName) ||
                COMMON_UNSUPPORTED_FUNCTION_NAMES.has(functionName) ||
                FUNCTION_SYNTAX_WORDS.has(functionName)) {
                return;
            }
            hints.push({
                severity: 'warning',
                message: `${functionName} is not in the known SuiteQL/Oracle function list.`,
                detail: 'This static check may not know every account-supported function. Verify the function name or replace it with a documented SuiteQL or Oracle equivalent.'
            });
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
        if (/(=|<>|!=|<|>|<=|>=)\s*"[^"]+"/.test(query)) {
            hints.push({
                severity: 'warning',
                message: 'Double-quoted comparison value detected.',
                detail: 'Oracle and SuiteQL treat double quotes as quoted identifiers. Use single quotes for string values, such as t.type = \'SalesOrd\'.'
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
    function getFunctionCalls(analysisText) {
        const functions = new Set();
        const pattern = /\b((?:BUILTIN\.)?[A-Z][A-Z0-9_$#]*)\s*\(/g;
        let match;
        while ((match = pattern.exec(analysisText)) !== null) {
            functions.add(match[1].toUpperCase());
        }
        return Array.from(functions);
    }
    function maskLiteralsForSyntax(query) {
        return query.replace(/(--[^\n\r]*|\/\*[\s\S]*?\*\/|'(?:''|[^'])*'|"(?:[^"]|"")*")/g, (match) => {
            if (match.startsWith('--') || match.startsWith('/*')) {
                return ' ';
            }
            return ' VALUE ';
        });
    }
    function splitTopLevelComma(value) {
        const parts = [];
        let depth = 0;
        let start = 0;
        for (let i = 0; i < value.length; i += 1) {
            const char = value[i];
            if (char === '(') {
                depth += 1;
            }
            else if (char === ')') {
                depth = Math.max(0, depth - 1);
            }
            else if (char === ',' && depth === 0) {
                parts.push(value.slice(start, i));
                start = i + 1;
            }
        }
        parts.push(value.slice(start));
        return parts;
    }
    function hasRepeatedBareWords(value) {
        const tokens = value.match(/\b[A-Z_][A-Z0-9_$#.]*\b/g) || [];
        if (tokens.length < 3) {
            return false;
        }
        const operatorOrKeywordPattern = /\b(CASE|WHEN|THEN|ELSE|END|AND|OR|IN|IS|LIKE|BETWEEN|NULL|OVER|PARTITION|BY)\b|[+\-*\/=<>]/i;
        return !operatorOrKeywordPattern.test(value);
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

    const MAX_MESSAGE_LENGTH = 4000;
    const MAX_QUERY_CONTEXT_LENGTH = 8000;
    class RecordChatService {
        gateway;
        constructor(gateway) {
            this.gateway = gateway;
        }
        async ask(message, history, currentQuery) {
            const normalizedMessage = normalizeMessage(message);
            const normalizedQuery = normalizeQueryContext(currentQuery);
            if (!normalizedMessage) {
                return {
                    messages: history,
                    meta: {},
                    error: 'Enter a NetSuite report, search, record, field, join, or SuiteQL question before asking AI.'
                };
            }
            const optimisticMessages = [
                ...trimHistory(history),
                {
                    role: 'user',
                    text: normalizedMessage
                }
            ];
            try {
                const startedAt = Date.now();
                const response = await this.gateway.askRecordQuestion({
                    action: 'CHAT_RECORDS',
                    message: buildPrompt(normalizedMessage, normalizedQuery),
                    history: trimHistory(history)
                });
                const meta = buildChatMeta(response, Date.now() - startedAt);
                if (!response.ok) {
                    return {
                        messages: optimisticMessages,
                        meta,
                        error: formatChatError(response)
                    };
                }
                return {
                    messages: appendAssistant(optimisticMessages, response.answer),
                    meta,
                    error: null
                };
            }
            catch (error) {
                return {
                    messages: optimisticMessages,
                    meta: {},
                    error: error instanceof Error ? error.message : String(error)
                };
            }
        }
    }
    function normalizeMessage(message) {
        return String(message || '').trim().slice(0, MAX_MESSAGE_LENGTH);
    }
    function normalizeQueryContext(query) {
        return String(query || '').trim().slice(0, MAX_QUERY_CONTEXT_LENGTH);
    }
    function buildPrompt(message, currentQuery) {
        if (!currentQuery) {
            return message;
        }
        return [
            'The user is working in SuiteQL Runner. Use this current Query Editor SuiteQL when the user asks to fix, improve, explain, optimize, or troubleshoot the query.',
            '',
            'Current Query Editor SuiteQL:',
            '```sql',
            currentQuery,
            '```',
            '',
            'User question:',
            message
        ].join('\n');
    }
    function trimHistory(history) {
        return history
            .filter((message) => message.role === 'user' || message.role === 'assistant')
            .filter((message) => normalizeMessage(message.text).length > 0)
            .slice(-12)
            .map((message) => ({
            role: message.role,
            text: normalizeMessage(message.text)
        }));
    }
    function appendAssistant(messages, answer) {
        return [
            ...messages,
            {
                role: 'assistant',
                text: answer || 'No answer was returned by the NetSuite LLM module.'
            }
        ];
    }
    function buildChatMeta(response, requestLatencyMs) {
        return {
            ...(response.meta || {}),
            requestLatencyMs,
            httpStatus: response.httpStatus
        };
    }
    function formatChatError(response) {
        const error = response.error || {};
        const lines = [
            error.name || error.code || 'AI record chat error',
            error.message || 'NetSuite returned an error while asking the LLM module.'
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
                body: JSON.stringify({
                    ...request,
                    action: 'RUN_SUITEQL'
                })
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
        async askRecordQuestion(request) {
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
                answer: payload.answer || '',
                messages: payload.messages || [],
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

    function QueryEditor(props) {
        const actionableHints = getActionableHints(props.hints, props.executionError);
        const autocompleteItems = props.suggestions.slice(0, 10).map((suggestion) => (jsxRuntime.jsx(component.StackPanel.Item, { shrink: 0, children: jsxRuntime.jsx(component.Button, { label: `${suggestion.name} - ${suggestion.type}`, action: () => props.onInsertSuggestion(suggestion) }) }, `${suggestion.type}-${suggestion.name}`)));
        return (jsxRuntime.jsx(component.Portlet, { title: 'Query Editor', icon: core.SystemIcon.EDIT, children: jsxRuntime.jsxs(component.StackPanel.Vertical, { itemGap: component.StackPanel.GapSize.MEDIUM, children: [jsxRuntime.jsx(component.StackPanel.Item, { children: jsxRuntime.jsxs(component.StackPanel, { alignment: component.StackPanel.Alignment.CENTER, itemGap: component.StackPanel.GapSize.MEDIUM, children: [jsxRuntime.jsx(component.StackPanel.Item, { shrink: 0, children: jsxRuntime.jsx(component.Button, { label: props.running ? 'Running...' : 'Run SuiteQL', type: component.Button.Type.PRIMARY, action: props.onRun }) }), jsxRuntime.jsx(component.StackPanel.Item, { shrink: 0, children: jsxRuntime.jsx(component.Button, { label: 'Format SuiteQL', action: props.onFormat }) }), jsxRuntime.jsx(component.StackPanel.Item, { shrink: 0, children: jsxRuntime.jsx(component.Button, { label: 'Analyze', action: props.onAnalyze }) }), jsxRuntime.jsx(component.StackPanel.Item, { shrink: 0, children: jsxRuntime.jsx(component.Button, { label: 'AI Chat', action: props.onToggleRecordChat }) }), jsxRuntime.jsx(component.StackPanel.Item, { shrink: 0, children: jsxRuntime.jsx(component.CheckBox, { label: 'Run as SuiteQLPaged', labelPosition: component.CheckBox.LabelPosition.RIGHT, value: props.runAsSuiteQLPaged, action: ({ value }) => props.onRunAsSuiteQLPagedChanged(Boolean(value)) }) }), jsxRuntime.jsx(component.StackPanel.Item, { shrink: 0, children: jsxRuntime.jsx(component.TextBox, { text: props.pageSize, placeholder: 'Rows/page', onTextChanged: ({ text }) => props.onPageSizeChanged(text), rootStyle: { width: '110px' } }) }), jsxRuntime.jsx(component.StackPanel.Item, { shrink: 0, children: jsxRuntime.jsx(component.TextBox, { text: props.maxPages, placeholder: 'Pages', onTextChanged: ({ text }) => props.onMaxPagesChanged(text), rootStyle: { width: '90px' } }) }), jsxRuntime.jsx(component.StackPanel.Item, { grow: 1, children: jsxRuntime.jsx(component.Text, { color: component.Text.Color.SECONDARY, children: "Paged mode fetches multiple pages. Direct mode falls back to paged results when the result appears capped." }) })] }) }), jsxRuntime.jsx(component.StackPanel.Item, { children: jsxRuntime.jsx(component.TextArea, { text: props.query, rowCount: 18, resizable: true, resizeDirection: component.TextArea.ResizeDirection.VERTICAL, autoComplete: 'off', rootStyle: {
                                fontFamily: 'Consolas, Monaco, monospace',
                                width: '100%'
                            }, onTextChanged: (args, sender) => props.onQueryChanged(args.text, sender.selection.end || args.text.length) }) }), jsxRuntime.jsx(component.StackPanel.Item, { children: actionableHints.length > 0 ? (jsxRuntime.jsxs(component.StackPanel.Vertical, { itemGap: component.StackPanel.GapSize.SMALL, children: [jsxRuntime.jsx(component.StackPanel.Item, { children: jsxRuntime.jsx(component.Text, { color: component.Text.Color.SECONDARY, children: "SuiteQL Hints" }) }), jsxRuntime.jsx(component.StackPanel.Item, { children: jsxRuntime.jsx(component.StackPanel.Vertical, { itemGap: component.StackPanel.GapSize.SMALL, children: actionableHints.map((hint, index) => (jsxRuntime.jsx(component.StackPanel.Item, { children: renderHint(hint) }, `${hint.severity}-${index}`))) }) })] })) : (jsxRuntime.jsx("div", { style: { display: 'none' } })) }), jsxRuntime.jsx(component.StackPanel.Item, { children: jsxRuntime.jsx(component.StackPanel, { wrap: true, itemGap: component.StackPanel.GapSize.SMALL, wrapGap: component.StackPanel.GapSize.SMALL, children: autocompleteItems.length > 0 ? autocompleteItems : jsxRuntime.jsx(component.StackPanel.Item, { shrink: 0, children: jsxRuntime.jsx("div", { style: { display: 'none' } }) }) }) })] }) }));
    }
    function getActionableHints(hints, executionError) {
        const actionableHints = (hints || []).filter((hint) => hint.severity === 'error' || hint.severity === 'warning');
        if (!executionError) {
            return actionableHints;
        }
        return [
            {
                severity: 'error',
                message: 'SuiteQL execution failed.',
                detail: executionError
            },
            ...actionableHints
        ];
    }
    function renderHint(hint) {
        const isError = hint.severity === 'error';
        return (jsxRuntime.jsxs("div", { style: {
                alignItems: 'flex-start',
                backgroundColor: isError ? '#fce8e6' : '#fff8e1',
                border: `1px solid ${isError ? '#c5221f' : '#f2c94c'}`,
                borderRadius: '4px',
                color: '#1f2937',
                display: 'flex',
                gap: '8px',
                padding: '8px 10px'
            }, children: [jsxRuntime.jsx("span", { style: {
                        alignItems: 'center',
                        backgroundColor: isError ? '#c5221f' : '#8a6d00',
                        borderRadius: '50%',
                        color: '#ffffff',
                        display: 'inline-flex',
                        flex: '0 0 18px',
                        fontSize: '12px',
                        fontWeight: '700',
                        height: '18px',
                        justifyContent: 'center',
                        lineHeight: '18px',
                        marginTop: '1px',
                        width: '18px'
                    }, children: "!" }), jsxRuntime.jsxs("span", { style: { display: 'block', lineHeight: '1.45' }, children: [jsxRuntime.jsxs("strong", { children: [isError ? 'Error' : 'Warning', ":"] }), " ", hint.message, hint.detail ? (jsxRuntime.jsx("span", { style: { display: 'block', marginTop: '2px', whiteSpace: 'pre-wrap' }, children: hint.detail })) : null] })] }));
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

    function QueryDiagnosticsPanel({ performance }) {
        return (jsxRuntime.jsx(component.Portlet, { title: 'SuiteQL Performance Matrix', icon: core.SystemIcon.PERFORMANCE, collapsible: true, children: jsxRuntime.jsx(component.DataGrid, { dataSource: new core.ArrayDataSource(buildPerformanceRows(performance || {})), columns: performanceColumns() }) }));
    }
    function performanceColumns() {
        return [textColumn('metric', 'Metric'), textColumn('value', 'Value'), textColumn('unit', 'Unit')];
    }

    function RecordChatPanel(props) {
        const responseItems = [];
        if (props.error) {
            responseItems.push(jsxRuntime.jsx(component.StackPanel.Item, { children: renderPlainText(props.error, true) }, 'error'));
        }
        props.messages.forEach((message, index) => {
            responseItems.push(jsxRuntime.jsx(component.StackPanel.Item, { children: jsxRuntime.jsxs(component.StackPanel.Vertical, { itemGap: component.StackPanel.GapSize.SMALL, children: [jsxRuntime.jsx(component.StackPanel.Item, { children: jsxRuntime.jsx(component.Text, { color: component.Text.Color.SECONDARY, children: message.role === 'user' ? 'You' : 'AI' }) }), jsxRuntime.jsx(component.StackPanel.Item, { children: message.role === 'assistant' ? (renderMarkdown(message.text, props.merging, props.onInsertSuiteQL, props.onMergeSuiteQL)) : (renderPlainText(message.text)) })] }) }, `${message.role}-${index}`));
        });
        return (jsxRuntime.jsx(component.Portlet, { title: 'AI Report & Schema Chat', icon: core.SystemIcon.HELP, rootStyle: props.rootStyle, children: jsxRuntime.jsxs(component.StackPanel.Vertical, { rootStyle: { height: '100%' }, itemGap: component.StackPanel.GapSize.MEDIUM, children: [jsxRuntime.jsx(component.StackPanel.Item, { shrink: 0, children: jsxRuntime.jsx(component.StackPanel, { alignment: component.StackPanel.Alignment.END, children: jsxRuntime.jsx(component.StackPanel.Item, { shrink: 0, children: jsxRuntime.jsx(component.Button, { label: 'Close', action: props.onClose }) }) }) }), jsxRuntime.jsx(component.StackPanel.Item, { grow: 1, children: jsxRuntime.jsxs(component.StackPanel.Vertical, { rootStyle: { height: '100%' }, itemGap: component.StackPanel.GapSize.SMALL, children: [jsxRuntime.jsx(component.StackPanel.Item, { shrink: 0, children: jsxRuntime.jsx(component.Text, { color: component.Text.Color.SECONDARY, children: "Response" }) }), jsxRuntime.jsx(component.StackPanel.Item, { grow: 1, children: jsxRuntime.jsx(component.ScrollPanel, { orientation: component.ScrollPanel.Orientation.VERTICAL, rootStyle: { height: '100%' }, children: jsxRuntime.jsx(component.StackPanel.Vertical, { itemGap: component.StackPanel.GapSize.MEDIUM, children: responseItems }) }) })] }) }), jsxRuntime.jsx(component.StackPanel.Item, { shrink: 0, children: jsxRuntime.jsxs(component.StackPanel.Vertical, { itemGap: component.StackPanel.GapSize.SMALL, children: [jsxRuntime.jsx(component.StackPanel.Item, { children: jsxRuntime.jsx(component.Text, { color: component.Text.Color.SECONDARY, children: "AI chat tool" }) }), jsxRuntime.jsx(component.StackPanel.Item, { children: jsxRuntime.jsxs(component.StackPanel.Vertical, { itemGap: component.StackPanel.GapSize.SMALL, children: [jsxRuntime.jsx(component.StackPanel.Item, { children: jsxRuntime.jsx(component.CheckBox, { label: 'Use AI query merging', labelPosition: component.CheckBox.LabelPosition.RIGHT, value: props.useAiQueryMerge, action: ({ value }) => props.onUseAiQueryMergeChanged(Boolean(value)) }) }), jsxRuntime.jsx(component.StackPanel.Item, { children: jsxRuntime.jsx(component.Text, { color: component.Text.Color.SECONDARY, children: "Merge to Current Query may use NetSuite AI tokens." }) })] }) }), jsxRuntime.jsx(component.StackPanel.Item, { children: jsxRuntime.jsx(component.TextArea, { text: props.draft, rowCount: 4, resizable: true, resizeDirection: component.TextArea.ResizeDirection.VERTICAL, rootStyle: { width: '100%' }, onTextChanged: ({ text }) => props.onDraftChanged(text) }) }), jsxRuntime.jsx(component.StackPanel.Item, { children: jsxRuntime.jsxs(component.StackPanel, { alignment: component.StackPanel.Alignment.CENTER, itemGap: component.StackPanel.GapSize.MEDIUM, children: [jsxRuntime.jsx(component.StackPanel.Item, { shrink: 0, children: jsxRuntime.jsx(component.Button, { label: props.running ? 'Asking...' : 'Ask AI', type: component.Button.Type.PRIMARY, action: props.onAsk }) }), jsxRuntime.jsx(component.StackPanel.Item, { shrink: 0, children: jsxRuntime.jsx(component.Button, { label: 'Clear Chat', action: props.onClear }) })] }) })] }) })] }) }));
    }
    function renderMarkdown(text, merging, onInsertSuiteQL, onMergeSuiteQL) {
        const items = parseMarkdownBlocks(text).map((block, index) => (jsxRuntime.jsx(component.StackPanel.Item, { children: block.type === 'code' ? (renderCodeBlock(block.content, block.language, merging, onInsertSuiteQL, onMergeSuiteQL)) : (component.FormattedText.markdown(block.content, {
                wrap: true,
                whitespace: true
            })) }, `markdown-${index}`)));
        return jsxRuntime.jsx(component.StackPanel.Vertical, { itemGap: component.StackPanel.GapSize.SMALL, children: items });
    }
    function renderPlainText(text, isError = false) {
        return (jsxRuntime.jsx("div", { style: {
                backgroundColor: isError ? '#fce8e6' : '#f8fafc',
                border: `1px solid ${isError ? '#c5221f' : '#d5dce8'}`,
                borderRadius: '4px',
                color: isError ? '#8a1c16' : '#1f2937',
                fontFamily: 'inherit',
                fontSize: '14px',
                lineHeight: '1.45',
                padding: '8px 10px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
            }, children: text }));
    }
    function renderCodeBlock(text, language, merging, onInsertSuiteQL, onMergeSuiteQL) {
        const showSuiteQLActions = isSuiteQLBlock(language, text);
        return (jsxRuntime.jsxs(component.StackPanel.Vertical, { itemGap: component.StackPanel.GapSize.SMALL, children: [jsxRuntime.jsx(component.StackPanel.Item, { children: jsxRuntime.jsx("pre", { style: {
                            backgroundColor: '#f6f8fa',
                            border: '1px solid #d0d7de',
                            borderRadius: '4px',
                            color: '#24292f',
                            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                            fontSize: '13px',
                            lineHeight: '1.45',
                            margin: '0',
                            overflowX: 'auto',
                            padding: '10px 12px',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word'
                        }, children: text || ' ' }) }), jsxRuntime.jsx(component.StackPanel.Item, { children: showSuiteQLActions ? (jsxRuntime.jsxs(component.StackPanel, { alignment: component.StackPanel.Alignment.CENTER, itemGap: component.StackPanel.GapSize.SMALL, children: [jsxRuntime.jsx(component.StackPanel.Item, { shrink: 0, children: jsxRuntime.jsx(component.Button, { label: 'Insert to Query Editor', action: () => onInsertSuiteQL(text) }) }), jsxRuntime.jsx(component.StackPanel.Item, { shrink: 0, children: jsxRuntime.jsx(component.Button, { label: merging ? 'Merging...' : 'Merge to Current Query', action: () => onMergeSuiteQL(text) }) })] })) : (jsxRuntime.jsx("div", { style: { display: 'none' } })) })] }));
    }
    function parseMarkdownBlocks(text) {
        const blocks = [];
        const pattern = /```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g;
        let cursor = 0;
        let match;
        while ((match = pattern.exec(text)) !== null) {
            const prose = text.slice(cursor, match.index).trim();
            if (prose) {
                blocks.push({
                    type: 'markdown',
                    content: prose,
                    language: ''
                });
            }
            const parsedCode = parseCodeFence(match[1], match[2]);
            blocks.push({
                type: 'code',
                content: parsedCode.content,
                language: parsedCode.language
            });
            cursor = match.index + match[0].length;
        }
        const trailing = text.slice(cursor).trim();
        if (trailing || blocks.length === 0) {
            blocks.push({
                type: 'markdown',
                content: trailing || text,
                language: ''
            });
        }
        return blocks;
    }
    function parseCodeFence(language, content) {
        const normalizedLanguage = String(language || '').trim().toLowerCase();
        const normalizedContent = String(content || '').trim();
        const sameLineLanguageMatch = normalizedContent.match(/^(sql|javascript|js|css|html|xml|java)\s+([\s\S]+)$/i);
        if (!normalizedLanguage && sameLineLanguageMatch) {
            return {
                language: sameLineLanguageMatch[1].toLowerCase(),
                content: sameLineLanguageMatch[2].trim()
            };
        }
        return {
            language: normalizedLanguage,
            content: normalizedContent
        };
    }
    function isSuiteQLBlock(language, content) {
        const normalizedLanguage = String(language || '').trim().toLowerCase();
        const normalizedContent = String(content || '').trim();
        if (normalizedLanguage === 'sql' || normalizedLanguage === 'suiteql') {
            return true;
        }
        return /^(SELECT|WITH)\b/i.test(normalizedContent) || /\bFROM\s+[A-Za-z0-9_.$"]+/i.test(normalizedContent);
    }

    function ResultsPanel(props) {
        if (props.error) {
            return (jsxRuntime.jsx(component.Portlet, { title: 'Result', icon: core.SystemIcon.ERROR, collapsible: true, children: jsxRuntime.jsx(component.Code, { content: props.error, language: component.Code.Language.TEXT, background: component.Code.Background.ERROR, lineWrapping: true }) }));
        }
        if (props.rows.length === 0) {
            return (jsxRuntime.jsx(component.Portlet, { title: 'Result', icon: core.SystemIcon.LIST, collapsible: true, children: jsxRuntime.jsx(component.Text, { color: component.Text.Color.SECONDARY, children: "No results yet. Run a SuiteQL query to populate the grid." }) }));
        }
        return (jsxRuntime.jsx(component.Portlet, { title: `Result (${props.rows.length} rows shown)`, icon: core.SystemIcon.LIST, collapsible: true, children: jsxRuntime.jsx(component.DataGrid, { dataSource: new core.ArrayDataSource(props.rows), columns: props.columns.map((column) => textColumn(column)) }) }));
    }

    const WORKING_QUERY_STORAGE_KEY = 'suiteqlrunner.workingQuery';
    class SuiteQLRunner extends core.PureComponent {
        restletGateway = new NetSuiteRestletQueryGateway();
        queryRunner = new QueryRunnerService(this.restletGateway);
        recordChat = new RecordChatService(this.restletGateway);
        constructor(props, context) {
            super(props, context);
            const workingQuery = this.loadWorkingQuery();
            this.state = {
                query: workingQuery,
                hints: analyzeSuiteQL(workingQuery),
                suggestions: getCompletions(workingQuery, workingQuery.length),
                resultRows: [],
                resultColumns: [],
                error: null,
                executionMode: 'RUN_SUITEQL_PAGED',
                running: false,
                maxPages: String(DEFAULT_MAX_PAGES),
                pageSize: String(DEFAULT_PAGE_SIZE),
                caretPosition: workingQuery.length,
                performance: {},
                recordChatDraft: '',
                recordChatError: null,
                recordChatMerging: false,
                recordChatMessages: [
                    {
                        role: 'assistant',
                        text: 'Ask about NetSuite reports, searches, record types, field IDs, joins, table relationships, and SuiteQL patterns.'
                    }
                ],
                recordChatRunning: false,
                recordChatVisible: false,
                useAiQueryMerge: true
            };
        }
        render() {
            return (jsxRuntime.jsx(component.ThemeSelector, { supportedThemes: [core.Theme.Name.REDWOOD, core.Theme.Name.REFRESHED], children: jsxRuntime.jsx(component.StackPanel.Vertical, { rootStyle: { height: '100%' }, children: this.renderLayoutItems() }) }));
        }
        renderLayoutItems() {
            const items = [
                jsxRuntime.jsx(component.StackPanel.Item, { shrink: 0, children: jsxRuntime.jsxs("div", { style: { position: 'relative' }, children: [jsxRuntime.jsx(component.ApplicationHeader, { icon: core.SystemIcon.SEARCH, title: 'SuiteQL Runner', subtitle: 'Format, inspect, execute, and measure SuiteQL' }), jsxRuntime.jsx("a", { href: 'https://dgenticdrive.com', target: '_blank', rel: 'noopener noreferrer', style: {
                                    color: '#5f6f89',
                                    fontSize: '12px',
                                    position: 'absolute',
                                    right: '20px',
                                    textDecoration: 'none',
                                    top: '14px'
                                }, children: "dgenticdrive.com" })] }) }, 'header'),
                jsxRuntime.jsx(component.StackPanel.Item, { grow: 1, children: jsxRuntime.jsx(component.ScrollPanel, { orientation: component.ScrollPanel.Orientation.VERTICAL, children: jsxRuntime.jsx(component.ContentPanel, { outerGap: component.ContentPanel.GapSize.LARGE, children: jsxRuntime.jsxs(component.StackPanel.Vertical, { itemGap: component.StackPanel.GapSize.LARGE, children: [jsxRuntime.jsx(component.StackPanel.Item, { children: jsxRuntime.jsx(QueryEditor, { executionError: this.state.error, hints: this.state.hints, maxPages: this.state.maxPages, pageSize: this.state.pageSize, query: this.state.query, runAsSuiteQLPaged: this.state.executionMode === 'RUN_SUITEQL_PAGED', running: this.state.running, suggestions: this.state.suggestions, onAnalyze: () => this.analyzeQuery(), onFormat: () => this.formatQuery(), onInsertSuggestion: (suggestion) => this.insertSuggestion(suggestion), onMaxPagesChanged: (maxPages) => this.setState({ maxPages }), onPageSizeChanged: (pageSize) => this.setState({ pageSize }), onQueryChanged: (query, caretPosition) => this.onQueryChanged(query, caretPosition), onRunAsSuiteQLPagedChanged: (runAsSuiteQLPaged) => this.setState({ executionMode: runAsSuiteQLPaged ? 'RUN_SUITEQL_PAGED' : 'RUN_SUITEQL' }), onRun: () => this.runQuery(), onToggleRecordChat: () => this.toggleRecordChat() }) }), jsxRuntime.jsx(component.StackPanel.Item, { children: jsxRuntime.jsx(ResultsPanel, { columns: this.state.resultColumns, error: this.state.error, rows: this.state.resultRows }) }), jsxRuntime.jsx(component.StackPanel.Item, { children: jsxRuntime.jsx(QueryDiagnosticsPanel, { performance: this.state.performance }) })] }) }) }) }, 'main')
            ];
            if (this.state.recordChatVisible) {
                items.push(jsxRuntime.jsx(component.StackPanel.Item, { shrink: 0, basis: '0px', children: jsxRuntime.jsx("div", { style: {
                            position: 'fixed',
                            right: '32px',
                            top: '84px',
                            width: '440px',
                            height: 'calc(100vh - 108px)',
                            minWidth: '360px',
                            minHeight: '360px',
                            maxHeight: 'calc(100vh - 108px)',
                            resize: 'both',
                            direction: 'rtl',
                            writingMode: 'horizontal-tb',
                            overflow: 'hidden',
                            zIndex: '1000',
                            boxShadow: '0 18px 48px rgba(15, 23, 42, 0.24)'
                        }, children: jsxRuntime.jsx(RecordChatPanel, { draft: this.state.recordChatDraft, error: this.state.recordChatError, merging: this.state.recordChatMerging, messages: this.state.recordChatMessages, running: this.state.recordChatRunning, rootStyle: {
                                width: '100%',
                                height: '100%',
                                overflow: 'hidden',
                                direction: 'ltr'
                            }, onAsk: () => this.askRecordChat(), onClear: () => this.clearRecordChat(), onClose: () => this.closeRecordChat(), onDraftChanged: (recordChatDraft) => this.setState({ recordChatDraft }), onInsertSuiteQL: (query) => this.insertSuiteQLFromChat(query), onMergeSuiteQL: (query) => this.mergeSuiteQLFromChat(query), onUseAiQueryMergeChanged: (useAiQueryMerge) => this.setState({ useAiQueryMerge }), useAiQueryMerge: this.state.useAiQueryMerge }) }) }, 'record-chat'));
            }
            return items;
        }
        onQueryChanged(query, caretPosition) {
            this.setState({
                query,
                caretPosition,
                error: null,
                hints: analyzeSuiteQL(query),
                suggestions: getCompletions(query, caretPosition)
            });
        }
        formatQuery() {
            const formatted = formatSuiteQL(this.state.query);
            this.saveWorkingQuery(formatted);
            this.setState({
                query: formatted,
                error: null,
                hints: analyzeSuiteQL(formatted),
                suggestions: getCompletions(formatted, formatted.length),
                caretPosition: formatted.length
            });
        }
        analyzeQuery() {
            this.saveWorkingQuery(this.state.query);
            this.setState({
                error: null,
                hints: analyzeSuiteQL(this.state.query),
                suggestions: getCompletions(this.state.query, this.state.caretPosition)
            });
        }
        insertSuggestion(suggestion) {
            const replacement = replaceActiveToken(this.state.query, this.state.caretPosition, suggestion.insert);
            this.setState({
                query: replacement.query,
                caretPosition: replacement.caret,
                error: null,
                hints: analyzeSuiteQL(replacement.query),
                suggestions: getCompletions(replacement.query, replacement.caret)
            });
        }
        insertSuiteQLFromChat(query) {
            const nextQuery = query.trim();
            this.setEditorQuery(nextQuery);
        }
        async mergeSuiteQLFromChat(query) {
            if (!this.state.useAiQueryMerge) {
                this.basicMergeSuiteQLFromChat(query, null);
                return;
            }
            this.setState({
                recordChatMerging: true,
                recordChatError: null
            });
            const outcome = await this.recordChat.ask(buildMergePrompt(query), this.state.recordChatMessages, this.state.query);
            const mergedQuery = extractSuiteQLFromText(getLastAssistantMessage(outcome.messages));
            if (outcome.error || !mergedQuery) {
                this.basicMergeSuiteQLFromChat(query, 'AI is not available to merge the query. Basic merge was applied instead.');
                this.setState({
                    recordChatMessages: outcome.messages,
                    recordChatMerging: false
                });
                return;
            }
            this.setEditorQuery(mergedQuery);
            this.setState({
                recordChatError: null,
                recordChatMessages: outcome.messages,
                recordChatMerging: false
            });
        }
        basicMergeSuiteQLFromChat(query, warning) {
            const nextQuery = basicMergeQueries(this.state.query, query);
            this.setEditorQuery(nextQuery);
            if (warning) {
                this.setState({
                    recordChatError: warning
                });
            }
        }
        setEditorQuery(query) {
            this.setState({
                query,
                caretPosition: query.length,
                error: null,
                hints: analyzeSuiteQL(query),
                suggestions: getCompletions(query, query.length)
            });
        }
        async runQuery() {
            this.saveWorkingQuery(this.state.query);
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
        async askRecordChat() {
            this.setState({
                recordChatRunning: true,
                recordChatError: null
            });
            const outcome = await this.recordChat.ask(this.state.recordChatDraft, this.state.recordChatMessages, this.state.query);
            this.setState({
                recordChatDraft: outcome.error ? this.state.recordChatDraft : '',
                recordChatError: outcome.error,
                recordChatMessages: outcome.messages,
                recordChatRunning: false
            });
        }
        toggleRecordChat() {
            this.setState({
                recordChatVisible: !this.state.recordChatVisible
            });
        }
        closeRecordChat() {
            this.setState({
                recordChatVisible: false
            });
        }
        clearRecordChat() {
            this.setState({
                recordChatDraft: '',
                recordChatError: null,
                recordChatMessages: []
            });
        }
        loadWorkingQuery() {
            try {
                return window.localStorage.getItem(WORKING_QUERY_STORAGE_KEY) || '';
            }
            catch {
                return '';
            }
        }
        saveWorkingQuery(query) {
            try {
                window.localStorage.setItem(WORKING_QUERY_STORAGE_KEY, query);
            }
            catch {
                // Query persistence is best-effort; private browsing or account policy can block storage.
            }
        }
    }
    function buildMergePrompt(query) {
        return [
            'Merge this SQL/SuiteQL suggestion into the current Query Editor SuiteQL.',
            'Return only one complete merged SuiteQL query in a fenced sql code block.',
            'Do not include explanation outside the code block.',
            'Preserve the current query intent and incorporate useful columns, joins, filters, grouping, and ordering from the suggestion.',
            '',
            'SQL/SuiteQL suggestion to merge:',
            '```sql',
            query.trim(),
            '```'
        ].join('\n');
    }
    function getLastAssistantMessage(messages) {
        for (let index = messages.length - 1; index >= 0; index -= 1) {
            if (messages[index].role === 'assistant') {
                return messages[index].text;
            }
        }
        return '';
    }
    function extractSuiteQLFromText(text) {
        const codePattern = /```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g;
        let match;
        while ((match = codePattern.exec(text)) !== null) {
            const language = String(match[1] || '').trim().toLowerCase();
            const content = String(match[2] || '').trim();
            if (isSuiteQLText(language, content)) {
                return content;
            }
        }
        const trimmed = String(text || '').trim();
        if (isSuiteQLText('', trimmed)) {
            return trimmed;
        }
        return '';
    }
    function isSuiteQLText(language, content) {
        if (language === 'sql' || language === 'suiteql') {
            return true;
        }
        return /^(SELECT|WITH)\b/i.test(content);
    }
    function basicMergeQueries(currentQuery, incomingQuery) {
        const current = String(currentQuery || '').trim();
        const incoming = String(incomingQuery || '').trim();
        if (!current) {
            return incoming;
        }
        if (!incoming || current === incoming) {
            return current;
        }
        return [current, '-- Merged SuiteQL suggestion', incoming].join('\n\n');
    }

    const run = (context) => {
        context.setLayout('application');
        context.setContent(jsxRuntime.jsx(SuiteQLRunner, {}));
    };

    exports.run = run;

}));
