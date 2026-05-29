import {Button, Code, FormattedText, Portlet, ScrollPanel, StackPanel, Text, TextArea} from '@uif-js/component';
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
  const responseItems = [];

  if (props.error) {
    responseItems.push(
      <StackPanel.Item key={'error'}>
        <Code content={props.error} language={Code.Language.TEXT} background={Code.Background.ERROR} lineWrapping={true} />
      </StackPanel.Item>
    );
  }

  props.messages.forEach((message, index) => {
    responseItems.push(
      <StackPanel.Item key={`${message.role}-${index}`}>
        <StackPanel.Vertical itemGap={StackPanel.GapSize.SMALL}>
          <StackPanel.Item>
            <Text color={Text.Color.SECONDARY}>{message.role === 'user' ? 'You' : 'AI'}</Text>
          </StackPanel.Item>
          <StackPanel.Item>
            {message.role === 'assistant' ? (
              renderMarkdown(message.text)
            ) : (
              <Code content={message.text} language={Code.Language.TEXT} lineWrapping={true} />
            )}
          </StackPanel.Item>
        </StackPanel.Vertical>
      </StackPanel.Item>
    );
  });

  return (
    <Portlet title={'AI Report & Schema Chat'} icon={SystemIcon.HELP} rootStyle={props.rootStyle}>
      <StackPanel.Vertical rootStyle={{height: '100%'}} itemGap={StackPanel.GapSize.MEDIUM}>
        <StackPanel.Item grow={1}>
          <StackPanel.Vertical rootStyle={{height: '100%'}} itemGap={StackPanel.GapSize.SMALL}>
            <StackPanel.Item shrink={0}>
              <Text color={Text.Color.SECONDARY}>Response</Text>
            </StackPanel.Item>
            <StackPanel.Item grow={1}>
              <ScrollPanel orientation={ScrollPanel.Orientation.VERTICAL} rootStyle={{height: '100%'}}>
                <StackPanel.Vertical itemGap={StackPanel.GapSize.MEDIUM}>{responseItems}</StackPanel.Vertical>
              </ScrollPanel>
            </StackPanel.Item>
          </StackPanel.Vertical>
        </StackPanel.Item>
        <StackPanel.Item shrink={0}>
          <StackPanel.Vertical itemGap={StackPanel.GapSize.SMALL}>
            <StackPanel.Item>
              <Text color={Text.Color.SECONDARY}>AI chat tool</Text>
            </StackPanel.Item>
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
        </StackPanel.Item>
      </StackPanel.Vertical>
    </Portlet>
  );
}

function renderMarkdown(text: string) {
  return FormattedText.markdown(text, {
    wrap: true,
    whitespace: true
  });
}
