import { useCallback, useState } from "react";
import { Button, TextField, Typography } from "@mui/material";
import type { EditorView as ProseMirrorEditorView } from "prosemirror-view";
import DocumentEditor from "../../components/Editor/Editor";
import EditorToolbar from "../../components/EditorToolbar/EditorToolbar";
import ExportMenu from "../../components/ExportMenu/ExportMenu";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { setSaveStatus, setTitle } from "../../store/slices/document";
import { EditorHeader, EditorPage } from "./Editor.style";

const DISPLAY_NAME_STORAGE_KEY = "documenter.displayName";

// No document CRUD exists yet (collab layer only) — the id of the single
// Document row provisioned out-of-band for collab to operate against.
const DOCUMENT_ID = "demo";

const Editor = () => {
    const dispatch = useAppDispatch();
    const title = useAppSelector((state) => state.document.current.title) ?? "Untitled document";
    const saveStatus = useAppSelector((state) => state.document.saveStatus);

    const [view, setView] = useState<ProseMirrorEditorView | null>(null);
    const [, setTick] = useState(0);
    const [displayName, setDisplayName] = useState(() => localStorage.getItem(DISPLAY_NAME_STORAGE_KEY));
    const [nameDraft, setNameDraft] = useState("");

    const handleReady = useCallback((readyView: ProseMirrorEditorView) => {
        setView(readyView);
    }, []);

    const handleTransaction = useCallback(() => {
        setTick((tick) => tick + 1);
    }, []);

    const handleDocChanged = useCallback(() => {
        dispatch(setSaveStatus("dirty"));
    }, [dispatch]);

    if (!displayName) {
        return (
            <EditorPage>
                <EditorHeader>
                    <TextField
                        variant="standard"
                        label="Your name"
                        value={nameDraft}
                        onChange={(event) => setNameDraft(event.target.value)}
                    />
                    <Button
                        variant="contained"
                        disabled={!nameDraft.trim()}
                        onClick={() => {
                            localStorage.setItem(DISPLAY_NAME_STORAGE_KEY, nameDraft.trim());
                            setDisplayName(nameDraft.trim());
                        }}
                    >
                        Start editing
                    </Button>
                </EditorHeader>
            </EditorPage>
        );
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
