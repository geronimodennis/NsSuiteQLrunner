import {ApplicationHeader, Button, ContentPanel, Portlet, ScrollPanel, StackPanel, Text, TextBox, ThemeSelector} from '@uif-js/component';
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
const QUERY_TABS_STORAGE_KEY = 'suiteqlrunner.queryTabs';
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

interface QueryTabWorkspace {
  activeQueryTabId: string;
  tabs: QueryEditorTab[];
}

interface RunnerState {
  query: string;
  queryHistory: QueryHistoryItem[];
  queryHistoryVisible: boolean;
  queryTabs: QueryEditorTab[];
  editingQueryTabId: string | null;
  editingQueryTabTitle: string;
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
    const queryWorkspace = this.loadQueryTabWorkspace(workingQuery);
    const initialTab = queryWorkspace.tabs.find((tab) => tab.id === queryWorkspace.activeQueryTabId) || queryWorkspace.tabs[0];
    const chatHistory = this.loadRecordChatHistory();
    const activeChat = chatHistory[0] || createRecordChatHistoryEntry(initialRecordChatMessages());

    this.state = {
      query: initialTab.query,
      queryHistory: this.loadQueryHistory(),
      queryHistoryVisible: false,
      queryTabs: queryWorkspace.tabs,
      editingQueryTabId: null,
      editingQueryTabTitle: '',
      hints: initialTab.hints,
      suggestions: initialTab.suggestions,
      resultRows: [],
      resultColumns: [],
      error: null,
      executionMode: 'RUN_SUITEQL_PAGED',
      running: false,
      maxPages: String(DEFAULT_MAX_PAGES),
      pageSize: String(DEFAULT_PAGE_SIZE),
      caretPosition: initialTab.caretPosition,
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
          <style>
            {`
              .nsqlr-tab-icon-button button,
              .nsqlr-tab-icon-button [role='button'] {
                background: transparent !important;
                border-color: transparent !important;
                box-shadow: none !important;
              }

              .nsqlr-tab-hover-action {
                display: none;
              }

              .nsqlr-query-tab:hover .nsqlr-tab-hover-action {
                display: inline-flex;
              }

              .nsqlr-add-tab-button {
                align-items: center;
                display: inline-flex;
                height: 30px;
                justify-content: center;
                width: 30px;
              }

              .nsqlr-add-tab-button button,
              .nsqlr-add-tab-button [role='button'] {
                align-items: center !important;
                display: inline-flex !important;
                justify-content: center !important;
                min-width: 30px !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
              }
            `}
          </style>
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
          <div style={{padding: '0 20px 12px'}}>
            {this.renderQueryTabs()}
          </div>
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
    const tabItems = [
      ...this.state.queryTabs.map((tab) => (
        <StackPanel.Item key={tab.id} shrink={0}>
          {this.renderQueryTab(tab)}
        </StackPanel.Item>
      )),
      <StackPanel.Item key={'new-tab'} shrink={0}>
        <div className={'nsqlr-add-tab-button'} title={'New Tab'}>
          <Button label={null} icon={SystemIcon.ADD} action={() => this.createQueryTab()} />
        </div>
      </StackPanel.Item>,
    ];

    return (
      <StackPanel wrap={true} itemGap={StackPanel.GapSize.SMALL} wrapGap={StackPanel.GapSize.SMALL}>
        {tabItems}
      </StackPanel>
    );
  }

  private renderQueryTab(tab: QueryEditorTab) {
    const active = tab.id === this.state.activeQueryTabId;
    const editing = tab.id === this.state.editingQueryTabId;
    const title = getTabDisplayTitle(tab.title);
    const tabStyle = {
      alignItems: 'center',
      background: active ? '#607799' : '#eef2f7',
      border: active ? '1px solid #526a8d' : '1px solid #cbd5e1',
      borderRadius: '4px 4px 0 0',
      color: active ? '#ffffff' : '#26364d',
      display: 'inline-flex',
      gap: '6px',
      maxWidth: editing ? '340px' : '220px',
      padding: '5px 7px'
    };

    if (editing) {
      return (
        <div
          className={'nsqlr-query-tab'}
          style={tabStyle}
        >
          <TextBox
            text={this.state.editingQueryTabTitle}
            placeholder={'Tab name'}
            onTextChanged={({text}) => this.setState({editingQueryTabTitle: text})}
            onTextAccepted={() => this.applyQueryTabRename(tab.id)}
            rootStyle={{width: '190px'}}
          />
          <div className={'nsqlr-tab-icon-button'} title={'Apply tab name'}>
            <Button
              label={null}
              icon={SystemIcon.CHECK}
              type={Button.Type.PURE}
              action={() => this.applyQueryTabRename(tab.id)}
            />
          </div>
        </div>
      );
    }

    return (
      <div
        className={'nsqlr-query-tab'}
        style={tabStyle}
      >
        <button
          type={'button'}
          title={`Open ${title}`}
          onClick={() => this.activateQueryTab(tab.id)}
          style={{
            background: 'transparent',
            border: '0',
            color: 'inherit',
            cursor: 'pointer',
            font: 'inherit',
            maxWidth: '145px',
            overflow: 'hidden',
            padding: '0',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {title}
        </button>
        <button
          className={'nsqlr-tab-hover-action'}
          type={'button'}
          aria-label={`Edit ${title}`}
          title={`Edit ${title}`}
          onClick={() => this.startQueryTabRename(tab.id)}
          style={createTransparentTabButtonStyle()}
        >
          &#9998;
        </button>
        <button
          className={'nsqlr-tab-hover-action'}
          type={'button'}
          aria-label={`Close ${title}`}
          title={`Close ${title}`}
          onClick={() => this.closeQueryTab(tab.id)}
          style={createTransparentTabButtonStyle()}
        >
          X
        </button>
      </div>
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
    const chatHistoryItems = historyItems.length > 0 ? historyItems : [
      <StackPanel.Item key={'empty-chat-history'}>
        <Text color={Text.Color.SECONDARY}>No chat history yet.</Text>
      </StackPanel.Item>
    ];

    return (
      <div style={{position: 'relative'}}>
        <div style={{position: 'absolute', right: '16px', top: '12px', zIndex: '1'}}>
          <div title={'Close'}>
            <Button label={null} icon={SystemIcon.CLOSE} action={() => this.toggleRecordChatHistory()} />
          </div>
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
                {chatHistoryItems}
              </StackPanel.Vertical>
            </ScrollPanel>
          </StackPanel.Item>
        </StackPanel.Vertical>
        </Portlet>
      </div>
    );
  }

  private onQueryChanged(query: string, caretPosition: number) {
    const hints = analyzeSuiteQL(query);
    const suggestions = getCompletions(query, caretPosition);
    const queryTabs = updateActiveQueryTab(this.state.queryTabs, this.state.activeQueryTabId, {
      query,
      caretPosition,
      error: null,
      hints,
      suggestions
    });

    this.setState({
      query,
      caretPosition,
      error: null,
      hints,
      suggestions,
      queryTabs
    });
    this.saveQueryTabWorkspace(queryTabs, this.state.activeQueryTabId);
  }

  private formatQuery() {
    this.addQueryHistory(this.state.query, 'Before format');
    const formatted = formatSuiteQL(this.state.query);
    const hints = analyzeSuiteQL(formatted);
    const suggestions = getCompletions(formatted, formatted.length);
    const queryTabs = updateActiveQueryTab(this.state.queryTabs, this.state.activeQueryTabId, {
      query: formatted,
      error: null,
      hints,
      suggestions,
      caretPosition: formatted.length
    });

    this.saveWorkingQuery(formatted);

    this.setState({
      query: formatted,
      error: null,
      hints,
      suggestions,
      caretPosition: formatted.length,
      queryTabs
    });
    this.saveQueryTabWorkspace(queryTabs, this.state.activeQueryTabId);
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
    const hints = analyzeSuiteQL(replacement.query);
    const suggestions = getCompletions(replacement.query, replacement.caret);
    const queryTabs = updateActiveQueryTab(this.state.queryTabs, this.state.activeQueryTabId, {
      query: replacement.query,
      caretPosition: replacement.caret,
      error: null,
      hints,
      suggestions
    });

    this.setState({
      query: replacement.query,
      caretPosition: replacement.caret,
      error: null,
      hints,
      suggestions,
      queryTabs
    });
    this.saveQueryTabWorkspace(queryTabs, this.state.activeQueryTabId);
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
    const hints = analyzeSuiteQL(query);
    const suggestions = getCompletions(query, query.length);
    const queryTabs = updateActiveQueryTab(this.state.queryTabs, this.state.activeQueryTabId, {
      query,
      caretPosition: query.length,
      error: null,
      hints,
      suggestions
    });

    this.setState({
      query,
      caretPosition: query.length,
      error: null,
      hints,
      suggestions,
      queryTabs
    });
    this.saveQueryTabWorkspace(queryTabs, this.state.activeQueryTabId);
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
      editingQueryTabId: null,
      editingQueryTabTitle: '',
      query: tab.query,
      hints: tab.hints,
      suggestions: tab.suggestions,
      resultRows: tab.resultRows,
      resultColumns: tab.resultColumns,
      error: tab.error,
      caretPosition: tab.caretPosition,
      performance: tab.performance
    });
    this.saveQueryTabWorkspace(this.state.queryTabs, tab.id);
  }

  private startQueryTabRename(id: string) {
    const tab = this.state.queryTabs.find((item) => item.id === id);

    if (!tab) {
      return;
    }

    this.setState({
      editingQueryTabId: id,
      editingQueryTabTitle: tab.title
    });
  }

  private applyQueryTabRename(id: string) {
    const title = getTabDisplayTitle(this.state.editingQueryTabTitle);
    const queryTabs = this.state.queryTabs.map((tab) => (tab.id === id ? {...tab, title} : tab));

    this.setState({
      editingQueryTabId: null,
      editingQueryTabTitle: '',
      queryTabs
    });
    this.saveQueryTabWorkspace(queryTabs, this.state.activeQueryTabId);
  }

  private createQueryTab() {
    const tab = createQueryEditorTab('', `Query ${this.state.queryTabs.length + 1}`);
    const queryTabs = [...this.state.queryTabs, tab];

    this.setState({
      activeQueryTabId: tab.id,
      editingQueryTabId: null,
      editingQueryTabTitle: '',
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
    this.saveQueryTabWorkspace(queryTabs, tab.id);
  }

  private closeActiveQueryTab() {
    this.closeQueryTab(this.state.activeQueryTabId);
  }

  private closeQueryTab(id: string) {
    if (this.state.queryTabs.length === 1) {
      const tab = createQueryEditorTab('', 'Query 1');

      this.setState({
        activeQueryTabId: tab.id,
        editingQueryTabId: null,
        editingQueryTabTitle: '',
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
      this.saveQueryTabWorkspace([tab], tab.id);
      return;
    }

    const closingIndex = this.state.queryTabs.findIndex((tab) => tab.id === id);
    const remainingTabs = this.state.queryTabs.filter((tab) => tab.id !== id);
    const nextTabs = remainingTabs.length > 0 ? remainingTabs : [createQueryEditorTab('', 'Query 1')];
    const currentTab = this.state.queryTabs.find((tab) => tab.id === this.state.activeQueryTabId);
    const nextTab = id === this.state.activeQueryTabId
      ? nextTabs[Math.min(Math.max(closingIndex, 0), nextTabs.length - 1)]
      : currentTab || nextTabs[0];

    this.setState({
      activeQueryTabId: nextTab.id,
      editingQueryTabId: this.state.editingQueryTabId === id ? null : this.state.editingQueryTabId,
      editingQueryTabTitle: this.state.editingQueryTabId === id ? '' : this.state.editingQueryTabTitle,
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
    this.saveQueryTabWorkspace(nextTabs, nextTab.id);
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

  private loadQueryTabWorkspace(fallbackQuery: string): QueryTabWorkspace {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(QUERY_TABS_STORAGE_KEY) || 'null');

      if (!parsed || !Array.isArray(parsed.tabs)) {
        const tab = createQueryEditorTab(fallbackQuery, 'Query 1');

        return {activeQueryTabId: tab.id, tabs: [tab]};
      }

      const tabs = parsed.tabs
        .filter((tab) => tab && typeof tab.id === 'string')
        .map((tab, index) => {
          const query = String(tab.query || '');
          const title = getTabDisplayTitle(String(tab.title || `Query ${index + 1}`));
          const caretPosition = clampCaretPosition(Number(tab.caretPosition || query.length), query);
          const restoredTab = createQueryEditorTab(query, title, tab.id);

          return {
            ...restoredTab,
            caretPosition
          };
        })
        .slice(0, 12);

      if (tabs.length === 0) {
        const tab = createQueryEditorTab(fallbackQuery, 'Query 1');

        return {activeQueryTabId: tab.id, tabs: [tab]};
      }

      const activeQueryTabId = typeof parsed.activeQueryTabId === 'string' &&
        tabs.some((tab) => tab.id === parsed.activeQueryTabId)
        ? parsed.activeQueryTabId
        : tabs[0].id;

      return {activeQueryTabId, tabs};
    } catch {
      const tab = createQueryEditorTab(fallbackQuery, 'Query 1');

      return {activeQueryTabId: tab.id, tabs: [tab]};
    }
  }

  private saveQueryTabWorkspace(tabs: QueryEditorTab[], activeQueryTabId: string) {
    try {
      const payload = {
        activeQueryTabId,
        tabs: tabs.slice(0, 12).map((tab) => ({
          id: tab.id,
          title: getTabDisplayTitle(tab.title),
          query: tab.query,
          caretPosition: clampCaretPosition(tab.caretPosition, tab.query)
        }))
      };

      window.localStorage.setItem(QUERY_TABS_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Tab workspace persistence is best-effort; browser or account policy can block storage.
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

function createQueryEditorTab(query: string, title: string, id?: string): QueryEditorTab {
  return {
    id: id || `query-tab-${Date.now()}-${Math.round(Math.random() * 100000)}`,
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

function getTabDisplayTitle(title: string) {
  const text = String(title || '').replace(/\s+/g, ' ').trim();

  return text || 'Untitled Query';
}

function clampCaretPosition(value: number, query: string) {
  const max = String(query || '').length;

  if (!Number.isFinite(value)) {
    return max;
  }

  return Math.max(0, Math.min(Math.floor(value), max));
}

function createTransparentTabButtonStyle() {
  return {
    alignItems: 'center',
    background: 'transparent',
    border: '0',
    color: 'inherit',
    cursor: 'pointer',
    fontSize: '13px',
    height: '18px',
    justifyContent: 'center',
    lineHeight: '18px',
    padding: '0',
    textAlign: 'center',
    width: '18px'
  };
}

function titleQuery(query: string) {
  const compact = String(query || '').replace(/\s+/g, ' ').trim();

  if (!compact) {
    return 'Empty query';
  }

  return compact.length > 48 ? `${compact.slice(0, 45)}...` : compact;
}
