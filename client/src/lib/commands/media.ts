import type { EditorView } from "prosemirror-view";

export function insertImage(view: EditorView) {
    const src = window.prompt("Image URL");
    if (!src) {
        return;
    }

    const { image } = view.state.schema.nodes;
    view.dispatch(view.state.tr.replaceSelectionWith(image.create({ src })));
    view.focus();
}
