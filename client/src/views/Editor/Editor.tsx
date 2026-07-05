import { useCallback, useState } from "react";
import { TextField, Typography } from "@mui/material";
import type { EditorView as ProseMirrorEditorView } from "prosemirror-view";
import DocumentEditor from "../../components/Editor/Editor";
import EditorToolbar from "../../components/EditorToolbar/EditorToolbar";
import ExportMenu from "../../components/ExportMenu/ExportMenu";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { setSaveStatus, setTitle } from "../../store/slices/document";
import Welcome from "../Welcome/Welcome";
import { EditorHeader, EditorPage } from "./Editor.style";

const DISPLAY_NAME_STORAGE_KEY = "documenter.displayName";

// TODO: This is a temporary hack to allow the editor to work without a backend. It should be removed once the backend is implemented.
const DOCUMENT_ID = "demo";

const Editor = () => {
    const dispatch = useAppDispatch();
    const title = useAppSelector((state) => state.document.current.title) ?? "Untitled document";
    const saveStatus = useAppSelector((state) => state.document.saveStatus);

    const [view, setView] = useState<ProseMirrorEditorView | null>(null);
    const [, setTick] = useState(0);
    const [displayName, setDisplayName] = useState(() => localStorage.getItem(DISPLAY_NAME_STORAGE_KEY));

    const handleReady = useCallback((readyView: ProseMirrorEditorView) => {
        setView(readyView);
    }, []);

    const handleTransaction = useCallback(() => {
        setTick((tick) => tick + 1);
    }, []);

    const handleDocChanged = useCallback(() => {
        dispatch(setSaveStatus("dirty"));
    }, [dispatch]);

    const handleWelcomeSubmit = useCallback((name: string) => {
        localStorage.setItem(DISPLAY_NAME_STORAGE_KEY, name);
        setDisplayName(name);
    }, []);

    if (!displayName) {
        return <Welcome onSubmit={handleWelcomeSubmit} />;
    }

    return (
        <EditorPage>
            <EditorHeader>
                <TextField
                    variant="standard"
                    value={title}
                    onChange={(event) => dispatch(setTitle(event.target.value))}
                    slotProps={{ input: { disableUnderline: true, sx: { fontSize: "1.25rem", fontWeight: 600 } } }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                    {saveStatus}
                </Typography>
                <ExportMenu view={view} />
            </EditorHeader>
            <EditorToolbar view={view} />
            <DocumentEditor
                documentId={DOCUMENT_ID}
                displayName={displayName}
                onReady={handleReady}
                onDocChanged={handleDocChanged}
                onTransaction={handleTransaction}
            />
        </EditorPage>
    );
};

export default Editor;
