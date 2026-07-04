import { useEffect, useRef } from "react";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { editorSchema } from "../../lib/schemas/editor.schema";
import { buildPlugins } from "../../lib/plugins/plugins";
import { EditorSurface } from "./Editor.style";

export interface EditorProps {
    onReady: (view: EditorView) => void;
    onDocChanged?: () => void;
    onTransaction?: (view: EditorView) => void;
}

const Editor = ({ onReady, onDocChanged, onTransaction }: EditorProps) => {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const onReadyRef = useRef(onReady);
    const onDocChangedRef = useRef(onDocChanged);
    const onTransactionRef = useRef(onTransaction);

    useEffect(() => {
        onReadyRef.current = onReady;
    }, [onReady]);

    useEffect(() => {
        onDocChangedRef.current = onDocChanged;
    }, [onDocChanged]);

    useEffect(() => {
        onTransactionRef.current = onTransaction;
    }, [onTransaction]);

    useEffect(() => {
        if (!mountRef.current) {
            return;
        }

        const state = EditorState.create({
            schema: editorSchema,
            plugins: buildPlugins(editorSchema),
        });

        const view = new EditorView(mountRef.current, {
            state,
            dispatchTransaction(transaction) {
                const newState = view.state.apply(transaction);
                view.updateState(newState);
                if (transaction.docChanged) {
                    onDocChangedRef.current?.();
                }
                onTransactionRef.current?.(view);
            },
        });

        onReadyRef.current(view);

        return () => {
            view.destroy();
        };
    }, []);

    return <EditorSurface ref={mountRef} />;
};

export default Editor;
