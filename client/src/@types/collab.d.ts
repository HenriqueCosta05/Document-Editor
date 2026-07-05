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
    | { type: "submit_steps"; version: number; steps: unknown[]; clientID: string; docJSON: Record<string, unknown> };

export type ServerToClientMessage =
    | { type: "identified"; identity: CollabIdentity }
    | { type: "submit_ack"; version: number }
    | { type: "rebase_required"; steps: unknown[]; clientIDs: string[]; version: number }
    | { type: "new_steps"; steps: unknown[]; clientIDs: string[]; version: number };
