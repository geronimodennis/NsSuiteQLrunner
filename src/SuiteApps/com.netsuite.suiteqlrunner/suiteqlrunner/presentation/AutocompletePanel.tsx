import {Button, Portlet, StackPanel} from '@uif-js/component';
import {SystemIcon} from '@uif-js/core';
import {CompletionItem} from '../domain/models';

interface AutocompletePanelProps {
  suggestions: CompletionItem[];
  onInsert: (suggestion: CompletionItem) => void;
}

export function AutocompletePanel({suggestions, onInsert}: AutocompletePanelProps) {
  return (
    <Portlet title={'Autocomplete'} icon={SystemIcon.HELP} collapsible={true}>
      <StackPanel.Vertical itemGap={StackPanel.GapSize.SMALL}>
        {suggestions.map((suggestion) => (
          <StackPanel.Item key={`${suggestion.type}-${suggestion.name}`}>
            <Button
              label={`${suggestion.name} - ${suggestion.type}`}
              action={() => onInsert(suggestion)}
              rootStyle={{width: '100%', justifyContent: 'flex-start'}}
            />
          </StackPanel.Item>
        ))}
      </StackPanel.Vertical>
    </Portlet>
  );
}

