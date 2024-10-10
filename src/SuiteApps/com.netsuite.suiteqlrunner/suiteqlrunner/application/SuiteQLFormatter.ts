import {KEYWORDS} from '../domain/suiteqlCatalog';

const KEYWORD_PATTERN = new RegExp(`\\b(${KEYWORDS.join('|')})\\b`, 'gi');

export function formatSuiteQL(query: string): string {
  if (!query.trim()) {
    return query;
  }

  const literals: string[] = [];
  let protectedSql = protectLiterals(query, literals);

  protectedSql = protectedSql.replace(/\s+/g, ' ').trim();
  protectedSql = protectedSql.replace(KEYWORD_PATTERN, (match) => match.toUpperCase());
  protectedSql = breakBeforeClauses(protectedSql);
  protectedSql = applyMssqlStyleIndentation(protectedSql);

  return restoreLiterals(protectedSql, literals);
}

function protectLiterals(query: string, literals: string[]): string {
  return query.replace(/(--[^\n\r]*|\/\*[\s\S]*?\*\/|'(?:''|[^'])*'|"(?:[^"]|"")*")/g, (match) => {
    const token = `@@SQL_LITERAL_${literals.length}@@`;
    literals.push(match);
    return token;
  });
}

function breakBeforeClauses(query: string): string {
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

function applyMssqlStyleIndentation(query: string): string {
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

function restoreLiterals(query: string, literals: string[]): string {
  let formatted = query;

  literals.forEach((literal, index) => {
    formatted = formatted.replace(`@@SQL_LITERAL_${index}@@`, literal);
  });

  return formatted;
}

