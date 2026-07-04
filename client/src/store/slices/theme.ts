import type { Theme } from "@mui/material"
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ThemeSlice = {
    current: Theme | {};
    mode?: "light" | "dark"
}

const initialState: ThemeSlice = {
    current: {},
    mode: "dark"
}

export const themeSlice = createSlice({
    name: "theme",
    initialState,
    reducers: {
        setTheme(state, action: PayloadAction<ThemeSlice>) {
            state.current = action.payload.current
            state.mode = action.payload.mode
        },
        toggleMode(state, action: PayloadAction<Partial<ThemeSlice>>) {
            state.mode = action.payload.mode
        }   
    },
})