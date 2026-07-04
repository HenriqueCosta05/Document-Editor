import type { ReactNode } from "react";
import type { IconButtonProps } from "@mui/material";
import { StyledToolbarButton } from "./ToolbarButton.style";

export interface ToolbarButtonProps extends Omit<IconButtonProps, "children"> {
    icon: ReactNode;
    active?: boolean;
    label: string;
}

const ToolbarButton = ({ icon, active = false, label, ...buttonProps }: ToolbarButtonProps) => (
    <StyledToolbarButton size="small" active={active} aria-label={label} title={label} {...buttonProps}>
        {icon}
    </StyledToolbarButton>
);

export default ToolbarButton;
