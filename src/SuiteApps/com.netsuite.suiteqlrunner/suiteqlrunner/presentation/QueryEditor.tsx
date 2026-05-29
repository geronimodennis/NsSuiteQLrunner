import {Button, CheckBox, Portlet, StackPanel, Text, TextArea, TextBox} from '@uif-js/component';
import {SystemIcon} from '@uif-js/core';

interface QueryEditorProps {
  maxPages: string;
  pageSize: string;
  query: string;
  runAsSuiteQLPaged: boolean;
  running: boolean;
  onAnalyze: () => void;
  onFormat: () => void;
  onMaxPagesChanged: (maxPages: string) => void;
  onPageSizeChanged: (pageSize: string) => void;
  onQueryChanged: (query: string, caretPosition: number) => void;
  onRunAsSuiteQLPagedChanged: (value: boolean) => void;
  onRun: () => void;
  onToggleRecordChat: () => void;
}

export function QueryEditor(props: QueryEditorProps) {
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
      </StackPanel.Vertical>
    </Portlet>
  );
}
