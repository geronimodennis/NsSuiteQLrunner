import {ApplicationHeader, Button, ContentPanel, Portlet, ScrollPanel, StackPanel, Text, ThemeSelector} from '@uif-js/component';
import {PureComponent, SystemIcon, Theme} from '@uif-js/core';
import {getCompletions} from './application/CompletionService';
import {QueryRunnerService} from './application/QueryRunnerService';
import {RecordChatService} from './application/RecordChatService';
import {analyzeSuiteQL} from './application/SuiteQLAnalyzer';
import {formatSuiteQL} from './application/SuiteQLFormatter';
import {CompletionItem, QueryExecutionMeta, QueryExecutionMode, QueryHint, RecordChatMessage} from './domain/models';
import {replaceActiveToken} from './domain/queryText';
import {DEFAULT_MAX_PAGES, DEFAULT_PAGE_SIZE} from './domain/suiteqlCatalog';
import {NetSuiteRestletQueryGateway} from './infrastructure/NetSuiteRestletQueryGateway';
import {QueryEditor} from './presentation/QueryEditor';
import {QueryDiagnosticsPanel} from './presentation/QueryDiagnosticsPanel';
import {RecordChatPanel} from './presentation/RecordChatPanel';
import {ResultsPanel} from './presentation/ResultsPanel';

const WORKING_QUERY_STORAGE_KEY = 'suiteqlrunner.workingQuery';
const RECORD_CHAT_HISTORY_STORAGE_KEY = 'suiteqlrunner.recordChatHistory';

interface RecordChatHistoryEntry {
  id: string;
  title: string;
  updatedAt: number;
  messages: RecordChatMessage[];
}

interface RunnerState {
  query: string;
  hints: QueryHint[];
  suggestions: CompletionItem[];
  resultRows: Record<string, unknown>[];
  resultColumns: string[];
  error: string | null;
  executionMode: QueryExecutionMode;
  running: boolean;
  maxPages: string;
  pageSize: string;
  caretPosition: number;
  performance: QueryExecutionMeta;
  recordChatDraft: string;
  recordChatError: string | null;
  recordChatMerging: boolean;
  recordChatHistory: RecordChatHistoryEntry[];
  recordChatHistoryVisible: boolean;
  recordChatMessages: RecordChatMessage[];
  recordChatRunning: boolean;
  recordChatVisible: boolean;
  activeRecordChatId: string;
  useAiQueryMerge: boolean;
}

export default class SuiteQLRunner extends PureComponent<Record<string, never>, RunnerState> {
  private readonly restletGateway = new NetSuiteRestletQueryGateway();
  private readonly queryRunner = new QueryRunnerService(this.restletGateway);
  private readonly recordChat = new RecordChatService(this.restletGateway);

  constructor(props, context) {
    super(props, context);
    const workingQuery = this.loadWorkingQuery();
    const chatHistory = this.loadRecordChatHistory();
    const activeChat = chatHistory[0] || createRecordChatHistoryEntry(initialRecordChatMessages());

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
      recordChatHistory: chatHistory.length > 0 ? chatHistory : [activeChat],
      recordChatHistoryVisible: false,
      recordChatMessages: activeChat.messages,
      recordChatRunning: false,
      recordChatVisible: false,
      activeRecordChatId: activeChat.id,
      useAiQueryMerge: true
    };
  }

  render() {
    return (
      <ThemeSelector supportedThemes={[Theme.Name.REDWOOD, Theme.Name.REFRESHED]}>
        <StackPanel.Vertical rootStyle={{height: '100%'}}>{this.renderLayoutItems()}</StackPanel.Vertical>
      </ThemeSelector>
    );
  }

  private renderLayoutItems() {
    const items = [
      <StackPanel.Item key={'header'} shrink={0}>
        <div style={{position: 'relative'}}>
          <ApplicationHeader
            icon={SystemIcon.SEARCH}
            title={'SuiteQL Runner'}
            subtitle={'Format, inspect, execute, and measure SuiteQL'}
          />
          <a
            href={'https://dgenticdrive.com'}
            target={'_blank'}
            rel={'noopener noreferrer'}
            style={{
              color: '#5f6f89',
              fontSize: '12px',
              position: 'absolute',
              right: '20px',
              textDecoration: 'none',
              top: '14px'
            }}
          >
            dgenticdrive.com
          </a>
        </div>
      </StackPanel.Item>,
      <StackPanel.Item key={'main'} grow={1}>
        <ScrollPanel orientation={ScrollPanel.Orientation.VERTICAL}>
          <ContentPanel outerGap={ContentPanel.GapSize.LARGE}>
            <StackPanel.Vertical itemGap={StackPanel.GapSize.LARGE}>
              <StackPanel.Item>
                <QueryEditor
                  executionError={this.state.error}
                  hints={this.state.hints}
                  maxPages={this.state.maxPages}
                  pageSize={this.state.pageSize}
                  query={this.state.query}
                  runAsSuiteQLPaged={this.state.executionMode === 'RUN_SUITEQL_PAGED'}
                  running={this.state.running}
                  suggestions={this.state.suggestions}
                  onAnalyze={() => this.analyzeQuery()}
                  onFormat={() => this.formatQuery()}
                  onInsertSuggestion={(suggestion) => this.insertSuggestion(suggestion)}
                  onMaxPagesChanged={(maxPages) => this.setState({maxPages})}
                  onPageSizeChanged={(pageSize) => this.setState({pageSize})}
                  onQueryChanged={(query, caretPosition) => this.onQueryChanged(query, caretPosition)}
                  onRunAsSuiteQLPagedChanged={(runAsSuiteQLPaged) =>
                    this.setState({executionMode: runAsSuiteQLPaged ? 'RUN_SUITEQL_PAGED' : 'RUN_SUITEQL'})
                  }
                  onRun={() => this.runQuery()}
                  onToggleRecordChat={() => this.toggleRecordChat()}
                />
              </StackPanel.Item>
              <StackPanel.Item>
                <ResultsPanel
                  columns={this.state.resultColumns}
                  error={this.state.error}
                  rows={this.state.resultRows}
                />
              </StackPanel.Item>
              <StackPanel.Item>
                <QueryDiagnosticsPanel performance={this.state.performance} />
              </StackPanel.Item>
            </StackPanel.Vertical>
          </ContentPanel>
        </ScrollPanel>
      </StackPanel.Item>
    ];

    if (this.state.recordChatVisible) {
      items.push(
        <StackPanel.Item key={'record-chat'} shrink={0} basis={'0px'}>
          <div
            style={{
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
            }}
          >
            <RecordChatPanel
              draft={this.state.recordChatDraft}
              error={this.state.recordChatError}
              merging={this.state.recordChatMerging}
              messages={this.state.recordChatMessages}
              running={this.state.recordChatRunning}
              rootStyle={{
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                direction: 'ltr'
              }}
              onAsk={() => this.askRecordChat()}
              onClear={() => this.clearRecordChat()}
              onClose={() => this.closeRecordChat()}
              onDraftChanged={(recordChatDraft) => this.setState({recordChatDraft})}
              onInsertSuiteQL={(query) => this.insertSuiteQLFromChat(query)}
              onMergeSuiteQL={(query) => this.mergeSuiteQLFromChat(query)}
              onToggleHistory={() => this.toggleRecordChatHistory()}
              onUseAiQueryMergeChanged={(useAiQueryMerge) => this.setState({useAiQueryMerge})}
              useAiQueryMerge={this.state.useAiQueryMerge}
            />
          </div>
        </StackPanel.Item>
      );
    }

    if (this.state.recordChatVisible && this.state.recordChatHistoryVisible) {
      items.push(
        <StackPanel.Item key={'record-chat-history'} shrink={0} basis={'0px'}>
          <div
            style={{
              position: 'fixed',
              right: '488px',
              top: '84px',
              width: '360px',
              maxHeight: 'calc(100vh - 108px)',
              overflow: 'hidden',
              zIndex: '1000',
              boxShadow: '0 18px 48px rgba(15, 23, 42, 0.2)'
            }}
          >
            {this.renderRecordChatHistoryPanel()}
          </div>
        </StackPanel.Item>
      );
    }

    return items;
  }

  private renderRecordChatHistoryPanel() {
    const historyItems = this.state.recordChatHistory.map((entry) => (
      <StackPanel.Item key={entry.id}>
        <div
          style={{
            border: entry.id === this.state.activeRecordChatId ? '1px solid #6f85a8' : '1px solid #d5dce8',
            borderRadius: '4px',
            padding: '8px'
          }}
        >
          <StackPanel.Vertical itemGap={StackPanel.GapSize.SMALL}>
            <StackPanel.Item>
              <Text>{entry.title}</Text>
            </StackPanel.Item>
            <StackPanel.Item>
              <Text color={Text.Color.SECONDARY}>{formatHistoryDate(entry.updatedAt)}</Text>
            </StackPanel.Item>
            <StackPanel.Item>
              <StackPanel itemGap={StackPanel.GapSize.SMALL}>
                <StackPanel.Item shrink={0}>
                  <Button label={'Load'} action={() => this.loadRecordChat(entry.id)} />
                </StackPanel.Item>
                <StackPanel.Item shrink={0}>
                  <Button label={'Delete'} action={() => this.deleteRecordChat(entry.id)} />
                </StackPanel.Item>
              </StackPanel>
            </StackPanel.Item>
          </StackPanel.Vertical>
        </div>
      </StackPanel.Item>
    ));

    return (
      <Portlet title={'AI Chat History'} icon={SystemIcon.LIST}>
        <StackPanel.Vertical itemGap={StackPanel.GapSize.MEDIUM}>
          <StackPanel.Item>
            <StackPanel itemGap={StackPanel.GapSize.SMALL}>
              <StackPanel.Item shrink={0}>
                <Button label={'Close'} action={() => this.toggleRecordChatHistory()} />
              </StackPanel.Item>
              <StackPanel.Item shrink={0}>
                <Button label={'New Chat'} type={Button.Type.PRIMARY} action={() => this.createNewRecordChat()} />
              </StackPanel.Item>
              <StackPanel.Item shrink={0}>
                <Button label={'Clear All'} action={() => this.clearRecordChatHistory()} />
              </StackPanel.Item>
            </StackPanel>
          </StackPanel.Item>
          <StackPanel.Item>
            <ScrollPanel orientation={ScrollPanel.Orientation.VERTICAL} rootStyle={{maxHeight: 'calc(100vh - 220px)'}}>
              <StackPanel.Vertical itemGap={StackPanel.GapSize.SMALL}>
                {historyItems.length > 0 ? historyItems : <StackPanel.Item><Text color={Text.Color.SECONDARY}>No chat history yet.</Text></StackPanel.Item>}
              </StackPanel.Vertical>
            </ScrollPanel>
          </StackPanel.Item>
        </StackPanel.Vertical>
      </Portlet>
    );
  }

  private onQueryChanged(query: string, caretPosition: number) {
    this.setState({
      query,
      caretPosition,
      error: null,
      hints: analyzeSuiteQL(query),
      suggestions: getCompletions(query, caretPosition)
    });
  }

  private formatQuery() {
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

  private analyzeQuery() {
    this.saveWorkingQuery(this.state.query);

    this.setState({
      error: null,
      hints: analyzeSuiteQL(this.state.query),
      suggestions: getCompletions(this.state.query, this.state.caretPosition)
    });
  }

  private insertSuggestion(suggestion: CompletionItem) {
    const replacement = replaceActiveToken(this.state.query, this.state.caretPosition, suggestion.insert);

    this.setState({
      query: replacement.query,
      caretPosition: replacement.caret,
      error: null,
      hints: analyzeSuiteQL(replacement.query),
      suggestions: getCompletions(replacement.query, replacement.caret)
    });
  }

  private insertSuiteQLFromChat(query: string) {
    const nextQuery = query.trim();

    this.setEditorQuery(nextQuery);
  }

  private async mergeSuiteQLFromChat(query: string) {
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
      this.basicMergeSuiteQLFromChat(
        query,
        'AI is not available to merge the query. Basic merge was applied instead.'
      );
      this.setState({
        recordChatMessages: outcome.messages,
        recordChatMerging: false
      });
      this.saveActiveRecordChat(outcome.messages);
      return;
    }

    this.setEditorQuery(mergedQuery);
    this.setState({
      recordChatError: null,
      recordChatMessages: outcome.messages,
      recordChatMerging: false
    });
    this.saveActiveRecordChat(outcome.messages);
  }

  private basicMergeSuiteQLFromChat(query: string, warning: string | null) {
    const nextQuery = basicMergeQueries(this.state.query, query);

    this.setEditorQuery(nextQuery);

    if (warning) {
      this.setState({
        recordChatError: warning
      });
    }
  }

  private setEditorQuery(query: string) {
    this.setState({
      query,
      caretPosition: query.length,
      error: null,
      hints: analyzeSuiteQL(query),
      suggestions: getCompletions(query, query.length)
    });
  }

  private async runQuery() {
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

  private async askRecordChat() {
    this.setState({
      recordChatRunning: true,
      recordChatError: null
    });

    const outcome = await this.recordChat.ask(
      this.state.recordChatDraft,
      this.state.recordChatMessages,
      this.state.query
    );

    this.setState({
      recordChatDraft: outcome.error ? this.state.recordChatDraft : '',
      recordChatError: outcome.error,
      recordChatMessages: outcome.messages,
      recordChatRunning: false
    });
    this.saveActiveRecordChat(outcome.messages);
  }

  private toggleRecordChat() {
    this.setState({
      recordChatVisible: !this.state.recordChatVisible
    });
  }

  private closeRecordChat() {
    this.setState({
      recordChatVisible: false
    });
  }

  private clearRecordChat() {
    this.setRecordChatMessages(initialRecordChatMessages(), {
      recordChatDraft: '',
      recordChatError: null
    });
  }

  private toggleRecordChatHistory() {
    this.setState({
      recordChatHistoryVisible: !this.state.recordChatHistoryVisible
    });
  }

  private createNewRecordChat() {
    const entry = createRecordChatHistoryEntry(initialRecordChatMessages());
    const history = [entry, ...this.state.recordChatHistory];

    this.saveRecordChatHistory(history);
    this.setState({
      activeRecordChatId: entry.id,
      recordChatDraft: '',
      recordChatError: null,
      recordChatHistory: history,
      recordChatMessages: entry.messages
    });
  }

  private loadRecordChat(id: string) {
    const entry = this.state.recordChatHistory.find((item) => item.id === id);

    if (!entry) {
      return;
    }

    this.setState({
      activeRecordChatId: entry.id,
      recordChatDraft: '',
      recordChatError: null,
      recordChatMessages: entry.messages
    });
  }

  private deleteRecordChat(id: string) {
    const history = this.state.recordChatHistory.filter((entry) => entry.id !== id);
    const nextActive = id === this.state.activeRecordChatId ? history[0] || createRecordChatHistoryEntry(initialRecordChatMessages()) : null;
    const nextHistory = history.length > 0 ? history : [nextActive as RecordChatHistoryEntry];

    this.saveRecordChatHistory(nextHistory);

    if (nextActive) {
      this.setState({
        activeRecordChatId: nextActive.id,
        recordChatDraft: '',
        recordChatError: null,
        recordChatHistory: nextHistory,
        recordChatMessages: nextActive.messages
      });
      return;
    }

    this.setState({
      recordChatHistory: nextHistory
    });
  }

  private clearRecordChatHistory() {
    const entry = createRecordChatHistoryEntry(initialRecordChatMessages());

    this.saveRecordChatHistory([entry]);
    this.setState({
      activeRecordChatId: entry.id,
      recordChatDraft: '',
      recordChatError: null,
      recordChatHistory: [entry],
      recordChatMessages: entry.messages
    });
  }

  private setRecordChatMessages(messages: RecordChatMessage[], extraState: Partial<RunnerState> = {}) {
    const history = updateRecordChatHistory(this.state.recordChatHistory, this.state.activeRecordChatId, messages);

    this.saveRecordChatHistory(history);
    this.setState({
      ...extraState,
      recordChatHistory: history,
      recordChatMessages: messages
    } as RunnerState);
  }

  private saveActiveRecordChat(messages: RecordChatMessage[]) {
    const history = updateRecordChatHistory(this.state.recordChatHistory, this.state.activeRecordChatId, messages);

    this.saveRecordChatHistory(history);
    this.setState({
      recordChatHistory: history
    });
  }

  private loadWorkingQuery() {
    try {
      return window.localStorage.getItem(WORKING_QUERY_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  }

  private loadRecordChatHistory(): RecordChatHistoryEntry[] {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(RECORD_CHAT_HISTORY_STORAGE_KEY) || '[]');

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .filter((entry) => entry && typeof entry.id === 'string' && Array.isArray(entry.messages))
        .map((entry) => ({
          id: entry.id,
          title: String(entry.title || titleRecordChat(entry.messages)),
          updatedAt: Number(entry.updatedAt || Date.now()),
          messages: normalizeRecordChatMessages(entry.messages)
        }))
        .slice(0, 20);
    } catch {
      return [];
    }
  }

  private saveRecordChatHistory(history: RecordChatHistoryEntry[]) {
    try {
      window.localStorage.setItem(RECORD_CHAT_HISTORY_STORAGE_KEY, JSON.stringify(history.slice(0, 20)));
    } catch {
      // Chat history persistence is best-effort; browser or account policy can block storage.
    }
  }

  private saveWorkingQuery(query: string) {
    try {
      window.localStorage.setItem(WORKING_QUERY_STORAGE_KEY, query);
    } catch {
      // Query persistence is best-effort; private browsing or account policy can block storage.
    }
  }
}

function buildMergePrompt(query: string) {
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

function getLastAssistantMessage(messages: RecordChatMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].role === 'assistant') {
      return messages[index].text;
    }
  }

  return '';
}

function extractSuiteQLFromText(text: string) {
  const codePattern = /```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g;
  let match: RegExpExecArray | null;

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

function isSuiteQLText(language: string, content: string) {
  if (language === 'sql' || language === 'suiteql') {
    return true;
  }

  return /^(SELECT|WITH)\b/i.test(content);
}

function basicMergeQueries(currentQuery: string, incomingQuery: string) {
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

function initialRecordChatMessages(): RecordChatMessage[] {
  return [
    {
      role: 'assistant',
      text: 'Ask about NetSuite reports, searches, record types, field IDs, joins, table relationships, and SuiteQL patterns.'
    }
  ];
}

function createRecordChatHistoryEntry(messages: RecordChatMessage[]): RecordChatHistoryEntry {
  return {
    id: `chat-${Date.now()}-${Math.round(Math.random() * 100000)}`,
    title: titleRecordChat(messages),
    updatedAt: Date.now(),
    messages
  };
}

function updateRecordChatHistory(
  history: RecordChatHistoryEntry[],
  activeId: string,
  messages: RecordChatMessage[]
): RecordChatHistoryEntry[] {
  const updatedEntry = {
    id: activeId,
    title: titleRecordChat(messages),
    updatedAt: Date.now(),
    messages
  };
  const updatedHistory = [updatedEntry, ...history.filter((entry) => entry.id !== activeId)];

  return updatedHistory.slice(0, 20);
}

function normalizeRecordChatMessages(messages: RecordChatMessage[]): RecordChatMessage[] {
  const normalized = messages
    .filter((message) => message && (message.role === 'user' || message.role === 'assistant'))
    .map((message) => ({
      role: message.role,
      text: String(message.text || '')
    }))
    .filter((message) => message.text.trim().length > 0);

  return normalized.length > 0 ? normalized : initialRecordChatMessages();
}

function titleRecordChat(messages: RecordChatMessage[]) {
  const userMessage = messages.find((message) => message.role === 'user' && message.text.trim().length > 0);
  const text = (userMessage ? userMessage.text : 'New chat').replace(/\s+/g, ' ').trim();

  return text.length > 48 ? `${text.slice(0, 45)}...` : text;
}

function formatHistoryDate(value: number) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleString();
}
