import { Stack } from "@mui/material";
import { styled } from "@mui/material/styles";

export const EditorHeader = styled(Stack, { name: "EditorView", slot: "header" })(({ theme }) => ({
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing(1, 2),
    borderBottom: `1px solid ${theme.palette.divider}`,
}));

export const EditorPage = styled(Stack, { name: "EditorView", slot: "root" })(({ theme }) => ({
    maxWidth: 900,
    margin: "0 auto",
    padding: theme.spacing(2),
}));
