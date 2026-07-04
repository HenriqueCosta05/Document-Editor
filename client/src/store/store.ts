import { configureStore } from "@reduxjs/toolkit";
import { themeAPI } from "../services/theme";
import documentReducer from "./slices/document";

export const store = configureStore({
    reducer: {
        [themeAPI.reducerPath]: themeAPI.reducer,
        document: documentReducer
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(themeAPI.middleware)
});