import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { DocumentEntity, SaveStatus } from "../../@types/document";

export type DocumentSlice = {
    current: Partial<DocumentEntity>;
    saveStatus: SaveStatus;
};

const initialState: DocumentSlice = {
    current: {},
    saveStatus: "idle",
};

export const documentSlice = createSlice({
    name: "document",
    initialState,
    reducers: {
        setDocument(state, action: PayloadAction<DocumentEntity>) {
            state.current = action.payload;
        },
        setTitle(state, action: PayloadAction<string>) {
            state.current = { ...state.current, title: action.payload };
        },
        setSaveStatus(state, action: PayloadAction<SaveStatus>) {
            state.saveStatus = action.payload;
        },
    },
});

export const { setDocument, setTitle, setSaveStatus } = documentSlice.actions;
export default documentSlice.reducer;
