import { configureStore } from "@reduxjs/toolkit";
import { themeAPI } from "../services/theme";

export const store = configureStore({
    reducer: {
        [themeAPI.reducerPath]: themeAPI.reducer
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(themeAPI.middleware)
});