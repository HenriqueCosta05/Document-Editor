import { Divider, MenuItem, Select, type SelectChangeEvent } from "@mui/material";
import CodeIcon from "@mui/icons-material/Code";
import FormatAlignCenterIcon from "@mui/icons-material/FormatAlignCenter";
import FormatAlignJustifyIcon from "@mui/icons-material/FormatAlignJustify";
import FormatAlignLeftIcon from "@mui/icons-material/FormatAlignLeft";
import FormatAlignRightIcon from "@mui/icons-material/FormatAlignRight";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatColorFillIcon from "@mui/icons-material/FormatColorFill";
import FormatColorTextIcon from "@mui/icons-material/FormatColorText";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import ImageIcon from "@mui/icons-material/Image";
import LinkIcon from "@mui/icons-material/Link";
import RedoIcon from "@mui/icons-material/Redo";
import StrikethroughSIcon from "@mui/icons-material/StrikethroughS";
import TableChartIcon from "@mui/icons-material/TableChart";
import UndoIcon from "@mui/icons-material/Undo";
import type { EditorView } from "prosemirror-view";
import { redo, undo } from "prosemirror-history";
import { isAlignActive, isBlockActive, isMarkActive } from "../../lib/commands/activeState";
import { setAlign, setHeading, setParagraph, toggleBlockquote, toggleCodeBlock } from "../../lib/commands/blocks";
import { toggleList } from "../../lib/commands/lists";
import { applyColor, applyMark, toggleLink } from "../../lib/commands/marks";
import { insertImage } from "../../lib/commands/media";
import { insertTable } from "../../lib/commands/table";
import ToolbarButton from "../Toolbar/ToolbarButton/ToolbarButton";
import { ToolbarSurface } from "./EditorToolbar.style";

export interface EditorToolbarProps {
    view: EditorView | null;
}

const HEADING_OPTIONS = [
    { value: "paragraph", label: "Paragraph" },
    { value: "1", label: "Heading 1" },
    { value: "2", label: "Heading 2" },
    { value: "3", label: "Heading 3" },
];

const EditorToolbar = ({ view }: EditorToolbarProps) => {
    if (!view) {
        return null;
    }

    const { state } = view;
    const { schema } = state;
    const currentHeading = schema.nodes.heading;
    const headingLevel = isBlockActive(state, currentHeading) ? String(state.selection.$from.parent.attrs.level) : "paragraph";

    const handleHeadingChange = (event: SelectChangeEvent) => {
        const value = event.target.value;
        if (value === "paragraph") {
            setParagraph(view);
        } else {
            setHeading(view, Number(value));
        }
    };

    return (
        <ToolbarSurface>
            <Select size="small" value={headingLevel} onChange={handleHeadingChange}>
                {HEADING_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                        {option.label}
                    </MenuItem>
                ))}
            </Select>

            <Divider orientation="vertical" flexItem />

            <ToolbarButton
                label="Bold"
                icon={<FormatBoldIcon fontSize="small" />}
                active={isMarkActive(state, schema.marks.strong)}
                onClick={() => applyMark(view, schema.marks.strong)}
            />
            <ToolbarButton
                label="Italic"
                icon={<FormatItalicIcon fontSize="small" />}
                active={isMarkActive(state, schema.marks.em)}
                onClick={() => applyMark(view, schema.marks.em)}
            />
            <ToolbarButton
                label="Underline"
                icon={<FormatUnderlinedIcon fontSize="small" />}
                active={isMarkActive(state, schema.marks.underline)}
                onClick={() => applyMark(view, schema.marks.underline)}
            />
            <ToolbarButton
                label="Strikethrough"
                icon={<StrikethroughSIcon fontSize="small" />}
                active={isMarkActive(state, schema.marks.strike)}
                onClick={() => applyMark(view, schema.marks.strike)}
            />
            <ToolbarButton
                label="Text color"
                icon={<FormatColorTextIcon fontSize="small" />}
                onClick={() => applyColor(view, schema.marks.color, "#000000")}
            />
            <ToolbarButton
                label="Highlight"
                icon={<FormatColorFillIcon fontSize="small" />}
                onClick={() => applyColor(view, schema.marks.highlight, "#ffff00")}
            />
            <ToolbarButton
                label="Link"
                icon={<LinkIcon fontSize="small" />}
                active={isMarkActive(state, schema.marks.link)}
                onClick={() => toggleLink(view)}
            />

            <Divider orientation="vertical" flexItem />

            <ToolbarButton
                label="Align left"
                icon={<FormatAlignLeftIcon fontSize="small" />}
                active={isAlignActive(state, "left")}
                onClick={() => setAlign(view, "left")}
            />
            <ToolbarButton
                label="Align center"
                icon={<FormatAlignCenterIcon fontSize="small" />}
                active={isAlignActive(state, "center")}
                onClick={() => setAlign(view, "center")}
            />
            <ToolbarButton
                label="Align right"
                icon={<FormatAlignRightIcon fontSize="small" />}
                active={isAlignActive(state, "right")}
                onClick={() => setAlign(view, "right")}
            />
            <ToolbarButton
                label="Justify"
                icon={<FormatAlignJustifyIcon fontSize="small" />}
                active={isAlignActive(state, "justify")}
                onClick={() => setAlign(view, "justify")}
            />

            <Divider orientation="vertical" flexItem />

            <ToolbarButton
                label="Bullet list"
                icon={<FormatListBulletedIcon fontSize="small" />}
                active={isBlockActive(state, schema.nodes.bullet_list)}
                onClick={() => toggleList(view, schema.nodes.bullet_list)}
            />
            <ToolbarButton
                label="Numbered list"
                icon={<FormatListNumberedIcon fontSize="small" />}
                active={isBlockActive(state, schema.nodes.ordered_list)}
                onClick={() => toggleList(view, schema.nodes.ordered_list)}
            />
            <ToolbarButton
                label="Blockquote"
                icon={<FormatQuoteIcon fontSize="small" />}
                active={isBlockActive(state, schema.nodes.blockquote)}
                onClick={() => toggleBlockquote(view)}
            />
            <ToolbarButton
                label="Code block"
                icon={<CodeIcon fontSize="small" />}
                active={isBlockActive(state, schema.nodes.code_block)}
                onClick={() => toggleCodeBlock(view)}
            />

            <Divider orientation="vertical" flexItem />

            <ToolbarButton label="Insert table" icon={<TableChartIcon fontSize="small" />} onClick={() => insertTable(view)} />
            <ToolbarButton label="Insert image" icon={<ImageIcon fontSize="small" />} onClick={() => insertImage(view)} />

            <Divider orientation="vertical" flexItem />

            <ToolbarButton label="Undo" icon={<UndoIcon fontSize="small" />} onClick={() => undo(view.state, view.dispatch)} />
            <ToolbarButton label="Redo" icon={<RedoIcon fontSize="small" />} onClick={() => redo(view.state, view.dispatch)} />
        </ToolbarSurface>
    );
};

export default EditorToolbar;
