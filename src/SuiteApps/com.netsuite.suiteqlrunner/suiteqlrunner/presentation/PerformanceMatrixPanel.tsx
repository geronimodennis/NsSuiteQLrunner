import {DataGrid, Portlet} from '@uif-js/component';
import {ArrayDataSource, SystemIcon} from '@uif-js/core';
import {buildPerformanceRows} from '../application/PerformanceMatrix';
import {QueryExecutionMeta} from '../domain/models';
import {textColumn} from './gridColumns';

interface PerformanceMatrixPanelProps {
  performance: QueryExecutionMeta;
}

export function PerformanceMatrixPanel({performance}: PerformanceMatrixPanelProps) {
  return (
    <Portlet title={'SuiteQL Performance Matrix'} icon={SystemIcon.PERFORMANCE} collapsible={true}>
      <DataGrid dataSource={new ArrayDataSource(buildPerformanceRows(performance || {}))} columns={columns()} />
    </Portlet>
  );
}

function columns() {
  return [textColumn('metric', 'Metric'), textColumn('value', 'Value'), textColumn('unit', 'Unit')];
}

