import type { Node as ProseMirrorNode } from "prosemirror-model";
import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import type { CollabIdentity } from "../../@types/collab";

export type RemoteCursor = {
    identity: CollabIdentity;
    from: number;
    to: number;
    lastSeen: number;
};

type RemoteCursors = Map<string, RemoteCursor>;

type CursorMeta =
    | { type: "update"; identity: CollabIdentity; from: number; to: number }
    | { type: "remove"; identityId: string }
    | { type: "prune"; now: number };

// A remote cursor that hasn't moved or re-broadcast in this long is
// considered stale and dropped — either the collaborator stopped
// interacting (Google Docs fades the cursor label the same way) or their
// tab went away without a clean disconnect (no cursor_left message).
const CURSOR_STALE_AFTER_MS = 6000;

export const collabCursorKey = new PluginKey<RemoteCursors>("collabCursor");

function buildDecorations(doc: ProseMirrorNode, cursors: RemoteCursors): DecorationSet {
    const decorations: Decoration[] = [];

    cursors.forEach((cursor) => {
        const from = Math.max(0, Math.min(cursor.from, doc.content.size));
        const to = Math.max(0, Math.min(cursor.to, doc.content.size));

        if (to > from) {
            decorations.push(
                Decoration.inline(from, to, { style: `background-color: ${cursor.identity.color}33` }),
            );
        }

        decorations.push(
            Decoration.widget(to, () => {
                const caret = document.createElement("span");
                caret.style.borderLeft = `2px solid ${cursor.identity.color}`;
                caret.style.marginLeft = "-1px";
                caret.style.paddingLeft = "1px";
                caret.title = cursor.identity.displayName;
                return caret;
            }),
        );
    });

    return DecorationSet.create(doc, decorations);
}

export function collabCursorPlugin(): Plugin<RemoteCursors> {
    return new Plugin<RemoteCursors>({
        key: collabCursorKey,
        state: {
            init(): RemoteCursors {
                return new Map();
            },
            apply(tr, cursors): RemoteCursors {
                let next = cursors;

                if (tr.docChanged) {
                    next = new Map(
                        Array.from(next.entries()).map(([id, cursor]) => [
                            id,
                            { ...cursor, from: tr.mapping.map(cursor.from), to: tr.mapping.map(cursor.to) },
                        ]),
                    );
                }

                const meta = tr.getMeta(collabCursorKey) as CursorMeta | undefined;
                if (meta?.type === "update") {
                    next = new Map(next);
                    next.set(meta.identity.id, { identity: meta.identity, from: meta.from, to: meta.to, lastSeen: Date.now() });
                } else if (meta?.type === "remove") {
                    next = new Map(next);
                    next.delete(meta.identityId);
                } else if (meta?.type === "prune") {
                    const fresh = Array.from(next.entries()).filter(
                        ([, cursor]) => meta.now - cursor.lastSeen < CURSOR_STALE_AFTER_MS,
                    );
                    if (fresh.length !== next.size) {
                        next = new Map(fresh);
                    }
                }

                return next;
            },
        },
        props: {
            decorations(state) {
                return buildDecorations(state.doc, collabCursorKey.getState(state) ?? new Map());
            },
        },
    });
}
