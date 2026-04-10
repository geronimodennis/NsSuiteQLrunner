import {
  GatewayRecordChatResponse,
  QueryExecutionMeta,
  RecordChatGateway,
  RecordChatMessage,
  RecordChatOutcome
} from '../domain/models';

const MAX_HISTORY_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 4000;

export class RecordChatService {
  constructor(private readonly gateway: RecordChatGateway) {}

  async ask(message: string, history: RecordChatMessage[]): Promise<RecordChatOutcome> {
    const normalizedMessage = normalizeMessage(message);

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
        role: 'user' as const,
        text: normalizedMessage
      }
    ];

    try {
      const startedAt = Date.now();
      const response = await this.gateway.askRecordQuestion({
        action: 'CHAT_RECORDS',
        message: normalizedMessage,
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
        messages: response.messages && response.messages.length > 0 ? response.messages : appendAssistant(optimisticMessages, response.answer),
        meta,
        error: null
      };
    } catch (error) {
      return {
        messages: optimisticMessages,
        meta: {},
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}

function normalizeMessage(message: string): string {
  return String(message || '').trim().slice(0, MAX_MESSAGE_LENGTH);
}

function trimHistory(history: RecordChatMessage[]): RecordChatMessage[] {
  return history
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .filter((message) => normalizeMessage(message.text).length > 0)
    .slice(-MAX_HISTORY_MESSAGES)
    .map((message) => ({
      role: message.role,
      text: normalizeMessage(message.text)
    }));
}

function appendAssistant(messages: RecordChatMessage[], answer: string): RecordChatMessage[] {
  return [
    ...messages,
    {
      role: 'assistant',
      text: answer || 'No answer was returned by the NetSuite LLM module.'
    }
  ];
}

function buildChatMeta(response: GatewayRecordChatResponse, requestLatencyMs: number): QueryExecutionMeta {
  return {
    ...(response.meta || {}),
    requestLatencyMs,
    httpStatus: response.httpStatus
  };
}

function formatChatError(response: GatewayRecordChatResponse): string {
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
