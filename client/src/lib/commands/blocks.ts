import { lift, setBlockType, wrapIn } from "prosemirror-commands";
import type { EditorView } from "prosemirror-view";
import { isBlockActive } from "./activeState";

export function setHeading(view: EditorView, level: number) {
    const { state, dispatch } = view;
    setBlockType(state.schema.nodes.heading, { level })(state, dispatch);
    view.focus();
}

export function setParagraph(view: EditorView) {
    const { state, dispatch } = view;
    setBlockType(state.schema.nodes.paragraph)(state, dispatch);
    view.focus();
}

export function toggleBlockquote(view: EditorView) {
    const { state, dispatch } = view;
    const { blockquote } = state.schema.nodes;

    if (isBlockActive(state, blockquote)) {
        lift(state, dispatch);
    } else {
        wrapIn(blockquote)(state, dispatch);
    }
    view.focus();
}

export function toggleCodeBlock(view: EditorView) {
    const { state, dispatch } = view;
    const { code_block: codeBlock, paragraph } = state.schema.nodes;
    const type = isBlockActive(state, codeBlock) ? paragraph : codeBlock;
    setBlockType(type)(state, dispatch);
    view.focus();
}

export function setAlign(view: EditorView, align: string) {
    const { state, dispatch } = view;
    const { $from } = state.selection;
    const { type, attrs } = $from.parent;

    if (!("align" in (type.spec.attrs ?? {}))) {
        return;
    }

    dispatch(state.tr.setNodeMarkup($from.before(), undefined, { ...attrs, align }));
    view.focus();
}
