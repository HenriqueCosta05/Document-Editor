import type { Schema } from "prosemirror-model";
import type { Plugin } from "prosemirror-state";
import { baseKeymap, toggleMark } from "prosemirror-commands";
import { history, redo, undo } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { liftListItem, sinkListItem, splitListItem } from "prosemirror-schema-list";
import { dropCursor } from "prosemirror-dropcursor";
import { gapCursor } from "prosemirror-gapcursor";
import { inputRules, textblockTypeInputRule, wrappingInputRule } from "prosemirror-inputrules";
import { columnResizing, tableEditing } from "prosemirror-tables";

function buildInputRules(schema: Schema) {
    const rules = [];

    if (schema.nodes.blockquote) {
        rules.push(wrappingInputRule(/^\s*>\s$/, schema.nodes.blockquote));
    }
    if (schema.nodes.bullet_list) {
        rules.push(wrappingInputRule(/^\s*([-+*])\s$/, schema.nodes.bullet_list));
    }
    if (schema.nodes.ordered_list) {
        rules.push(wrappingInputRule(/^(\d+)\.\s$/, schema.nodes.ordered_list, (match) => ({ order: +match[1] })));
    }
    if (schema.nodes.heading) {
        rules.push(
            textblockTypeInputRule(/^(#{1,6})\s$/, schema.nodes.heading, (match) => ({ level: match[1].length })),
        );
    }
    if (schema.nodes.code_block) {
        rules.push(textblockTypeInputRule(/^```$/, schema.nodes.code_block));
    }

    return inputRules({ rules });
}

function buildKeymap(schema: Schema) {
    const keys: Record<string, ReturnType<typeof toggleMark> | typeof undo> = {
        "Mod-b": toggleMark(schema.marks.strong),
        "Mod-i": toggleMark(schema.marks.em),
        "Mod-u": toggleMark(schema.marks.underline),
        "Mod-Shift-x": toggleMark(schema.marks.strike),
        "Mod-z": undo,
        "Mod-y": redo,
        "Shift-Mod-z": redo,
    };

    if (schema.nodes.list_item) {
        keys["Enter"] = splitListItem(schema.nodes.list_item);
        keys["Mod-["] = liftListItem(schema.nodes.list_item);
        keys["Mod-]"] = sinkListItem(schema.nodes.list_item);
    }

    return keymap(keys);
}

export function buildPlugins(schema: Schema): Plugin[] {
    return [
        buildInputRules(schema),
        buildKeymap(schema),
        keymap(baseKeymap),
        dropCursor(),
        gapCursor(),
        history(),
        columnResizing(),
        tableEditing(),
    ];
}
