import { BaseAPI, type EndpointTypeMap } from "./base";

// Both routes are pending backend implementation — the server that will
// render PDF/DOCX doesn't exist yet, so these calls are expected to fail
// until it's built. The client-side contract is wired up ahead of time.
type DocumentEndpoints = {
    exportPdf: {
        type: "mutation";
        result: Blob;
        arg: Record<string, unknown>;
        kind: "mutation";
    };
    exportDocx: {
        type: "mutation";
        result: Blob;
        arg: Record<string, unknown>;
        kind: "mutation";
    };
} & EndpointTypeMap;

export const documentAPI = BaseAPI<DocumentEndpoints, "documentExport">(
    {
        baseURL: "/export/",
        endpoints: [
            {
                name: "exportPdf",
                type: "mutation",
                path: "pdf",
            },
            {
                name: "exportDocx",
                type: "mutation",
                path: "docx",
            },
        ],
    },
    {
        name: "documentExport",
    },
);

export const { useExportPdfMutation, useExportDocxMutation } = documentAPI;
