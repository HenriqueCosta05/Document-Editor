import type { Theme } from "../@types/theme";
import { BaseAPI } from "./base";

type ThemeEndpoints = {
    getTheme: {
        type: "query";
        result: Theme;
        arg?: { id: string };
    };

    setTheme: {
        type: "mutation";
        result: Theme;
        arg: { id: string; theme: Theme };
    };
};

export const themeAPI = BaseAPI<ThemeEndpoints, "theme">(
    {
        baseURL: "/themes/",
        endpoints: [
            {
                name: "getTheme",
                type: "query",
                path: ".json",
            },
            {
                name: "setTheme",
                type: "mutation",
                path: ".json",
            },
        ],
    },
    {
        name: "theme",
    }
)

