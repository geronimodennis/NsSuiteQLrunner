import {Button, CheckBox, Portlet, ScrollPanel, StackPanel, Text, TextArea, TextBox} from '@uif-js/component';
import {SystemIcon} from '@uif-js/core';
import {CompletionItem, QueryHint} from '../domain/models';

interface QueryEditorProps {
  executionError: string | null;
  hints: QueryHint[];
  historyItems: QueryHistoryItem[];
  historyVisible: boolean;
  maxPages: string;
  pageSize: string;
  query: string;
  runAsSuiteQLPaged: boolean;
  running: boolean;
  suggestions: CompletionItem[];
  onAnalyze: () => void;
  onClearHistory: () => void;
  onDeleteHistoryItem: (id: string) => void;
  onFormat: () => void;
  onLoadHistoryItem: (id: string) => void;
  onMaxPagesChanged: (maxPages: string) => void;
  onPageSizeChanged: (pageSize: string) => void;
  onQueryChanged: (query: string, caretPosition: number) => void;
  onRunAsSuiteQLPagedChanged: (value: boolean) => void;
  onRun: () => void;
  onToggleHistory: () => void;
  onToggleRecordChat: () => void;
  onInsertSuggestion: (suggestion: CompletionItem) => void;
}

export interface QueryHistoryItem {
  id: string;
  title: string;
  query: string;
  updatedAt: number;
}

export function QueryEditor(props: QueryEditorProps) {
  const actionableHints = getActionableHints(props.hints, props.executionError);
  const autocompleteItems = props.suggestions.slice(0, 10).map((suggestion) => (
    <StackPanel.Item key={`${suggestion.type}-${suggestion.name}`} shrink={0}>
      <Button
        label={`${suggestion.name} - ${suggestion.type}`}
        action={() => props.onInsertSuggestion(suggestion)}
      />
    </StackPanel.Item>
  ));
  const autocompleteStackItems = autocompleteItems.length > 0 ? autocompleteItems : [
    <StackPanel.Item key={'empty-autocomplete'} shrink={0}>
      <div style={{display: 'none'}} />
    </StackPanel.Item>
  ];

  return (
    <Portlet title={'Query Editor'} icon={SystemIcon.EDIT}>
      <StackPanel.Vertical itemGap={StackPanel.GapSize.MEDIUM}>
        <StackPanel.Item>
          <StackPanel alignment={StackPanel.Alignment.CENTER} itemGap={StackPanel.GapSize.MEDIUM}>
            <StackPanel.Item shrink={0}>
              <Button
                label={props.running ? 'Running...' : 'Run SuiteQL'}
                type={Button.Type.PRIMARY}
                action={props.onRun}
              />
            </StackPanel.Item>
            <StackPanel.Item shrink={0}>
              <Button label={'Format SuiteQL'} action={props.onFormat} />
            </StackPanel.Item>
            <StackPanel.Item shrink={0}>
              <Button label={'Analyze'} action={props.onAnalyze} />
            </StackPanel.Item>
            <StackPanel.Item shrink={0}>
              <Button label={'AI Chat'} action={props.onToggleRecordChat} />
            </StackPanel.Item>
            <StackPanel.Item shrink={0}>
              <CheckBox
                label={'Run as SuiteQLPaged'}
                labelPosition={CheckBox.LabelPosition.RIGHT}
                value={props.runAsSuiteQLPaged}
                action={({value}) => props.onRunAsSuiteQLPagedChanged(Boolean(value))}
              />
            </StackPanel.Item>
            <StackPanel.Item shrink={0}>
              <TextBox
                text={props.pageSize}
                placeholder={'Rows/page'}
                onTextChanged={({text}) => props.onPageSizeChanged(text)}
                rootStyle={{width: '110px'}}
              />
            </StackPanel.Item>
            <StackPanel.Item shrink={0}>
              <TextBox
                text={props.maxPages}
                placeholder={'Pages'}
                onTextChanged={({text}) => props.onMaxPagesChanged(text)}
                rootStyle={{width: '90px'}}
              />
            </StackPanel.Item>
            <StackPanel.Item grow={1}>
              <Text color={Text.Color.SECONDARY}>
                Paged mode fetches multiple pages. Direct mode falls back to paged results when the result appears capped.
              </Text>
            </StackPanel.Item>
          </StackPanel>
        </StackPanel.Item>
        <StackPanel.Item>
          <TextArea
            text={props.query}
            rowCount={18}
            resizable={true}
            resizeDirection={TextArea.ResizeDirection.VERTICAL}
            autoComplete={'off'}
            rootStyle={{
              fontFamily: 'Consolas, Monaco, monospace',
              width: '100%'
            }}
            onTextChanged={(args, sender) => props.onQueryChanged(args.text, sender.selection.end || args.text.length)}
          />
        </StackPanel.Item>
        <StackPanel.Item>
          {actionableHints.length > 0 ? (
            <StackPanel.Vertical itemGap={StackPanel.GapSize.SMALL}>
              <StackPanel.Item>
                <Text color={Text.Color.SECONDARY}>SuiteQL Hints</Text>
              </StackPanel.Item>
              <StackPanel.Item>
                <StackPanel.Vertical itemGap={StackPanel.GapSize.SMALL}>
                  {actionableHints.map((hint, index) => (
                    <StackPanel.Item key={`${hint.severity}-${index}`}>{renderHint(hint)}</StackPanel.Item>
                  ))}
                </StackPanel.Vertical>
              </StackPanel.Item>
            </StackPanel.Vertical>
          ) : (
            <div style={{display: 'none'}} />
          )}
        </StackPanel.Item>
        <StackPanel.Item>
          <StackPanel wrap={true} itemGap={StackPanel.GapSize.SMALL} wrapGap={StackPanel.GapSize.SMALL}>
            {autocompleteStackItems}
          </StackPanel>
        </StackPanel.Item>
        <StackPanel.Item>
          <StackPanel alignment={StackPanel.Alignment.END}>
            <StackPanel.Item shrink={0}>
              <Button label={'Editor History'} icon={SystemIcon.LIST} action={props.onToggleHistory} />
            </StackPanel.Item>
          </StackPanel>
        </StackPanel.Item>
        <StackPanel.Item>
          {props.historyVisible ? renderHistoryPanel(props) : <div style={{display: 'none'}} />}
        </StackPanel.Item>
      </StackPanel.Vertical>
    </Portlet>
  );
}

function renderHistoryPanel(props: QueryEditorProps) {
  const historyItems = props.historyItems.map((item) => (
    <StackPanel.Item key={item.id}>
      <div
        style={{
          border: '1px solid #d5dce8',
          borderRadius: '4px',
          padding: '8px'
        }}
      >
        <StackPanel.Vertical itemGap={StackPanel.GapSize.SMALL}>
          <StackPanel.Item>
            <Text>{item.title}</Text>
          </StackPanel.Item>
          <StackPanel.Item>
            <Text color={Text.Color.SECONDARY}>{formatHistoryDate(item.updatedAt)}</Text>
          </StackPanel.Item>
          <StackPanel.Item>
            <StackPanel itemGap={StackPanel.GapSize.SMALL}>
              <StackPanel.Item shrink={0}>
                <Button label={'Load'} action={() => props.onLoadHistoryItem(item.id)} />
              </StackPanel.Item>
              <StackPanel.Item shrink={0}>
                <Button label={'Delete'} action={() => props.onDeleteHistoryItem(item.id)} />
              </StackPanel.Item>
            </StackPanel>
          </StackPanel.Item>
        </StackPanel.Vertical>
      </div>
    </StackPanel.Item>
  ));
  const queryHistoryItems = historyItems.length > 0 ? historyItems : [
    <StackPanel.Item key={'empty-query-history'}>
      <Text color={Text.Color.SECONDARY}>No query history yet.</Text>
    </StackPanel.Item>
  ];

  return (
    <div
      style={{
        border: '1px solid #d5dce8',
        borderRadius: '4px',
        padding: '10px'
      }}
    >
      <StackPanel.Vertical itemGap={StackPanel.GapSize.MEDIUM}>
        <StackPanel.Item>
          <StackPanel alignment={StackPanel.Alignment.CENTER} itemGap={StackPanel.GapSize.SMALL}>
            <StackPanel.Item grow={1}>
              <Text color={Text.Color.SECONDARY}>Query Editor History</Text>
            </StackPanel.Item>
            <StackPanel.Item shrink={0}>
              <Button label={'Clear All'} action={props.onClearHistory} />
            </StackPanel.Item>
          </StackPanel>
        </StackPanel.Item>
        <StackPanel.Item>
          <ScrollPanel orientation={ScrollPanel.Orientation.VERTICAL} rootStyle={{maxHeight: '220px'}}>
            <StackPanel.Vertical itemGap={StackPanel.GapSize.SMALL}>
              {queryHistoryItems}
            </StackPanel.Vertical>
          </ScrollPanel>
        </StackPanel.Item>
      </StackPanel.Vertical>
    </div>
  );
}

function formatHistoryDate(value: number) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleString();
}

function getActionableHints(hints: QueryHint[], executionError: string | null): QueryHint[] {
  const actionableHints = (hints || []).filter((hint) => hint.severity === 'error' || hint.severity === 'warning');

  if (!executionError) {
    return actionableHints;
  }

  return [
    {
      severity: 'error',
      message: 'SuiteQL execution failed.',
      detail: executionError
    },
    ...actionableHints
  ];
}

function renderHint(hint: QueryHint) {
  const isError = hint.severity === 'error';

  return (
    <div
      style={{
        alignItems: 'flex-start',
        backgroundColor: isError ? '#fce8e6' : '#fff8e1',
        border: `1px solid ${isError ? '#c5221f' : '#f2c94c'}`,
        borderRadius: '4px',
        color: '#1f2937',
        display: 'flex',
        gap: '8px',
        padding: '8px 10px'
      }}
    >
      <span
        style={{
          alignItems: 'center',
          backgroundColor: isError ? '#c5221f' : '#8a6d00',
          borderRadius: '50%',
          color: '#ffffff',
          display: 'inline-flex',
          flex: '0 0 18px',
          fontSize: '12px',
          fontWeight: '700',
          height: '18px',
          justifyContent: 'center',
          lineHeight: '18px',
          marginTop: '1px',
          width: '18px'
        }}
      >
        !
      </span>
      <span style={{display: 'block', lineHeight: '1.45'}}>
        <strong>{isError ? 'Error' : 'Warning'}:</strong> {hint.message}
        {hint.detail ? (
          <span style={{display: 'block', marginTop: '2px', whiteSpace: 'pre-wrap'}}>{hint.detail}</span>
        ) : null}
      </span>
    </div>
  );
}
