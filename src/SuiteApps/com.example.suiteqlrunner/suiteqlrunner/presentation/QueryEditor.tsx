import {Button, Portlet, StackPanel, Text, TextArea, TextBox} from '@uif-js/component';
import {SystemIcon} from '@uif-js/core';

interface QueryEditorProps {
  maxRows: string;
  query: string;
  running: boolean;
  onAnalyze: () => void;
  onFormat: () => void;
  onMaxRowsChanged: (maxRows: string) => void;
  onQueryChanged: (query: string, caretPosition: number) => void;
  onRun: () => void;
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
              <TextBox
                text={props.maxRows}
                placeholder={'Max rows'}
                onTextChanged={({text}) => props.onMaxRowsChanged(text)}
                rootStyle={{width: '110px'}}
              />
            </StackPanel.Item>
            <StackPanel.Item grow={1}>
              <Text color={Text.Color.SECONDARY}>
                Hints do not block execution. NetSuite execution errors appear in the result section.
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

