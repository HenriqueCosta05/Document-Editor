import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";

export const EditorSurface = styled(Box, { name: "EditorSurface", slot: "root" })(({ theme }) => ({
    minHeight: "60vh",
    padding: theme.spacing(2),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    "& .ProseMirror": {
        outline: "none",
    },
    "& table": {
        borderCollapse: "collapse",
        width: "100%",
    },
    "& td, & th": {
        border: `1px solid ${theme.palette.divider}`,
        padding: theme.spacing(0.5, 1),
    },
    "& th": {
        backgroundColor: theme.palette.action.hover,
    },
}));
