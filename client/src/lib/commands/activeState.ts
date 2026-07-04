import type { EditorState } from "prosemirror-state";
import type { MarkType, NodeType } from "prosemirror-model";

export function isMarkActive(state: EditorState, type: MarkType): boolean {
    const { from, to, empty } = state.selection;
    if (empty) {
        return !!type.isInSet(state.storedMarks ?? state.selection.$from.marks());
    }
    return state.doc.rangeHasMark(from, to, type);
}

export function isBlockActive(state: EditorState, type: NodeType, attrs: Record<string, unknown> = {}): boolean {
    const { $from, to } = state.selection;
    return to <= $from.end() && $from.parent.hasMarkup(type, attrs);
}

export function isAlignActive(state: EditorState, align: string): boolean {
    return state.selection.$from.parent.attrs.align === align;
}
