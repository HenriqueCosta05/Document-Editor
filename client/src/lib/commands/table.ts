import type { Node as ProseMirrorNode, Schema } from "prosemirror-model";
import type { EditorView } from "prosemirror-view";

function createTable(schema: Schema, rows: number, cols: number): ProseMirrorNode {
    const { table, table_row: tableRow, table_header: tableHeader, table_cell: tableCell, paragraph } = schema.nodes;

    const headerRow = tableRow.create(
        null,
        Array.from({ length: cols }, () => tableHeader.create(null, paragraph.create())),
    );
    const bodyRows = Array.from({ length: rows - 1 }, () =>
        tableRow.create(null, Array.from({ length: cols }, () => tableCell.create(null, paragraph.create()))),
    );

    return table.create(null, [headerRow, ...bodyRows]);
}

export function insertTable(view: EditorView, rows = 3, cols = 3) {
    const { state, dispatch } = view;
    dispatch(state.tr.replaceSelectionWith(createTable(state.schema, rows, cols)));
    view.focus();
}
