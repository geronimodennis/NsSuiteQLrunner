import {ApplicationHeader, ContentPanel, GridPanel, ScrollPanel, StackPanel, ThemeSelector} from '@uif-js/component';
import {PureComponent, SystemIcon, Theme} from '@uif-js/core';
import {getCompletions} from './application/CompletionService';
import {QueryRunnerService} from './application/QueryRunnerService';
import {analyzeSuiteQL} from './application/SuiteQLAnalyzer';
import {formatSuiteQL} from './application/SuiteQLFormatter';
import {CompletionItem, QueryExecutionMeta, QueryHint} from './domain/models';
import {replaceActiveToken} from './domain/queryText';
import {SAMPLE_QUERY} from './domain/suiteqlCatalog';
import {NetSuiteRestletQueryGateway} from './infrastructure/NetSuiteRestletQueryGateway';
import {AutocompletePanel} from './presentation/AutocompletePanel';
import {PerformanceMatrixPanel} from './presentation/PerformanceMatrixPanel';
import {QueryEditor} from './presentation/QueryEditor';
import {QueryHintsPanel} from './presentation/QueryHintsPanel';
import {ResultsPanel} from './presentation/ResultsPanel';

interface RunnerState {
  query: string;
  hints: QueryHint[];
  suggestions: CompletionItem[];
  resultRows: Record<string, unknown>[];
  resultColumns: string[];
  error: string | null;
  running: boolean;
  maxRows: string;
  caretPosition: number;
  performance: QueryExecutionMeta;
}

export default class SuiteQLRunner extends PureComponent<Record<string, never>, RunnerState> {
  private readonly queryRunner = new QueryRunnerService(new NetSuiteRestletQueryGateway());

  constructor(props, context) {
    super(props, context);
    this.state = {
      query: SAMPLE_QUERY,
      hints: analyzeSuiteQL(SAMPLE_QUERY),
      suggestions: getCompletions(SAMPLE_QUERY, SAMPLE_QUERY.length),
      resultRows: [],
      resultColumns: [],
      error: null,
      running: false,
      maxRows: '1000',
      caretPosition: SAMPLE_QUERY.length,
      performance: {}
    };
  }

  render() {
    return (
      <ThemeSelector supportedThemes={[Theme.Name.REDWOOD, Theme.Name.REFRESHED]}>
        <StackPanel.Vertical rootStyle={{height: '100%'}}>
          <StackPanel.Item shrink={0}>
            <ApplicationHeader
              icon={SystemIcon.SEARCH}
              title={'SuiteQL Runner'}
              subtitle={'Format, inspect, execute, and measure SuiteQL'}
              actions={[
                {
                  label: 'Run SuiteQL',
                  action: () => this.runQuery()
                },
                {
                  label: 'Format',
                  action: () => this.formatQuery()
                }
              ]}
            />
          </StackPanel.Item>
          <StackPanel.Item grow={1}>
            <ScrollPanel orientation={ScrollPanel.Orientation.VERTICAL}>
              <ContentPanel outerGap={ContentPanel.GapSize.LARGE}>
                <StackPanel.Vertical itemGap={StackPanel.GapSize.LARGE}>
                  <StackPanel.Item>
                    <QueryEditor
                      maxRows={this.state.maxRows}
                      query={this.state.query}
                      running={this.state.running}
                      onAnalyze={() => this.analyzeQuery()}
                      onFormat={() => this.formatQuery()}
                      onMaxRowsChanged={(maxRows) => this.setState({maxRows})}
                      onQueryChanged={(query, caretPosition) => this.onQueryChanged(query, caretPosition)}
                      onRun={() => this.runQuery()}
                    />
                  </StackPanel.Item>
                  <StackPanel.Item>{this.renderAnalysisAndSuggestions()}</StackPanel.Item>
                  <StackPanel.Item>
                    <PerformanceMatrixPanel performance={this.state.performance} />
                  </StackPanel.Item>
                  <StackPanel.Item>
                    <ResultsPanel
                      columns={this.state.resultColumns}
                      error={this.state.error}
                      rows={this.state.resultRows}
                    />
                  </StackPanel.Item>
                </StackPanel.Vertical>
              </ContentPanel>
            </ScrollPanel>
          </StackPanel.Item>
        </StackPanel.Vertical>
      </ThemeSelector>
    );
  }

  private renderAnalysisAndSuggestions() {
    return (
      <GridPanel columns={['2fr', '1fr']} gap={GridPanel.GapSize.LARGE}>
        <GridPanel.Item rowIndex={0} columnIndex={0}>
          <QueryHintsPanel hints={this.state.hints} />
        </GridPanel.Item>
        <GridPanel.Item rowIndex={0} columnIndex={1}>
          <AutocompletePanel suggestions={this.state.suggestions} onInsert={(suggestion) => this.insertSuggestion(suggestion)} />
        </GridPanel.Item>
      </GridPanel>
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

    const outcome = await this.queryRunner.run(this.state.query, this.state.maxRows);

    this.setState({
      running: false,
      hints: outcome.hints,
      error: outcome.error,
      resultRows: outcome.resultRows,
      resultColumns: outcome.resultColumns,
      performance: outcome.performance
    });
  }
}

