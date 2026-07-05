import { useEffect, useRef } from "react";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { receiveTransaction, sendableSteps } from "prosemirror-collab";
import { Step } from "prosemirror-transform";
import { editorSchema } from "../../lib/schemas/editor.schema";
import { buildPlugins } from "../../lib/plugins/plugins";
import { collabCursorKey } from "../../lib/plugins/collabCursor";
import { fetchCollabState } from "../../services/collabState";
import { CollabSocket } from "../../services/collabSocket";
import { EditorSurface } from "./Editor.style";

export interface EditorProps {
    documentId: string;
    displayName: string;
    onReady: (view: EditorView) => void;
    onDocChanged?: () => void;
    onTransaction?: (view: EditorView) => void;
}

const IDENTITY_STORAGE_KEY = "documenter.collabIdentityId";

const Editor = ({ documentId, displayName, onReady, onDocChanged, onTransaction }: EditorProps) => {
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

        // Per-tab id for prosemirror-collab step attribution. Independent of
        // the author Identity (display name/color), which is negotiated over
        // the socket separately and persisted across reconnects.
        const clientID = crypto.randomUUID();
        const socket = new CollabSocket();
        let view: EditorView | null = null;
        let cancelled = false;
        let ownIdentityId: string | null = null;

        function sendOwnCursor(state: EditorState) {
            if (!ownIdentityId) {
                return;
            }
            socket.sendCursor(state.selection.from, state.selection.to);
        }

        function sendPendingSteps(state: EditorState) {
            const sendable = sendableSteps(state);
            if (sendable) {
                socket.sendSteps(
                    sendable.version,
                    sendable.steps.map((step) => step.toJSON()),
                    String(sendable.clientID),
                    state.doc.toJSON(),
                );
            }
        }

        fetchCollabState(documentId).then((collabState) => {
            if (cancelled || !mountRef.current) {
                return;
            }

            const state = EditorState.create({
                doc: editorSchema.nodeFromJSON(collabState.content),
                plugins: buildPlugins(editorSchema, { version: collabState.version, clientID }),
            });

            view = new EditorView(mountRef.current, {
                state,
                dispatchTransaction(transaction) {
                    if (!view) {
                        return;
                    }
                    const newState = view.state.apply(transaction);
                    view.updateState(newState);
                    if (transaction.docChanged) {
                        onDocChangedRef.current?.();
                        sendPendingSteps(newState);
                    }
                    if (transaction.docChanged || transaction.selectionSet) {
                        sendOwnCursor(newState);
                    }
                    onTransactionRef.current?.(view);
                },
            });

            onReadyRef.current(view);

            socket.connect(documentId, displayName, localStorage.getItem(IDENTITY_STORAGE_KEY), {
                onIdentified(message) {
                    localStorage.setItem(IDENTITY_STORAGE_KEY, message.identity.id);
                    ownIdentityId = message.identity.id;
                    if (view) {
                        sendOwnCursor(view.state);
                    }
                },
                onNewSteps(message) {
                    if (!view) {
                        return;
                    }
                    const steps = message.steps.map((step) => Step.fromJSON(editorSchema, step));
                    view.dispatch(receiveTransaction(view.state, steps, message.clientIDs));
                },
                onRebaseRequired(message) {
                    if (!view) {
                        return;
                    }
                    const steps = message.steps.map((step) => Step.fromJSON(editorSchema, step));
                    view.dispatch(receiveTransaction(view.state, steps, message.clientIDs));
                    sendPendingSteps(view.state);
                },
                onCursorUpdate(message) {
                    if (!view || message.identity.id === ownIdentityId) {
                        return;
                    }
                    view.dispatch(
                        view.state.tr.setMeta(collabCursorKey, {
                            type: "update",
                            identity: message.identity,
                            from: message.from,
                            to: message.to,
                        }),
                    );
                },
                onCursorLeft(message) {
                    if (!view) {
                        return;
                    }
                    view.dispatch(view.state.tr.setMeta(collabCursorKey, { type: "remove", identityId: message.identityId }));
                },
            });
        });

        return () => {
            cancelled = true;
            socket.disconnect();
            view?.destroy();
        };
    }, [documentId, displayName]);

    return <EditorSurface ref={mountRef} />;
};

export default Editor;
