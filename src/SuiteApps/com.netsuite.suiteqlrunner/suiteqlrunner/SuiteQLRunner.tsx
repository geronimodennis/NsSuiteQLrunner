import {ApplicationHeader, ContentPanel, GridPanel, ScrollPanel, StackPanel, ThemeSelector} from '@uif-js/component';
import {PureComponent, SystemIcon, Theme} from '@uif-js/core';
import {getCompletions} from './application/CompletionService';
import {QueryRunnerService} from './application/QueryRunnerService';
import {RecordChatService} from './application/RecordChatService';
import {analyzeSuiteQL} from './application/SuiteQLAnalyzer';
import {formatSuiteQL} from './application/SuiteQLFormatter';
import {CompletionItem, QueryExecutionMeta, QueryExecutionMode, QueryHint, RecordChatMessage} from './domain/models';
import {replaceActiveToken} from './domain/queryText';
import {DEFAULT_MAX_PAGES, DEFAULT_PAGE_SIZE, SAMPLE_QUERY} from './domain/suiteqlCatalog';
import {NetSuiteRestletQueryGateway} from './infrastructure/NetSuiteRestletQueryGateway';
import {AutocompletePanel} from './presentation/AutocompletePanel';
import {PerformanceMatrixPanel} from './presentation/PerformanceMatrixPanel';
import {QueryEditor} from './presentation/QueryEditor';
import {QueryHintsPanel} from './presentation/QueryHintsPanel';
import {RecordChatPanel} from './presentation/RecordChatPanel';
import {ResultsPanel} from './presentation/ResultsPanel';

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
    this.state = {
      query: SAMPLE_QUERY,
      hints: analyzeSuiteQL(SAMPLE_QUERY),
      suggestions: getCompletions(SAMPLE_QUERY, SAMPLE_QUERY.length),
      resultRows: [],
      resultColumns: [],
      error: null,
      executionMode: 'RUN_SUITEQL_PAGED',
      running: false,
      maxPages: String(DEFAULT_MAX_PAGES),
      pageSize: String(DEFAULT_PAGE_SIZE),
      caretPosition: SAMPLE_QUERY.length,
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
        <ApplicationHeader
          icon={SystemIcon.SEARCH}
          title={'SuiteQL Runner'}
          subtitle={'Format, inspect, execute, and measure SuiteQL'}
        />
      </StackPanel.Item>,
      <StackPanel.Item key={'main'} grow={1}>
        <ScrollPanel orientation={ScrollPanel.Orientation.VERTICAL}>
          <ContentPanel outerGap={ContentPanel.GapSize.LARGE}>
            <StackPanel.Vertical itemGap={StackPanel.GapSize.LARGE}>
              <StackPanel.Item>
                <QueryEditor
                  maxPages={this.state.maxPages}
                  pageSize={this.state.pageSize}
                  query={this.state.query}
                  runAsSuiteQLPaged={this.state.executionMode === 'RUN_SUITEQL_PAGED'}
                  running={this.state.running}
                  onAnalyze={() => this.analyzeQuery()}
                  onFormat={() => this.formatQuery()}
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
                <PerformanceMatrixPanel performance={this.state.performance} />
              </StackPanel.Item>
              <StackPanel.Item>{this.renderAnalysisAndSuggestions()}</StackPanel.Item>
            </StackPanel.Vertical>
          </ContentPanel>
        </ScrollPanel>
      </StackPanel.Item>
    ];

    if (this.state.recordChatVisible) {
      items.push(
        <StackPanel.Item key={'record-chat'} shrink={0} basis={'0px'}>
          <RecordChatPanel
            draft={this.state.recordChatDraft}
            error={this.state.recordChatError}
            messages={this.state.recordChatMessages}
            running={this.state.recordChatRunning}
            rootStyle={{
              position: 'fixed',
              right: '32px',
              top: '84px',
              width: '440px',
              maxHeight: 'calc(100vh - 108px)',
              overflowY: 'auto',
              zIndex: '1000',
              boxShadow: '0 18px 48px rgba(15, 23, 42, 0.24)'
            }}
            onAsk={() => this.askRecordChat()}
            onClear={() => this.clearRecordChat()}
            onDraftChanged={(recordChatDraft) => this.setState({recordChatDraft})}
          />
        </StackPanel.Item>
      );
    }

    return items;
  }

  private renderAnalysisAndSuggestions() {
    return (
      <div style={{width: '100%'}}>
        <GridPanel columns={['2fr', '1fr']} gap={GridPanel.GapSize.LARGE}>
          <GridPanel.Item rowIndex={0} columnIndex={0}>
            <QueryHintsPanel hints={this.state.hints} />
          </GridPanel.Item>
          <GridPanel.Item rowIndex={0} columnIndex={1}>
            <AutocompletePanel suggestions={this.state.suggestions} onInsert={(suggestion) => this.insertSuggestion(suggestion)} />
          </GridPanel.Item>
        </GridPanel>
      </div>
    );
  }

  private onQueryChanged(query: string, caretPosition: number) {
    this.setState({
      query,
      caretPosition,
      hints: analyzeSuiteQL(query),
      suggestions: getCompletions(query, caretPosition)
    });
  }

  private formatQuery() {
    const formatted = formatSuiteQL(this.state.query);

    this.setState({
      query: formatted,
      hints: analyzeSuiteQL(formatted),
      suggestions: getCompletions(formatted, formatted.length),
      caretPosition: formatted.length
    });
  }

  private analyzeQuery() {
    this.setState({
      hints: analyzeSuiteQL(this.state.query),
      suggestions: getCompletions(this.state.query, this.state.caretPosition)
    });
  }

  private insertSuggestion(suggestion: CompletionItem) {
    const replacement = replaceActiveToken(this.state.query, this.state.caretPosition, suggestion.insert);

    this.setState({
      query: replacement.query,
      caretPosition: replacement.caret,
      hints: analyzeSuiteQL(replacement.query),
      suggestions: getCompletions(replacement.query, replacement.caret)
    });
  }

  private async runQuery() {
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

    const outcome = await this.recordChat.ask(this.state.recordChatDraft, this.state.recordChatMessages);

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

  private clearRecordChat() {
    this.setState({
      recordChatDraft: '',
      recordChatError: null,
      recordChatMessages: []
    });
  }
}
