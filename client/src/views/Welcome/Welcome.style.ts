import { Box, Stack } from "@mui/material";
import { styled } from "@mui/material/styles";

export const WelcomeBackdrop = styled(Stack, { name: "WelcomeView", slot: "backdrop" })(({ theme }) => ({
    minHeight: "100vh",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing(4),
    backgroundColor: theme.palette.background.default,
}));

export const WelcomeCard = styled(Stack, { name: "WelcomeView", slot: "card" })(({ theme }) => ({
    width: "100%",
    maxWidth: 1040,
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    overflow: "hidden",
}));

export const WelcomeTopBar = styled(Stack, { name: "WelcomeView", slot: "topBar" })(({ theme }) => ({
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing(2, 3),
    borderBottom: `1px solid ${theme.palette.divider}`,
}));

export const WelcomeBody = styled(Stack, { name: "WelcomeView", slot: "body" })(({ theme }) => ({
    flexDirection: "row",
    [theme.breakpoints.down("sm")]: {
        flexDirection: "column",
    },
}));

export const WelcomePanel = styled(Box, { name: "WelcomeView", slot: "panel" })(({ theme }) => ({
    flex: "0 0 40%",
    padding: theme.spacing(4),
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRight: `1px solid ${theme.palette.divider}`,
    [theme.breakpoints.down("sm")]: {
        borderRight: "none",
        borderBottom: `1px solid ${theme.palette.divider}`,
    },
}));

export const WelcomeIllustration = styled(Box, { name: "WelcomeView", slot: "illustration" })(({ theme }) => ({
    width: "100%",
    aspectRatio: "4 / 3",
    borderRadius: theme.shape.borderRadius,
    background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.background.default} 100%)`,
    border: `1px solid ${theme.palette.divider}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
}));

export const WelcomeContent = styled(Stack, { name: "WelcomeView", slot: "content" })(({ theme }) => ({
    flex: 1,
    padding: theme.spacing(4),
    gap: theme.spacing(3),
}));

export const WelcomeStep = styled(Stack, { name: "WelcomeView", slot: "step" })(() => ({
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
}));

export const WelcomeStepBadge = styled(Box, { name: "WelcomeView", slot: "stepBadge" })(({ theme }) => ({
    width: 32,
    height: 32,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    backgroundColor: theme.palette.secondary.main,
    color: theme.palette.secondary.contrastText,
    fontWeight: 600,
}));

export const WelcomeFooter = styled(Stack, { name: "WelcomeView", slot: "footer" })(({ theme }) => ({
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing(2, 3),
    borderTop: `1px solid ${theme.palette.divider}`,
}));
