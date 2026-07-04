import { useCallback, useState } from "react";
import { TextField, Typography } from "@mui/material";
import type { EditorView as ProseMirrorEditorView } from "prosemirror-view";
import DocumentEditor from "../../components/Editor/Editor";
import EditorToolbar from "../../components/EditorToolbar/EditorToolbar";
import ExportMenu from "../../components/ExportMenu/ExportMenu";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { setSaveStatus, setTitle } from "../../store/slices/document";
import { EditorHeader, EditorPage } from "./Editor.style";

const Editor = () => {
    const dispatch = useAppDispatch();
    const title = useAppSelector((state) => state.document.current.title) ?? "Untitled document";
    const saveStatus = useAppSelector((state) => state.document.saveStatus);

    const [view, setView] = useState<ProseMirrorEditorView | null>(null);
    const [, setTick] = useState(0);

    const handleReady = useCallback((readyView: ProseMirrorEditorView) => {
        setView(readyView);
    }, []);

    const handleTransaction = useCallback(() => {
        setTick((tick) => tick + 1);
    }, []);

    const handleDocChanged = useCallback(() => {
        dispatch(setSaveStatus("dirty"));
    }, [dispatch]);

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
            <DocumentEditor onReady={handleReady} onDocChanged={handleDocChanged} onTransaction={handleTransaction} />
        </EditorPage>
    );
};

export default Editor;
