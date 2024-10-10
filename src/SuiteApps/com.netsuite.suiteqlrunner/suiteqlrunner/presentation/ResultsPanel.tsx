import {Code, DataGrid, Portlet, Text} from '@uif-js/component';
import {ArrayDataSource, SystemIcon} from '@uif-js/core';
import {textColumn} from './gridColumns';

interface ResultsPanelProps {
  columns: string[];
  error: string | null;
  rows: Record<string, unknown>[];
}

export function ResultsPanel(props: ResultsPanelProps) {
  if (props.error) {
    return (
      <Portlet title={'Result'} icon={SystemIcon.ERROR}>
        <Code content={props.error} language={Code.Language.TEXT} background={Code.Background.ERROR} lineWrapping={true} />
      </Portlet>
    );
  }

  if (props.rows.length === 0) {
    return (
      <Portlet title={'Result'} icon={SystemIcon.LIST}>
        <Text color={Text.Color.SECONDARY}>No results yet. Run a SuiteQL query to populate the grid.</Text>
      </Portlet>
    );
  }

  return (
    <Portlet title={`Result (${props.rows.length} rows shown)`} icon={SystemIcon.LIST}>
      <DataGrid dataSource={new ArrayDataSource(props.rows)} columns={props.columns.map((column) => textColumn(column))} />
    </Portlet>
  );
}

