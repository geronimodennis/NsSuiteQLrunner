import {DataGrid, GridPanel, Portlet, StackPanel, Text} from '@uif-js/component';
import {ArrayDataSource, SystemIcon} from '@uif-js/core';
import {buildPerformanceRows} from '../application/PerformanceMatrix';
import {QueryExecutionMeta, QueryHint} from '../domain/models';
import {textColumn} from './gridColumns';

interface QueryDiagnosticsPanelProps {
  hints: QueryHint[];
  performance: QueryExecutionMeta;
}

export function QueryDiagnosticsPanel({hints, performance}: QueryDiagnosticsPanelProps) {
  return (
    <Portlet title={'SuiteQL Performance Matrix & Hints'} icon={SystemIcon.PERFORMANCE} collapsible={true}>
      <GridPanel columns={['1fr', '2fr']} gap={GridPanel.GapSize.LARGE}>
        <GridPanel.Item rowIndex={0} columnIndex={0}>
          <StackPanel.Vertical itemGap={StackPanel.GapSize.SMALL}>
            <StackPanel.Item>
              <Text color={Text.Color.SECONDARY}>SuiteQL Performance Matrix</Text>
            </StackPanel.Item>
            <StackPanel.Item>
              <DataGrid dataSource={new ArrayDataSource(buildPerformanceRows(performance || {}))} columns={performanceColumns()} />
            </StackPanel.Item>
          </StackPanel.Vertical>
        </GridPanel.Item>
        <GridPanel.Item rowIndex={0} columnIndex={1}>
          <StackPanel.Vertical itemGap={StackPanel.GapSize.SMALL}>
            <StackPanel.Item>
              <Text color={Text.Color.SECONDARY}>SuiteQL Hints</Text>
            </StackPanel.Item>
            <StackPanel.Item>
              <DataGrid dataSource={new ArrayDataSource(toHintRows(hints))} columns={hintColumns()} />
            </StackPanel.Item>
          </StackPanel.Vertical>
        </GridPanel.Item>
      </GridPanel>
    </Portlet>
  );
}

function toHintRows(hints: QueryHint[]) {
  return hints.map((hint, index) => ({
    id: index + 1,
    severity: hint.severity.toUpperCase(),
    message: hint.message,
    detail: hint.detail
  }));
}

function performanceColumns() {
  return [textColumn('metric', 'Metric'), textColumn('value', 'Value'), textColumn('unit', 'Unit')];
}

function hintColumns() {
  return [textColumn('severity', 'Severity'), textColumn('message', 'Message'), textColumn('detail', 'Detail')];
}
