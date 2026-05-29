import {DataGrid, Portlet} from '@uif-js/component';
import {ArrayDataSource, SystemIcon} from '@uif-js/core';
import {QueryHint} from '../domain/models';
import {textColumn} from './gridColumns';

interface QueryHintsPanelProps {
  hints: QueryHint[];
}

export function QueryHintsPanel({hints}: QueryHintsPanelProps) {
  return (
    <Portlet title={'SuiteQL Hints'} icon={SystemIcon.INFO} collapsible={true}>
      <DataGrid dataSource={new ArrayDataSource(toRows(hints))} columns={columns()} />
    </Portlet>
  );
}

function toRows(hints: QueryHint[]) {
  return hints.map((hint, index) => ({
    id: index + 1,
    severity: hint.severity.toUpperCase(),
    message: hint.message,
    detail: hint.detail
  }));
}

function columns() {
  return [textColumn('severity', 'Severity'), textColumn('message', 'Message'), textColumn('detail', 'Detail')];
}

