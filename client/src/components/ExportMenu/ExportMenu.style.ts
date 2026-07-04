import { Alert } from "@mui/material";
import { styled } from "@mui/material/styles";

export const ExportAlert = styled(Alert, { name: "ExportMenu", slot: "alert" })(({ theme }) => ({
    minWidth: theme.spacing(30),
}));
