import {ApplicationHeader, ContentPanel, ScrollPanel, StackPanel, ThemeSelector} from '@uif-js/component';
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
  recordChatMessages: RecordChatMessage[];
  recordChatRunning: boolean;
  recordChatVisible: boolean;
}

export default class SuiteQLRunner extends PureComponent<Record<string, never>, RunnerState> {
  private readonly restletGateway = new NetSuiteRestletQueryGateway();
  private readonly queryRunner = new QueryRunnerService(this.restletGateway);
  private readonly recordChat = new RecordChatService(this.restletGateway);

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
      recordChatMessages: [
        {
          role: 'assistant',
          text: 'Ask about NetSuite reports, searches, record types, field IDs, joins, table relationships, and SuiteQL patterns.'
        }
      ],
      recordChatRunning: false,
      recordChatVisible: false
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
            />
          </div>
        </StackPanel.Item>
      );
    }

    return items;
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

  private mergeSuiteQLFromChat(query: string) {
    const currentQuery = this.state.query.trim();
    const incomingQuery = query.trim();
    const nextQuery = currentQuery ? `${currentQuery}\n\n${incomingQuery}` : incomingQuery;

    this.setEditorQuery(nextQuery);
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
    this.setState({
      recordChatDraft: '',
      recordChatError: null,
      recordChatMessages: []
    });
  }

  private loadWorkingQuery() {
    try {
      return window.localStorage.getItem(WORKING_QUERY_STORAGE_KEY) || '';
    } catch {
      return '';
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
