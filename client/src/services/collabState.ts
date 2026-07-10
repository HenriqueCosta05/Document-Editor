import type { CollabStateResponse } from "../@types/collab";

// One-shot bootstrap fetch, not a cached RTK Query endpoint: it runs once
// before the collab socket opens, not on a request/response cadence.
export async function fetchCollabState(documentId: string): Promise<CollabStateResponse> {
    const response = await fetch(`/api/documents/${documentId}/collab-state/`, { cache: "no-store" });
    if (!response.ok) {
        throw new Error(`Failed to load collab state for document ${documentId}: ${response.status}`);
    }
    return response.json() as Promise<CollabStateResponse>;
}
