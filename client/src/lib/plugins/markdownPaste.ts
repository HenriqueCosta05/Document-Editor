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

                // A malformed/unsupported token from the parser must never
                // throw here: an uncaught exception inside handlePaste runs
                // during the browser's native paste event and leaves the
                // EditorView's paste handling broken for the rest of the
                // session, not just the one paste. Falling back to the
                // default plain-text paste is always safe.
                let parsed;
                try {
                    parsed = markdownParser.parse(text);
                } catch {
                    return false;
                }
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
