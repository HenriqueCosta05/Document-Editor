import { Schema, type DOMOutputSpec, type MarkSpec, type Node as ProseMirrorNode } from "prosemirror-model";
import { schema as basicSchema } from "prosemirror-schema-basic";
import { addListNodes } from "prosemirror-schema-list";
import { tableNodes } from "prosemirror-tables";

const alignAttr = { align: { default: "left" } };

function alignStyleAttrs(node: ProseMirrorNode): { style?: string } {
    const align = node.attrs.align as string;
    return align && align !== "left" ? { style: `text-align: ${align}` } : {};
}

const paragraph = {
    ...basicSchema.spec.nodes.get("paragraph")!,
    attrs: alignAttr,
    toDOM(node: ProseMirrorNode): DOMOutputSpec {
        return ["p", alignStyleAttrs(node), 0];
    },
};

const heading = {
    ...basicSchema.spec.nodes.get("heading")!,
    attrs: { level: { default: 1 }, ...alignAttr },
    toDOM(node: ProseMirrorNode): DOMOutputSpec {
        return [`h${node.attrs.level}`, alignStyleAttrs(node), 0];
    },
};

const underline: MarkSpec = {
    parseDOM: [{ tag: "u" }, { style: "text-decoration=underline" }],
    toDOM() {
        return ["u", 0];
    },
};

const strike: MarkSpec = {
    parseDOM: [{ tag: "s" }, { tag: "del" }, { tag: "strike" }, { style: "text-decoration=line-through" }],
    toDOM() {
        return ["s", 0];
    },
};

const color: MarkSpec = {
    attrs: { color: { default: "#000000" } },
    parseDOM: [{ style: "color", getAttrs: (value) => ({ color: value as string }) }],
    toDOM(mark) {
        return ["span", { style: `color: ${mark.attrs.color}` }, 0];
    },
};

const highlight: MarkSpec = {
    attrs: { color: { default: "#ffff00" } },
    parseDOM: [
        { tag: "mark", getAttrs: (dom) => ({ color: (dom as HTMLElement).style.backgroundColor || "#ffff00" }) },
        { style: "background-color", getAttrs: (value) => ({ color: value as string }) },
    ],
    toDOM(mark) {
        return ["mark", { style: `background-color: ${mark.attrs.color}` }, 0];
    },
};

const editedBy: MarkSpec = {
    attrs: { id: { default: "" }, name: { default: "" }, color: { default: "#999999" } },
    excludes: "",
    inclusive: false,
    parseDOM: [
        {
            tag: "span[data-author-id]",
            getAttrs: (dom) => ({
                id: (dom as HTMLElement).getAttribute("data-author-id") || "",
                name: (dom as HTMLElement).getAttribute("data-author-name") || "",
                color: (dom as HTMLElement).getAttribute("data-author-color") || "#999999",
            }),
        },
    ],
    toDOM(mark) {
        const authorColor = mark.attrs.color as string;
        return [
            "span",
            {
                class: "authorship-mark",
                "data-author-id": mark.attrs.id,
                "data-author-name": mark.attrs.name,
                "data-author-color": authorColor,
                title: `Edited by ${mark.attrs.name}`,
                style: `--author-bg: ${authorColor}26; --author-line: ${authorColor}`,
            },
            0,
        ];
    },
};

const baseNodes = basicSchema.spec.nodes.update("paragraph", paragraph).update("heading", heading);

const nodesWithLists = addListNodes(baseNodes, "paragraph block*", "block");

const nodesWithTables = nodesWithLists.append(
    tableNodes({ tableGroup: "block", cellContent: "block+", cellAttributes: {} }),
);

export const editorSchema = new Schema({
    nodes: nodesWithTables,
    marks: basicSchema.spec.marks.append({ underline, strike, color, highlight, edited_by: editedBy }),
});
