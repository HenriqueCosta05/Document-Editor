import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";

const CODE_FONT_FAMILY = '"Roboto Mono", "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace';

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
    "& code": {
        fontFamily: CODE_FONT_FAMILY,
        fontSize: "0.875em",
        backgroundColor: theme.palette.action.hover,
        borderRadius: theme.shape.borderRadius,
        padding: theme.spacing(0.125, 0.5),
    },
    "& pre": {
        fontFamily: CODE_FONT_FAMILY,
        backgroundColor: theme.palette.action.hover,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: theme.shape.borderRadius,
        padding: theme.spacing(1.5),
        overflowX: "auto",
    },
    "& pre code": {
        backgroundColor: "transparent",
        padding: 0,
    },
    "& a": {
        color: theme.palette.primary.main,
        textDecoration: "underline",
        textDecorationColor: theme.palette.primary.light,
        "&:hover": {
            textDecorationColor: theme.palette.primary.main,
        },
    },
}));
