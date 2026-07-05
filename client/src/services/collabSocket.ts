import type { ClientToServerMessage, ServerToClientMessage } from "../@types/collab";

// Persistent WebSocket connection, not a request/response endpoint — kept
// separate from the RTK Query `BaseAPI` factory used by documentAPI/themeAPI.
export type CollabSocketHandlers = {
    onIdentified?: (message: Extract<ServerToClientMessage, { type: "identified" }>) => void;
    onSubmitAck?: (message: Extract<ServerToClientMessage, { type: "submit_ack" }>) => void;
    onRebaseRequired?: (message: Extract<ServerToClientMessage, { type: "rebase_required" }>) => void;
    onNewSteps?: (message: Extract<ServerToClientMessage, { type: "new_steps" }>) => void;
    onCursorUpdate?: (message: Extract<ServerToClientMessage, { type: "cursor_update" }>) => void;
    onCursorLeft?: (message: Extract<ServerToClientMessage, { type: "cursor_left" }>) => void;
    // Fired after a *dropped* connection reopens (not on the first connect).
    // The doc/version may have moved on while offline, so the caller should
    // re-fetch collab-state and rebuild local editor state from it rather
    // than assume `new_steps` will backfill the gap.
    onReconnected?: () => void;
};

const MAX_RECONNECT_DELAY_MS = 10_000;
const BASE_RECONNECT_DELAY_MS = 500;

function resolveWebSocketUrl(documentId: string): string {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}/ws/documents/${documentId}/`;
}

export class CollabSocket {
    private socket: WebSocket | null = null;
    private manuallyClosed = false;
    private hasConnectedOnce = false;
    private reconnectAttempts = 0;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    private documentId = "";
    private displayName = "";
    private identityId: string | null = null;
    private handlers: CollabSocketHandlers = {};

    connect(documentId: string, displayName: string, identityId: string | null, handlers: CollabSocketHandlers) {
        this.documentId = documentId;
        this.displayName = displayName;
        this.identityId = identityId;
        this.handlers = handlers;
        this.manuallyClosed = false;
        this.openSocket();
    }

    private openSocket() {
        const socket = new WebSocket(resolveWebSocketUrl(this.documentId));
        this.socket = socket;

        socket.addEventListener("open", () => {
            const isReconnect = this.hasConnectedOnce;
            this.hasConnectedOnce = true;
            this.reconnectAttempts = 0;
            this.send({ type: "identify", displayName: this.displayName, identityId: this.identityId });
            if (isReconnect) {
                this.handlers.onReconnected?.();
            }
        });

        socket.addEventListener("message", (event) => {
            const message = JSON.parse(event.data) as ServerToClientMessage;
            switch (message.type) {
                case "identified":
                    this.handlers.onIdentified?.(message);
                    break;
                case "submit_ack":
                    this.handlers.onSubmitAck?.(message);
                    break;
                case "rebase_required":
                    this.handlers.onRebaseRequired?.(message);
                    break;
                case "new_steps":
                    this.handlers.onNewSteps?.(message);
                    break;
                case "cursor_update":
                    this.handlers.onCursorUpdate?.(message);
                    break;
                case "cursor_left":
                    this.handlers.onCursorLeft?.(message);
                    break;
            }
        });

        socket.addEventListener("close", () => {
            if (this.manuallyClosed) {
                return;
            }
            const delay = Math.min(BASE_RECONNECT_DELAY_MS * 2 ** this.reconnectAttempts, MAX_RECONNECT_DELAY_MS);
            this.reconnectAttempts += 1;
            this.reconnectTimer = setTimeout(() => this.openSocket(), delay);
        });
    }

    identifyAs(identityId: string) {
        this.identityId = identityId;
    }

    sendSteps(version: number, steps: unknown[], clientID: string, docJSON: Record<string, unknown>) {
        this.send({ type: "submit_steps", version, steps, clientID, docJSON });
    }

    sendCursor(from: number, to: number) {
        this.send({ type: "cursor", from, to });
    }

    disconnect() {
        this.manuallyClosed = true;
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        this.socket?.close();
        this.socket = null;
    }

    private send(message: ClientToServerMessage) {
        this.socket?.send(JSON.stringify(message));
    }
}
