import {Button, FormattedText, Portlet, ScrollPanel, StackPanel, Text, TextArea} from '@uif-js/component';
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
  onClose: () => void;
  onDraftChanged: (draft: string) => void;
}

export function RecordChatPanel(props: RecordChatPanelProps) {
  const responseItems = [];

  if (props.error) {
    responseItems.push(
      <StackPanel.Item key={'error'}>
        {renderPlainText(props.error, true)}
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
              renderPlainText(message.text)
            )}
          </StackPanel.Item>
        </StackPanel.Vertical>
      </StackPanel.Item>
    );
  });

  return (
    <Portlet title={'AI Report & Schema Chat'} icon={SystemIcon.HELP} rootStyle={props.rootStyle}>
      <StackPanel.Vertical rootStyle={{height: '100%'}} itemGap={StackPanel.GapSize.MEDIUM}>
        <StackPanel.Item shrink={0}>
          <StackPanel alignment={StackPanel.Alignment.END}>
            <StackPanel.Item shrink={0}>
              <Button label={'Close'} action={props.onClose} />
            </StackPanel.Item>
          </StackPanel>
        </StackPanel.Item>
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
  const items = parseMarkdownBlocks(text).map((block, index) => (
    <StackPanel.Item key={`markdown-${index}`}>
      {block.type === 'code' ? (
        renderCodeBlock(block.content)
      ) : (
        FormattedText.markdown(block.content, {
          wrap: true,
          whitespace: true
        })
      )}
    </StackPanel.Item>
  ));

  return <StackPanel.Vertical itemGap={StackPanel.GapSize.SMALL}>{items}</StackPanel.Vertical>;
}

function renderPlainText(text: string, isError = false) {
  return (
    <div
      style={{
        backgroundColor: isError ? '#fce8e6' : '#f8fafc',
        border: `1px solid ${isError ? '#c5221f' : '#d5dce8'}`,
        borderRadius: '4px',
        color: isError ? '#8a1c16' : '#1f2937',
        fontFamily: 'inherit',
        fontSize: '14px',
        lineHeight: '1.45',
        padding: '8px 10px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word'
      }}
    >
      {text}
    </div>
  );
}

function renderCodeBlock(text: string) {
  return (
    <pre
      style={{
        backgroundColor: '#f6f8fa',
        border: '1px solid #d0d7de',
        borderRadius: '4px',
        color: '#24292f',
        fontFamily: 'Consolas, Monaco, "Courier New", monospace',
        fontSize: '13px',
        lineHeight: '1.45',
        margin: '0',
        overflowX: 'auto',
        padding: '10px 12px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word'
      }}
    >
      {text || ' '}
    </pre>
  );
}

function parseMarkdownBlocks(text: string) {
  const blocks = [];
  const pattern = /```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    const prose = text.slice(cursor, match.index).trim();

    if (prose) {
      blocks.push({
        type: 'markdown',
        content: prose,
        language: ''
      });
    }

    const parsedCode = parseCodeFence(match[1], match[2]);

    blocks.push({
      type: 'code',
      content: parsedCode.content,
      language: parsedCode.language
    });

    cursor = match.index + match[0].length;
  }

  const trailing = text.slice(cursor).trim();

  if (trailing || blocks.length === 0) {
    blocks.push({
      type: 'markdown',
      content: trailing || text,
      language: ''
    });
  }

  return blocks;
}

function parseCodeFence(language: string, content: string) {
  const normalizedLanguage = String(language || '').trim().toLowerCase();
  const normalizedContent = String(content || '').trim();
  const sameLineLanguageMatch = normalizedContent.match(/^(sql|javascript|js|css|html|xml|java)\s+([\s\S]+)$/i);

  if (!normalizedLanguage && sameLineLanguageMatch) {
    return {
      language: sameLineLanguageMatch[1].toLowerCase(),
      content: sameLineLanguageMatch[2].trim()
    };
  }

  return {
    language: normalizedLanguage,
    content: normalizedContent
  };
}
