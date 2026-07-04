import type { Node as ProseMirrorNode } from "prosemirror-model";
import {
    MarkdownParser,
    MarkdownSerializer,
    MarkdownSerializerState,
    defaultMarkdownParser,
    defaultMarkdownSerializer,
} from "prosemirror-markdown";
import MarkdownIt from "markdown-it";
import Token from "markdown-it/lib/token.mjs";
import { editorSchema } from "../schemas/editor.schema";

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

// Table cells tokenize as a bare "inline" token with no paragraph wrapper,
// but our schema's cells require block content, so a paragraph pair is
// spliced in around each one.
function wrapTableCellInlineTokens(tokens: Token[]): Token[] {
    const result: Token[] = [];
    for (let i = 0; i < tokens.length; i += 1) {
        const token = tokens[i];
        result.push(token);

        const isCellOpen = token.type === "th_open" || token.type === "td_open";
        const next = tokens[i + 1];
        if (isCellOpen && next?.type === "inline") {
            result.push(new Token("paragraph_open", "p", 1), next, new Token("paragraph_close", "p", -1));
            i += 1;
        }
    }
    return result;
}

// Start from the same "commonmark" preset defaultMarkdownParser uses (so the
// token surface it's tuned for stays unchanged) and enable only "table" on
// top of it. Switching to the "default" preset instead would also pull in
// "strikethrough"/"linkify" and any other rule markdown-it ships, producing
// token types with no entry below — MarkdownParser throws on those, and an
// uncaught throw from inside handlePaste corrupts the EditorView's paste
// handling entirely, not just table pastes. Enabling rules one at a time
// keeps the token set fully accounted for.
const tableAwareTokenizer = new MarkdownIt("commonmark", { html: false }).enable("table");
const tokenizeWithTables = tableAwareTokenizer.parse.bind(tableAwareTokenizer);
tableAwareTokenizer.parse = (src, env) => wrapTableCellInlineTokens(tokenizeWithTables(src, env));

// Reuses defaultMarkdownParser's token spec against our schema — node/mark
// names match prosemirror-schema-basic/-list, so no custom mapping is
// needed for those. Table tokens are added on top since defaultMarkdownParser
// doesn't have any. underline/color/highlight still have no standard
// Markdown source syntax, so parsing for those remains unsupported (mirrors
// the lossy tradeoffs already documented on the serializer above).
export const markdownParser = new MarkdownParser(editorSchema, tableAwareTokenizer, {
    ...defaultMarkdownParser.tokens,
    table: { block: "table" },
    thead: { ignore: true },
    tbody: { ignore: true },
    tr: { block: "table_row" },
    th: { block: "table_header" },
    td: { block: "table_cell" },
});
