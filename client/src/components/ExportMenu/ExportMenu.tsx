import { useState } from "react";
import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Snackbar } from "@mui/material";
import ArticleIcon from "@mui/icons-material/Article";
import DescriptionIcon from "@mui/icons-material/Description";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import type { EditorView } from "prosemirror-view";
import { useExportDocxMutation, useExportPdfMutation } from "../../services/document";
import { exportMarkdown } from "../../utils/markdownExport";
import { ExportAlert } from "./ExportMenu.style";

export interface ExportMenuProps {
    view: EditorView | null;
}

const ExportMenu = ({ view }: ExportMenuProps) => {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [exportPdf] = useExportPdfMutation();
    const [exportDocx] = useExportDocxMutation();

    const close = () => setAnchorEl(null);

    const handleMarkdown = () => {
        if (view) {
            exportMarkdown(view.state.doc);
        }
        close();
    };

    const handlePdf = async () => {
        close();
        if (!view) {
            return;
        }
        try {
            await exportPdf(view.state.doc.toJSON()).unwrap();
        } catch {
            setError("PDF export isn't available yet — the backend service hasn't been built.");
        }
    };

    const handleDocx = async () => {
        close();
        if (!view) {
            return;
        }
        try {
            await exportDocx(view.state.doc.toJSON()).unwrap();
        } catch {
            setError("DOCX export isn't available yet — the backend service hasn't been built.");
        }
    };

    return (
        <>
            <IconButton aria-label="Export document" onClick={(event) => setAnchorEl(event.currentTarget)}>
                <MoreVertIcon />
            </IconButton>
            <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={close}>
                <MenuItem onClick={handleMarkdown}>
                    <ListItemIcon>
                        <DescriptionIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Export as Markdown</ListItemText>
                </MenuItem>
                <MenuItem onClick={handlePdf}>
                    <ListItemIcon>
                        <PictureAsPdfIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Export as PDF</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleDocx}>
                    <ListItemIcon>
                        <ArticleIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Export as DOCX</ListItemText>
                </MenuItem>
            </Menu>
            <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError(null)}>
                <ExportAlert severity="info" onClose={() => setError(null)}>
                    {error}
                </ExportAlert>
            </Snackbar>
        </>
    );
};

export default ExportMenu;
