import { liftListItem, wrapInList } from "prosemirror-schema-list";
import type { NodeType } from "prosemirror-model";
import type { EditorView } from "prosemirror-view";
import { isBlockActive } from "./activeState";

export function toggleList(view: EditorView, listType: NodeType) {
    const { state, dispatch } = view;
    const { list_item: listItem } = state.schema.nodes;
    const command = isBlockActive(state, listType) ? liftListItem(listItem) : wrapInList(listType);
    command(state, dispatch);
    view.focus();
}
