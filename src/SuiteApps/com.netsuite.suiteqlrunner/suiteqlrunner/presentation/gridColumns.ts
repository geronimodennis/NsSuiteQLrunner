import {DataGrid} from '@uif-js/component';

export function textColumn(name: string, label: string = name) {
  return {
    name,
    binding: name,
    label,
    type: DataGrid.ColumnType.TEXT_BOX
  };
}

