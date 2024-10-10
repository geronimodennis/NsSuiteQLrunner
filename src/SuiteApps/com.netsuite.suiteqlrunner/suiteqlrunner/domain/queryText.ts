export function getActiveToken(query: string, caretPosition: number): string {
  let start = caretPosition;

  while (start > 0 && /[A-Za-z0-9_.$#]/.test(query[start - 1])) {
    start -= 1;
  }

  return query.slice(start, caretPosition);
}

export function replaceActiveToken(
  query: string,
  caretPosition: number,
  replacement: string
): {query: string; caret: number} {
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

export function stripCommentsAndLiterals(query: string): string {
  return query.replace(/(--[^\n\r]*|\/\*[\s\S]*?\*\/|'(?:''|[^'])*'|"(?:[^"]|"")*")/g, ' ');
}

