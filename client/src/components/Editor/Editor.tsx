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
    // "saving" once the server has durably ordered+logged the steps
    // (submit_ack), "saved" once it has actually flushed the content
    // snapshot to sqlite after the idle debounce (content_saved) — see
    // FLUSH_DEBOUNCE_SECONDS server-side.
    onSaveStateChange?: (status: "saving" | "saved") => void;
}

const IDENTITY_STORAGE_KEY = "documenter.collabIdentityId";

// How often remote cursor decorations are re-evaluated to drop ones that
// have gone stale (Google Docs-style fade when a collaborator stops
// interacting, or a tab disappears without a clean disconnect).
const CURSOR_PRUNE_TICK_MS = 1000;

// Steps are sent on a debounce, not per keystroke: sendableSteps() returns
// the full cumulative unconfirmed batch until it's acked, so firing on
// every transaction sends overlapping batches against a version the server
// hasn't acked yet, and fast typing stalls sync out. Waiting for the user
// to pause collapses a burst into one send.
const SYNC_DEBOUNCE_MS = 2500;

// Cursor position is cheap and carries no version/conflict risk, so it's
// sent immediately on every transaction rather than riding the step
// debounce — that's what keeps remote presence feeling live while a
// collaborator is mid-burst and their steps haven't landed yet.

// Incoming step batches (built up during the sender's SYNC_DEBOUNCE_MS
// pause) are applied one step at a time on this interval instead of in a
// single dispatch, so a burst plays back like live typing instead of
// popping in all at once.
const STREAM_STEP_DELAY_MS = 60;

const Editor = ({ documentId, displayName, onReady, onDocChanged, onTransaction, onSaveStateChange }: EditorProps) => {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const onReadyRef = useRef(onReady);
    const onDocChangedRef = useRef(onDocChanged);
    const onTransactionRef = useRef(onTransaction);
    const onSaveStateChangeRef = useRef(onSaveStateChange);

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
        onSaveStateChangeRef.current = onSaveStateChange;
    }, [onSaveStateChange]);

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
        let cursorPruneTimer: number | null = null;
        let syncDebounceTimer: number | null = null;

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

        function scheduleStepSync() {
            if (syncDebounceTimer !== null) {
                window.clearTimeout(syncDebounceTimer);
            }
            syncDebounceTimer = window.setTimeout(() => {
                syncDebounceTimer = null;
                if (!view) {
                    return;
                }
                sendPendingSteps(view.state);
            }, SYNC_DEBOUNCE_MS);
        }

        function streamIncomingSteps(steps: Step[], clientIDs: (string | number)[], authors: (CollabIdentity | null)[]) {
            let index = 0;

            function applyNext() {
                if (cancelled || !view || index >= steps.length) {
                    return;
                }
                try {
                    const tr = receiveTransaction(view.state, [steps[index]], [clientIDs[index]]).setMeta(
                        ATTRIBUTION_META,
                        [authors[index]],
                    );
                    view.dispatch(tr);
                } catch {
                    // See onNewSteps: a step that doesn't cleanly apply means
                    // the local doc has diverged from the server's — recover
                    // by pulling fresh state instead of continuing to stream.
                    resyncFromServer();
                    return;
                }
                index += 1;
                if (index < steps.length) {
                    window.setTimeout(applyNext, STREAM_STEP_DELAY_MS);
                }
            }

            applyNext();
        }

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
                    }
                    if (transaction.docChanged || transaction.selectionSet) {
                        onTransactionRef.current?.(view);
                        sendOwnCursor(newState);
                    }
                    if (transaction.docChanged) {
                        scheduleStepSync();
                    }
                },
            });

            onReadyRef.current(view);

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
                    const steps = message.steps.map((step) => Step.fromJSON(editorSchema, step));
                    streamIncomingSteps(steps, message.clientIDs, message.authors);
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
                onSubmitAck() {
                    onSaveStateChangeRef.current?.("saving");
                },
                onContentSaved() {
                    onSaveStateChangeRef.current?.("saved");
                },
            });

            cursorPruneTimer = window.setInterval(() => {
                if (!view || !(collabCursorKey.getState(view.state)?.size ?? 0)) {
                    return;
                }
                view.dispatch(view.state.tr.setMeta(collabCursorKey, { type: "prune", now: Date.now() }));
            }, CURSOR_PRUNE_TICK_MS);
        });

        return () => {
            cancelled = true;
            if (cursorPruneTimer !== null) {
                window.clearInterval(cursorPruneTimer);
            }
            if (syncDebounceTimer !== null) {
                window.clearTimeout(syncDebounceTimer);
            }
            socket.disconnect();
            view?.destroy();
        };
    }, [documentId, displayName]);

    return <EditorSurface ref={mountRef} />;
};

export default Editor;
