export type CollabIdentity = {
    id: string;
    displayName: string;
    color: string;
};

export type CollabStateResponse = {
    id: string;
    title: string;
    content: Record<string, unknown>;
    version: number;
};

export type ClientToServerMessage =
    | { type: "identify"; displayName: string; identityId: string | null }
    | { type: "submit_steps"; version: number; steps: unknown[]; clientID: string; docJSON: Record<string, unknown> }
    | { type: "cursor"; from: number; to: number };

export type ServerToClientMessage =
    | { type: "identified"; identity: CollabIdentity }
    | { type: "submit_ack"; version: number }
    | { type: "rebase_required"; steps: unknown[]; clientIDs: string[]; authors: CollabIdentity[]; version: number }
    | { type: "new_steps"; steps: unknown[]; clientIDs: string[]; authors: CollabIdentity[]; version: number }
    | { type: "cursor_update"; identity: CollabIdentity; from: number; to: number }
    | { type: "cursor_left"; identityId: string };
