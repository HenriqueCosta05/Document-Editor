import { Stack } from "@mui/material";
import { styled } from "@mui/material/styles";

export const ToolbarSurface = styled(Stack, { name: "EditorToolbar", slot: "root" })(({ theme }) => ({
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: theme.spacing(0.5),
    padding: theme.spacing(1),
    border: `1px solid ${theme.palette.divider}`,
    borderBottom: "none",
    borderTopLeftRadius: theme.shape.borderRadius,
    borderTopRightRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.paper,
}));
