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
};

function resolveWebSocketUrl(documentId: string): string {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}/ws/documents/${documentId}/`;
}

export class CollabSocket {
    private socket: WebSocket | null = null;

    connect(documentId: string, displayName: string, identityId: string | null, handlers: CollabSocketHandlers) {
        const socket = new WebSocket(resolveWebSocketUrl(documentId));
        this.socket = socket;

        socket.addEventListener("open", () => {
            this.send({ type: "identify", displayName, identityId });
        });

        socket.addEventListener("message", (event) => {
            const message = JSON.parse(event.data) as ServerToClientMessage;
            switch (message.type) {
                case "identified":
                    handlers.onIdentified?.(message);
                    break;
                case "submit_ack":
                    handlers.onSubmitAck?.(message);
                    break;
                case "rebase_required":
                    handlers.onRebaseRequired?.(message);
                    break;
                case "new_steps":
                    handlers.onNewSteps?.(message);
                    break;
                case "cursor_update":
                    handlers.onCursorUpdate?.(message);
                    break;
                case "cursor_left":
                    handlers.onCursorLeft?.(message);
                    break;
            }
        });
    }

    sendSteps(version: number, steps: unknown[], clientID: string, docJSON: Record<string, unknown>) {
        this.send({ type: "submit_steps", version, steps, clientID, docJSON });
    }

    sendCursor(from: number, to: number) {
        this.send({ type: "cursor", from, to });
    }

    disconnect() {
        this.socket?.close();
        this.socket = null;
    }

    private send(message: ClientToServerMessage) {
        this.socket?.send(JSON.stringify(message));
    }
}
