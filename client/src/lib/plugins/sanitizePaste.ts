import { Plugin } from "prosemirror-state";

// ProseMirror marks its own clipboard HTML with this attribute so paste can
// tell a same-editor copy from external content. Only external HTML gets its
// inline colors stripped — otherwise the source page's light-mode colors
// (e.g. black text on a white background) leak into the editor and become
// unreadable/invisible in dark mode, while our own color/highlight marks
// (also carried as inline styles) would otherwise be stripped too on a
// plain copy-paste within the editor.
const PM_SLICE_MARKER = "data-pm-slice";

function stripForeignColors(html: string): string {
    const container = document.createElement("div");
    container.innerHTML = html;

    container.querySelectorAll<HTMLElement>("[style]").forEach((element) => {
        element.style.removeProperty("color");
        element.style.removeProperty("background-color");
        element.style.removeProperty("background");
    });
    container.querySelectorAll("font[color]").forEach((element) => element.removeAttribute("color"));
    container.querySelectorAll("[bgcolor]").forEach((element) => element.removeAttribute("bgcolor"));

    return container.innerHTML;
}

export function sanitizePastedHtmlPlugin() {
    return new Plugin({
        props: {
            transformPastedHTML(html) {
                return html.includes(PM_SLICE_MARKER) ? html : stripForeignColors(html);
            },
        },
    });
}
