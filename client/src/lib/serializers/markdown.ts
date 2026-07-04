import type { Node as ProseMirrorNode } from "prosemirror-model";
import { MarkdownSerializer, MarkdownSerializerState, defaultMarkdownSerializer } from "prosemirror-markdown";

function cellText(cell: ProseMirrorNode): string {
    let text = "";
    cell.forEach((child) => {
        text += child.textContent;
    });
    return text.trim().replace(/\|/g, "\\|").replace(/\n+/g, " ");
}

function serializeRow(state: MarkdownSerializerState, row: ProseMirrorNode) {
    state.write("|");
    row.forEach((cell) => {
        state.write(` ${cellText(cell)} |`);
    });
    state.ensureNewLine();
}

// prosemirror-markdown has no built-in table support, so the whole subtree
// is rendered here directly; table_row/table_cell/table_header never go
// through the standard node dispatch and so need no serializer entries.
function table(state: MarkdownSerializerState, node: ProseMirrorNode) {
    node.forEach((row, _offset, index) => {
        serializeRow(state, row);
        if (index === 0) {
            const separator = Array.from({ length: row.childCount }, () => "---").join(" | ");
            state.write(`| ${separator} |`);
            state.ensureNewLine();
        }
    });
    state.closeBlock(node);
}

export const markdownSerializer = new MarkdownSerializer(
    { ...defaultMarkdownSerializer.nodes, table },
    {
        ...defaultMarkdownSerializer.marks,
        strike: { open: "~~", close: "~~", mixable: true, expelEnclosingWhitespace: true },
        // underline/color/highlight have no standard Markdown syntax —
        // serialized as passthrough inline HTML (lossy, documented tradeoff).
        underline: { open: "<u>", close: "</u>", mixable: true },
        color: {
            open: (_state, mark) => `<span style="color: ${mark.attrs.color}">`,
            close: "</span>",
            mixable: true,
        },
        highlight: {
            open: (_state, mark) => `<mark style="background-color: ${mark.attrs.color}">`,
            close: "</mark>",
            mixable: true,
        },
    },
);
