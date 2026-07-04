export type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

export type DocumentEntity = {
    id: string;
    title: string;
    content: Record<string, unknown>;
    createdAt?: string;
    updatedAt?: string;
};
