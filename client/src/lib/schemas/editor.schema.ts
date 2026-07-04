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

const baseNodes = basicSchema.spec.nodes.update("paragraph", paragraph).update("heading", heading);

const nodesWithLists = addListNodes(baseNodes, "paragraph block*", "block");

const nodesWithTables = nodesWithLists.append(
    tableNodes({ tableGroup: "block", cellContent: "block+", cellAttributes: {} }),
);

export const editorSchema = new Schema({
    nodes: nodesWithTables,
    marks: basicSchema.spec.marks.append({ underline, strike, color, highlight }),
});
