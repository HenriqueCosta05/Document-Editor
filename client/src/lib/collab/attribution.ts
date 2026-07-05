import type { EditorState, Transaction } from "prosemirror-state";
import type { CollabIdentity } from "../../@types/collab";
import { editorSchema } from "../schemas/editor.schema";

// Transaction meta key carrying the per-step author for transactions built
// from remote steps (receiveTransaction). Absent for locally-typed
// transactions, which are attributed to the local identity instead.
export const ATTRIBUTION_META = "attributionAuthors";

// Builds a transaction that marks every range `transaction`'s steps inserted
// with an `edited_by` mark for that step's author, so authorship survives in
// the doc JSON (and therefore reloads/history) rather than living only in
// ephemeral state. Returns null if nothing needs marking.
//
// `resultState` must already reflect `transaction` having been applied
// (i.e. `resultState = priorState.apply(transaction)`) — the returned
// transaction is built from it so the caller can fold it into the same
// state update instead of dispatching a second, separate transaction.
// Dispatching separately here previously caused a duplicate/stale
// `sendPendingSteps` call from the outer dispatchTransaction frame (it
// captured `newState` before this ran), racing an extra step submission
// that the server would reject and echo back as steps the client had
// already applied — corrupting the doc after the first character.
//
// Position mapping follows the standard track-changes technique: a step's
// insertion range is known in the coordinate space right after that step,
// so it's mapped forward through the remaining steps' maps to land in the
// transaction's final doc.
export function buildAttributionTransaction(
    resultState: EditorState,
    transaction: Transaction,
    authors: (CollabIdentity | null)[],
): Transaction | null {
    const markType = editorSchema.marks.edited_by;
    if (!markType) {
        return null;
    }

    const ranges: { from: number; to: number; author: CollabIdentity }[] = [];

    transaction.steps.forEach((step, i) => {
        const author = authors[i];
        if (!author) {
            return;
        }
        step.getMap().forEach((_fromA, _toA, fromB, toB) => {
            if (toB <= fromB) {
                return;
            }
            const from = transaction.mapping.slice(i + 1).map(fromB, -1);
            const to = transaction.mapping.slice(i + 1).map(toB, 1);
            if (to > from) {
                ranges.push({ from, to, author });
            }
        });
    });

    if (ranges.length === 0) {
        return null;
    }

    let tr = resultState.tr;
    ranges.forEach(({ from, to, author }) => {
        tr = tr.addMark(from, to, markType.create({ id: author.id, name: author.displayName, color: author.color }));
    });
    return tr;
}
