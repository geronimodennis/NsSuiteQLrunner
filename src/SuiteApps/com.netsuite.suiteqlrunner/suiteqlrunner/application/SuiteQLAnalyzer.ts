import {
  FORBIDDEN_MUTATION_KEYWORDS,
  ORACLE_FUNCTIONS,
  SQL_SERVER_PATTERNS,
  SUITEQL_FUNCTIONS
} from '../domain/suiteqlCatalog';
import {QueryHint} from '../domain/models';
import {stripCommentsAndLiterals} from '../domain/queryText';

const COMMON_UNSUPPORTED_FUNCTIONS: ReadonlyArray<readonly [string, string]> = [
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

export function analyzeSuiteQL(query: string): QueryHint[] {
  const hints: QueryHint[] = [];
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
  addPotentialSyntaxHints(analysisText, hints);
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

function addMutationHints(analysisText: string, hints: QueryHint[]) {
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

function addSqlServerDialectHints(analysisText: string, hints: QueryHint[]) {
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

function addPotentialSyntaxHints(analysisText: string, hints: QueryHint[]) {
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
}

function addUnsupportedFunctionHints(analysisText: string, hints: QueryHint[]) {
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
    if (
      KNOWN_FUNCTIONS.has(functionName) ||
      COMMON_UNSUPPORTED_FUNCTION_NAMES.has(functionName) ||
      FUNCTION_SYNTAX_WORDS.has(functionName)
    ) {
      return;
    }

    hints.push({
      severity: 'warning',
      message: `${functionName} is not in the known SuiteQL/Oracle function list.`,
      detail: 'This static check may not know every account-supported function. Verify the function name or replace it with a documented SuiteQL or Oracle equivalent.'
    });
  });
}

function addIdentifierHints(query: string, hints: QueryHint[]) {
  if (/\[[^\]]+\]/.test(query)) {
    hints.push({
      severity: 'warning',
      message: 'Square-bracket identifiers detected.',
      detail: 'Oracle and SuiteQL identifiers use unquoted names or double quotes, not SQL Server square brackets.'
    });
  }
}

function addOracleLimitHint(analysisText: string, hints: QueryHint[]) {
  if (/\bLIMIT\b/i.test(analysisText)) {
    hints.push({
      severity: 'warning',
      message: 'LIMIT detected.',
      detail: 'Use SuiteQL TOP, ROWNUM, or Oracle row limiting syntax depending on the target account support.'
    });
  }
}

function addPerformanceHints(analysisText: string, hints: QueryHint[]) {
  if (/\bSELECT\s+\*/i.test(analysisText)) {
    hints.push({
      severity: 'info',
      message: 'SELECT * can be expensive.',
      detail: 'For repeatable performance, select only the columns needed by the analysis.'
    });
  }
}

function hasMultipleStatements(analysisText: string): boolean {
  const withoutTrailingSemicolon = analysisText.trim().replace(/;+\s*$/, '');
  return /;/.test(withoutTrailingSemicolon);
}

function getFunctionCalls(analysisText: string): string[] {
  const functions = new Set<string>();
  const pattern = /\b((?:BUILTIN\.)?[A-Z][A-Z0-9_$#]*)\s*\(/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(analysisText)) !== null) {
    functions.add(match[1].toUpperCase());
  }

  return Array.from(functions);
}

function getBalanceHint(query: string): QueryHint | null {
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
      } else {
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
    } else if (char === ')') {
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

