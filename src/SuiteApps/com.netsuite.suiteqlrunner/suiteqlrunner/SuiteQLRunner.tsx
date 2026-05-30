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
import {QueryEditor, QueryHistoryItem} from './presentation/QueryEditor';
import {QueryDiagnosticsPanel} from './presentation/QueryDiagnosticsPanel';
import {RecordChatPanel} from './presentation/RecordChatPanel';
import {ResultsPanel} from './presentation/ResultsPanel';

const WORKING_QUERY_STORAGE_KEY = 'suiteqlrunner.workingQuery';
const QUERY_HISTORY_STORAGE_KEY = 'suiteqlrunner.queryHistory';
const RECORD_CHAT_HISTORY_STORAGE_KEY = 'suiteqlrunner.recordChatHistory';

interface QueryEditorTab {
  id: string;
  title: string;
  query: string;
  hints: QueryHint[];
  suggestions: CompletionItem[];
  resultRows: Record<string, unknown>[];
  resultColumns: string[];
  error: string | null;
  caretPosition: number;
  performance: QueryExecutionMeta;
}

interface RecordChatHistoryEntry {
  id: string;
  title: string;
  updatedAt: number;
  messages: RecordChatMessage[];
}

interface RunnerState {
  query: string;
  queryHistory: QueryHistoryItem[];
  queryHistoryVisible: boolean;
  queryTabs: QueryEditorTab[];
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
  activeQueryTabId: string;
}

export default class SuiteQLRunner extends PureComponent<Record<string, never>, RunnerState> {
  private readonly restletGateway = new NetSuiteRestletQueryGateway();
  private readonly queryRunner = new QueryRunnerService(this.restletGateway);
  private readonly recordChat = new RecordChatService(this.restletGateway);

  constructor(props, context) {
    super(props, context);
    const workingQuery = this.loadWorkingQuery();
    const initialTab = createQueryEditorTab(workingQuery, 'Query 1');
    const chatHistory = this.loadRecordChatHistory();
    const activeChat = chatHistory[0] || createRecordChatHistoryEntry(initialRecordChatMessages());

    this.state = {
      query: workingQuery,
      queryHistory: this.loadQueryHistory(),
      queryHistoryVisible: false,
      queryTabs: [initialTab],
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
      useAiQueryMerge: true,
      activeQueryTabId: initialTab.id
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
                {this.renderQueryTabs()}
              </StackPanel.Item>
              <StackPanel.Item>
                <QueryEditor
                  executionError={this.state.error}
                  hints={this.state.hints}
                  historyItems={this.state.queryHistory}
                  historyVisible={this.state.queryHistoryVisible}
                  maxPages={this.state.maxPages}
                  pageSize={this.state.pageSize}
                  query={this.state.query}
                  runAsSuiteQLPaged={this.state.executionMode === 'RUN_SUITEQL_PAGED'}
                  running={this.state.running}
                  suggestions={this.state.suggestions}
                  onAnalyze={() => this.analyzeQuery()}
                  onClearHistory={() => this.clearQueryHistory()}
                  onDeleteHistoryItem={(id) => this.deleteQueryHistoryItem(id)}
                  onFormat={() => this.formatQuery()}
                  onInsertSuggestion={(suggestion) => this.insertSuggestion(suggestion)}
                  onLoadHistoryItem={(id) => this.loadQueryHistoryItem(id)}
                  onMaxPagesChanged={(maxPages) => this.setState({maxPages})}
                  onPageSizeChanged={(pageSize) => this.setState({pageSize})}
                  onQueryChanged={(query, caretPosition) => this.onQueryChanged(query, caretPosition)}
                  onRunAsSuiteQLPagedChanged={(runAsSuiteQLPaged) =>
                    this.setState({executionMode: runAsSuiteQLPaged ? 'RUN_SUITEQL_PAGED' : 'RUN_SUITEQL'})
                  }
                  onRun={() => this.runQuery()}
                  onToggleHistory={() => this.toggleQueryHistory()}
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

  private renderQueryTabs() {
    const tabItems = this.state.queryTabs.map((tab) => (
      <StackPanel.Item key={tab.id} shrink={0}>
        <Button
          label={`<> ${tab.title}`}
          type={tab.id === this.state.activeQueryTabId ? Button.Type.PRIMARY : Button.Type.DEFAULT}
          action={() => this.activateQueryTab(tab.id)}
        />
      </StackPanel.Item>
    ));

    return (
      <StackPanel wrap={true} itemGap={StackPanel.GapSize.SMALL} wrapGap={StackPanel.GapSize.SMALL}>
        {tabItems}
        <StackPanel.Item shrink={0}>
          <Button label={'New Tab'} action={() => this.createQueryTab()} />
        </StackPanel.Item>
        <StackPanel.Item shrink={0}>
          <Button label={'Close Tab'} action={() => this.closeActiveQueryTab()} />
        </StackPanel.Item>
      </StackPanel>
    );
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
      <div style={{position: 'relative'}}>
        <div style={{position: 'absolute', right: '16px', top: '12px', zIndex: '1'}}>
          <Button label={'Close'} action={() => this.toggleRecordChatHistory()} />
        </div>
        <Portlet title={'AI Chat History'} icon={SystemIcon.LIST}>
        <StackPanel.Vertical itemGap={StackPanel.GapSize.MEDIUM}>
          <StackPanel.Item>
            <StackPanel itemGap={StackPanel.GapSize.SMALL}>
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
      </div>
    );
  }

  private onQueryChanged(query: string, caretPosition: number) {
    this.setState({
      query,
      caretPosition,
      error: null,
      hints: analyzeSuiteQL(query),
      suggestions: getCompletions(query, caretPosition),
      queryTabs: updateActiveQueryTab(this.state.queryTabs, this.state.activeQueryTabId, {
        query,
        caretPosition,
        error: null,
        hints: analyzeSuiteQL(query),
        suggestions: getCompletions(query, caretPosition)
      })
    });
  }

  private formatQuery() {
    this.addQueryHistory(this.state.query, 'Before format');
    const formatted = formatSuiteQL(this.state.query);
    this.saveWorkingQuery(formatted);

    this.setState({
      query: formatted,
      error: null,
      hints: analyzeSuiteQL(formatted),
      suggestions: getCompletions(formatted, formatted.length),
      caretPosition: formatted.length,
      queryTabs: updateActiveQueryTab(this.state.queryTabs, this.state.activeQueryTabId, {
        query: formatted,
        error: null,
        hints: analyzeSuiteQL(formatted),
        suggestions: getCompletions(formatted, formatted.length),
        caretPosition: formatted.length
      })
    });
  }

  private analyzeQuery() {
    this.saveWorkingQuery(this.state.query);
    this.addQueryHistory(this.state.query, 'Analyze checkpoint');

    this.setState({
      error: null,
      hints: analyzeSuiteQL(this.state.query),
      suggestions: getCompletions(this.state.query, this.state.caretPosition),
      queryTabs: updateActiveQueryTab(this.state.queryTabs, this.state.activeQueryTabId, {
        error: null,
        hints: analyzeSuiteQL(this.state.query),
        suggestions: getCompletions(this.state.query, this.state.caretPosition)
      })
    });
  }

  private insertSuggestion(suggestion: CompletionItem) {
    this.addQueryHistory(this.state.query, 'Before autocomplete insert');
    const replacement = replaceActiveToken(this.state.query, this.state.caretPosition, suggestion.insert);

    this.setState({
      query: replacement.query,
      caretPosition: replacement.caret,
      error: null,
      hints: analyzeSuiteQL(replacement.query),
      suggestions: getCompletions(replacement.query, replacement.caret),
      queryTabs: updateActiveQueryTab(this.state.queryTabs, this.state.activeQueryTabId, {
        query: replacement.query,
        caretPosition: replacement.caret,
        error: null,
        hints: analyzeSuiteQL(replacement.query),
        suggestions: getCompletions(replacement.query, replacement.caret)
      })
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
    this.addQueryHistory(this.state.query, 'Before editor replace');
    this.setState({
      query,
      caretPosition: query.length,
      error: null,
      hints: analyzeSuiteQL(query),
      suggestions: getCompletions(query, query.length),
      queryTabs: updateActiveQueryTab(this.state.queryTabs, this.state.activeQueryTabId, {
        query,
        caretPosition: query.length,
        error: null,
        hints: analyzeSuiteQL(query),
        suggestions: getCompletions(query, query.length)
      })
    });
  }

  private async runQuery() {
    this.saveWorkingQuery(this.state.query);
    this.addQueryHistory(this.state.query, 'Run checkpoint');

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
      performance: outcome.performance,
      queryTabs: updateActiveQueryTab(this.state.queryTabs, this.state.activeQueryTabId, {
        hints: outcome.hints,
        error: outcome.error,
        resultRows: outcome.resultRows,
        resultColumns: outcome.resultColumns,
        performance: outcome.performance
      })
    });
  }

  private activateQueryTab(id: string) {
    const tab = this.state.queryTabs.find((item) => item.id === id);

    if (!tab) {
      return;
    }

    this.setState({
      activeQueryTabId: tab.id,
      query: tab.query,
      hints: tab.hints,
      suggestions: tab.suggestions,
      resultRows: tab.resultRows,
      resultColumns: tab.resultColumns,
      error: tab.error,
      caretPosition: tab.caretPosition,
      performance: tab.performance
    });
  }

  private createQueryTab() {
    const tab = createQueryEditorTab('', `Query ${this.state.queryTabs.length + 1}`);
    const queryTabs = [...this.state.queryTabs, tab];

    this.setState({
      activeQueryTabId: tab.id,
      queryTabs,
      query: tab.query,
      hints: tab.hints,
      suggestions: tab.suggestions,
      resultRows: tab.resultRows,
      resultColumns: tab.resultColumns,
      error: tab.error,
      caretPosition: tab.caretPosition,
      performance: tab.performance
    });
  }

  private closeActiveQueryTab() {
    if (this.state.queryTabs.length === 1) {
      const tab = createQueryEditorTab('', 'Query 1');

      this.setState({
        activeQueryTabId: tab.id,
        queryTabs: [tab],
        query: tab.query,
        hints: tab.hints,
        suggestions: tab.suggestions,
        resultRows: tab.resultRows,
        resultColumns: tab.resultColumns,
        error: tab.error,
        caretPosition: tab.caretPosition,
        performance: tab.performance
      });
      return;
    }

    const remainingTabs = this.state.queryTabs.filter((tab) => tab.id !== this.state.activeQueryTabId);
    const nextTabs = remainingTabs.length > 0 ? remainingTabs : [createQueryEditorTab('', 'Query 1')];
    const nextTab = nextTabs[0];

    this.setState({
      activeQueryTabId: nextTab.id,
      queryTabs: nextTabs,
      query: nextTab.query,
      hints: nextTab.hints,
      suggestions: nextTab.suggestions,
      resultRows: nextTab.resultRows,
      resultColumns: nextTab.resultColumns,
      error: nextTab.error,
      caretPosition: nextTab.caretPosition,
      performance: nextTab.performance
    });
  }

  private toggleQueryHistory() {
    this.setState({
      queryHistoryVisible: !this.state.queryHistoryVisible
    });
  }

  private loadQueryHistoryItem(id: string) {
    const item = this.state.queryHistory.find((historyItem) => historyItem.id === id);

    if (!item) {
      return;
    }

    this.setEditorQuery(item.query);
  }

  private deleteQueryHistoryItem(id: string) {
    const queryHistory = this.state.queryHistory.filter((item) => item.id !== id);

    this.saveQueryHistory(queryHistory);
    this.setState({queryHistory});
  }

  private clearQueryHistory() {
    this.saveQueryHistory([]);
    this.setState({queryHistory: []});
  }

  private addQueryHistory(query: string, reason: string) {
    const normalizedQuery = String(query || '').trim();

    if (!normalizedQuery) {
      return;
    }

    if (this.state.queryHistory[0] && this.state.queryHistory[0].query === normalizedQuery) {
      return;
    }

    const queryHistory = [
      {
        id: `query-history-${Date.now()}-${Math.round(Math.random() * 100000)}`,
        title: `${reason}: ${titleQuery(normalizedQuery)}`,
        query: normalizedQuery,
        updatedAt: Date.now()
      },
      ...this.state.queryHistory
    ].slice(0, 30);

    this.saveQueryHistory(queryHistory);
    this.setState({queryHistory});
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

  private loadQueryHistory(): QueryHistoryItem[] {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(QUERY_HISTORY_STORAGE_KEY) || '[]');

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .filter((item) => item && typeof item.id === 'string' && typeof item.query === 'string')
        .map((item) => ({
          id: item.id,
          title: String(item.title || titleQuery(item.query)),
          query: String(item.query || ''),
          updatedAt: Number(item.updatedAt || Date.now())
        }))
        .slice(0, 30);
    } catch {
      return [];
    }
  }

  private saveQueryHistory(history: QueryHistoryItem[]) {
    try {
      window.localStorage.setItem(QUERY_HISTORY_STORAGE_KEY, JSON.stringify(history.slice(0, 30)));
    } catch {
      // Query history persistence is best-effort; browser or account policy can block storage.
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

function createQueryEditorTab(query: string, title: string): QueryEditorTab {
  return {
    id: `query-tab-${Date.now()}-${Math.round(Math.random() * 100000)}`,
    title,
    query,
    hints: analyzeSuiteQL(query),
    suggestions: getCompletions(query, query.length),
    resultRows: [],
    resultColumns: [],
    error: null,
    caretPosition: query.length,
    performance: {}
  };
}

function updateActiveQueryTab(
  tabs: QueryEditorTab[],
  activeId: string,
  patch: Partial<QueryEditorTab>
): QueryEditorTab[] {
  return tabs.map((tab) => (tab.id === activeId ? {...tab, ...patch} : tab));
}

function titleQuery(query: string) {
  const compact = String(query || '').replace(/\s+/g, ' ').trim();

  if (!compact) {
    return 'Empty query';
  }

  return compact.length > 48 ? `${compact.slice(0, 45)}...` : compact;
}
