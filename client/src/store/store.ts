import { configureStore } from "@reduxjs/toolkit";
import { themeAPI } from "../services/theme";
import { documentAPI } from "../services/document";
import documentReducer from "./slices/document";

export const store = configureStore({
    reducer: {
        [themeAPI.reducerPath]: themeAPI.reducer,
        [documentAPI.reducerPath]: documentAPI.reducer,
        document: documentReducer
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(themeAPI.middleware, documentAPI.middleware)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;