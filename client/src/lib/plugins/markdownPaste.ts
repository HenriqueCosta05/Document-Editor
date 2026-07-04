import { Plugin } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";
import { markdownParser } from "../serializers/markdown";

export function markdownPastePlugin() {
    return new Plugin({
        props: {
            handlePaste(view: EditorView, event: ClipboardEvent) {
                const text = event.clipboardData?.getData("text/plain");
                const hasHtml = event.clipboardData?.types.includes("text/html");

                if (!text || hasHtml) {
                    return false;
                }

                const parsed = markdownParser.parse(text);
                if (!parsed) {
                    return false;
                }

                const { state, dispatch } = view;
                const { from, to } = state.selection;
                dispatch(state.tr.replaceWith(from, to, parsed.content).scrollIntoView());
                return true;
            },
        },
    });
}
