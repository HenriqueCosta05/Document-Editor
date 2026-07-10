import { useState } from "react";
import { Button, TextField, Typography } from "@mui/material";
import {
    WelcomeBackdrop,
    WelcomeBody,
    WelcomeCard,
    WelcomeContent,
    WelcomeFooter,
    WelcomeIllustration,
    WelcomePanel,
    WelcomeStep,
    WelcomeStepBadge,
    WelcomeTopBar,
} from "./Welcome.style";
import TopicIcon from '@mui/icons-material/Topic';

export interface WelcomeProps {
    onSubmit: (displayName: string) => void;
}

const FEATURES = [
    "See every teammate's edits appear in your document live",
    "Live cursors and highlights show who's editing what, as it happens",
    "Export your document to PDF or Markdown with a single click",
];

const Welcome = ({ onSubmit }: WelcomeProps) => {
    const [nameDraft, setNameDraft] = useState("");

    const handleSubmit = () => {
        const trimmed = nameDraft.trim();
        if (trimmed) {
            onSubmit(trimmed);
        }
    };

    return (
        <WelcomeBackdrop>
            <WelcomeCard>
                <WelcomeTopBar>
                    <Typography variant="h6">Documenter</Typography>
                </WelcomeTopBar>
                <WelcomeBody>
                    <WelcomePanel>
                        <WelcomeIllustration>
                            <TopicIcon sx={{ fontSize: 200, color: "white" }} />
                        </WelcomeIllustration>
                    </WelcomePanel>
                    <WelcomeContent>
                        <Typography variant="overline" color="text.secondary">
                            Real-time collaborative editing
                        </Typography>
                        <Typography variant="h3">Welcome to Documenter</Typography>
                        {FEATURES.map((feature, index) => (
                            <WelcomeStep key={feature}>
                                <WelcomeStepBadge>{index + 1}</WelcomeStepBadge>
                                <Typography variant="body1">{feature}</Typography>
                            </WelcomeStep>
                        ))}
                        <TextField
                            label="Your name"
                            value={nameDraft}
                            onChange={(event) => setNameDraft(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    handleSubmit();
                                }
                            }}
                            autoFocus
                        />
                        <Button variant="contained" disabled={!nameDraft.trim()} onClick={handleSubmit} sx={{ alignSelf: "flex-start" }}>
                            Get Started
                        </Button>
                    </WelcomeContent>
                </WelcomeBody>
                <WelcomeFooter>
                    <Typography variant="caption" color="text.secondary">
                        Documenter
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Real-time document collaboration
                    </Typography>
                </WelcomeFooter>
            </WelcomeCard>
        </WelcomeBackdrop>
    );
};

export default Welcome;
