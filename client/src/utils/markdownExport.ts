import type { Node as ProseMirrorNode } from "prosemirror-model";
import { markdownSerializer } from "../lib/serializers/markdown";

export function exportMarkdown(doc: ProseMirrorNode, filename = "document.md") {
    const markdown = markdownSerializer.serialize(doc);
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
}
