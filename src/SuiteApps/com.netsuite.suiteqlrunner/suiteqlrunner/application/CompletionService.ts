import {CompletionItem} from '../domain/models';
import {COMPLETIONS} from '../domain/suiteqlCatalog';
import {getActiveToken} from '../domain/queryText';

const DEFAULT_COMPLETION_LIMIT = 12;

export function getCompletions(query: string, caretPosition: number): CompletionItem[] {
  const token = getActiveToken(query, caretPosition).toUpperCase();

  if (!token) {
    return COMPLETIONS.slice(0, DEFAULT_COMPLETION_LIMIT);
  }

  return COMPLETIONS.filter((item) => item.name.toUpperCase().startsWith(token)).slice(0, DEFAULT_COMPLETION_LIMIT);
}

