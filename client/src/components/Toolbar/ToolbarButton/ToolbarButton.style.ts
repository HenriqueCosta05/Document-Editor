import { IconButton } from "@mui/material";
import { styled } from "@mui/material/styles";

export interface StyledToolbarButtonProps {
    active?: boolean;
}

export const StyledToolbarButton = styled(IconButton, {
    name: "ToolbarButton",
    slot: "root",
    shouldForwardProp: (prop) => prop !== "active",
})<StyledToolbarButtonProps>(({ theme, active }) => ({
    color: active ? theme.palette.primary.main : theme.palette.text.secondary,
    backgroundColor: active ? theme.palette.action.selected : "transparent",
}));
