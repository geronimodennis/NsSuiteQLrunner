import {Button, Code, Portlet, StackPanel, Text, TextArea} from '@uif-js/component';
import {SystemIcon} from '@uif-js/core';
import {RecordChatMessage} from '../domain/models';

interface RecordChatPanelProps {
  draft: string;
  error: string | null;
  messages: RecordChatMessage[];
  running: boolean;
  rootStyle?: Record<string, string>;
  onAsk: () => void;
  onClear: () => void;
  onDraftChanged: (draft: string) => void;
}

export function RecordChatPanel(props: RecordChatPanelProps) {
  return (
    <Portlet title={'AI Report & Schema Chat'} icon={SystemIcon.HELP} rootStyle={props.rootStyle}>
      <StackPanel.Vertical itemGap={StackPanel.GapSize.MEDIUM}>
        {props.error ? (
          <StackPanel.Item>
            <Code content={props.error} language={Code.Language.TEXT} background={Code.Background.ERROR} lineWrapping={true} />
          </StackPanel.Item>
        ) : null}
        {props.messages.map((message, index) => (
          <StackPanel.Item key={`${message.role}-${index}`}>
            <StackPanel.Vertical itemGap={StackPanel.GapSize.SMALL}>
              <StackPanel.Item>
                <Text color={Text.Color.SECONDARY}>{message.role === 'user' ? 'You' : 'AI'}</Text>
              </StackPanel.Item>
              <StackPanel.Item>
                <Code content={message.text} language={Code.Language.TEXT} lineWrapping={true} />
              </StackPanel.Item>
            </StackPanel.Vertical>
          </StackPanel.Item>
        ))}
        <StackPanel.Item>
          <TextArea
            text={props.draft}
            rowCount={4}
            resizable={true}
            resizeDirection={TextArea.ResizeDirection.VERTICAL}
            rootStyle={{width: '100%'}}
            onTextChanged={({text}) => props.onDraftChanged(text)}
          />
        </StackPanel.Item>
        <StackPanel.Item>
          <StackPanel alignment={StackPanel.Alignment.CENTER} itemGap={StackPanel.GapSize.MEDIUM}>
            <StackPanel.Item shrink={0}>
              <Button
                label={props.running ? 'Asking...' : 'Ask AI'}
                type={Button.Type.PRIMARY}
                action={props.onAsk}
              />
            </StackPanel.Item>
            <StackPanel.Item shrink={0}>
              <Button label={'Clear Chat'} action={props.onClear} />
            </StackPanel.Item>
          </StackPanel>
        </StackPanel.Item>
      </StackPanel.Vertical>
    </Portlet>
  );
}
