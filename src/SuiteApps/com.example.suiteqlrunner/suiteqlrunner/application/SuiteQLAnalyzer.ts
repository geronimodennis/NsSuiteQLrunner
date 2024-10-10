import {FORBIDDEN_MUTATION_KEYWORDS, SQL_SERVER_PATTERNS} from '../domain/suiteqlCatalog';
import {QueryHint} from '../domain/models';
import {stripCommentsAndLiterals} from '../domain/queryText';

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

