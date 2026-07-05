import { useEffect, useRef } from "react";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { receiveTransaction, sendableSteps } from "prosemirror-collab";
import { Step } from "prosemirror-transform";
import { editorSchema } from "../../lib/schemas/editor.schema";
import { buildPlugins } from "../../lib/plugins/plugins";
import { collabCursorKey } from "../../lib/plugins/collabCursor";
import { ATTRIBUTION_META, buildAttributionTransaction } from "../../lib/collab/attribution";
import { fetchCollabState } from "../../services/collabState";
import { CollabSocket } from "../../services/collabSocket";
import type { CollabIdentity } from "../../@types/collab";
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

        const clientID = crypto.randomUUID();
        const socket = new CollabSocket();
        let view: EditorView | null = null;
        let cancelled = false;
        let ownIdentityId: string | null = null;
        let ownIdentity: CollabIdentity | null = null;

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
                    let newState = view.state.apply(transaction);
                    if (transaction.docChanged) {
                        const remoteAuthors = transaction.getMeta(ATTRIBUTION_META) as
                            | (CollabIdentity | null)[]
                            | undefined;
                        const authors = remoteAuthors ?? (ownIdentity ? transaction.steps.map(() => ownIdentity) : []);
                        const markTr = buildAttributionTransaction(newState, transaction, authors);
                        if (markTr) {
                            newState = newState.apply(markTr);
                        }
                    }
                    view.updateState(newState);
                    if (transaction.docChanged) {
                        onDocChangedRef.current?.();
                        sendPendingSteps(newState);
                    }
                    if (transaction.docChanged || transaction.selectionSet) {
                        sendOwnCursor(newState);
                        onTransactionRef.current?.(view);
                    }
                },
            });

            onReadyRef.current(view);

            function resyncFromServer() {
                if (cancelled) {
                    return;
                }
                fetchCollabState(documentId).then((collabState) => {
                    if (cancelled || !view) {
                        return;
                    }
                    const freshState = EditorState.create({
                        doc: editorSchema.nodeFromJSON(collabState.content),
                        plugins: buildPlugins(editorSchema, { version: collabState.version, clientID }),
                    });
                    view.updateState(freshState);
                    if (ownIdentityId) {
                        sendOwnCursor(freshState);
                    }
                });
            }

            socket.connect(documentId, displayName, sessionStorage.getItem(IDENTITY_STORAGE_KEY), {
                onIdentified(message) {
                    sessionStorage.setItem(IDENTITY_STORAGE_KEY, message.identity.id);
                    socket.identifyAs(message.identity.id);
                    ownIdentityId = message.identity.id;
                    ownIdentity = message.identity;
                    if (view) {
                        sendOwnCursor(view.state);
                    }
                },
                onReconnected: resyncFromServer,
                onNewSteps(message) {
                    if (!view) {
                        return;
                    }
                    try {
                        const steps = message.steps.map((step) => Step.fromJSON(editorSchema, step));
                        const tr = receiveTransaction(view.state, steps, message.clientIDs).setMeta(
                            ATTRIBUTION_META,
                            message.authors,
                        );
                        view.dispatch(tr);
                    } catch {
                        // Steps that don't cleanly apply mean a structural edit
                        // (e.g. concurrent table row edits) diverged the local
                        // doc from the server's — the server never validates
                        // steps against a schema (see collab_service.py), so
                        // this can't be prevented, only recovered from by
                        // dropping the stale local doc and pulling fresh state.
                        resyncFromServer();
                    }
                },
                onRebaseRequired(message) {
                    if (!view) {
                        return;
                    }
                    try {
                        const steps = message.steps.map((step) => Step.fromJSON(editorSchema, step));
                        const tr = receiveTransaction(view.state, steps, message.clientIDs).setMeta(
                            ATTRIBUTION_META,
                            message.authors,
                        );
                        const needsExplicitResend = !tr.docChanged;
                        view.dispatch(tr);
                        if (needsExplicitResend) {
                            sendPendingSteps(view.state);
                        }
                    } catch {
                        resyncFromServer();
                    }
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
