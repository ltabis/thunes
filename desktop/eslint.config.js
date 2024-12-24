import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import js from "@eslint/js";
import tseslint from 'typescript-eslint';
import globals from "globals";

export default tseslint.config(
    js.configs.recommended,
    tseslint.configs.recommended,
    {
        files: ['src/**/*.{ts,tsx}'],

        plugins: {
            "react": react,
            "react-hooks": reactHooks,
        },

        rules: {
            ...js.configs.recommended.rules,
            ...react.configs.recommended.rules,
            ...react.configs["jsx-runtime"].rules,
            ...reactHooks.configs.recommended.rules,
        },

        languageOptions: {
            globals: {
                ...globals.browser
            }
        }
    }
);