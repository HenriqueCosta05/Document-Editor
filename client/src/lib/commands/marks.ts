import { toggleMark } from "prosemirror-commands";
import type { MarkType } from "prosemirror-model";
import type { EditorView } from "prosemirror-view";
import { isMarkActive } from "./activeState";

export function applyMark(view: EditorView, mark: MarkType, attrs?: Record<string, unknown>) {
    toggleMark(mark, attrs)(view.state, view.dispatch);
    view.focus();
}

export function toggleLink(view: EditorView) {
    const { state, dispatch } = view;
    const { link } = state.schema.marks;

    if (isMarkActive(state, link)) {
        toggleMark(link)(state, dispatch);
        view.focus();
        return;
    }

    const href = window.prompt("Link URL");
    if (!href) {
        return;
    }
    toggleMark(link, { href })(state, dispatch);
    view.focus();
}

export function applyColor(view: EditorView, mark: MarkType, defaultColor: string) {
    const color = window.prompt("Color (hex)", defaultColor);
    if (!color) {
        return;
    }
    toggleMark(mark, { color })(view.state, view.dispatch);
    view.focus();
}
