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
            "react-hooks": reactHooks,
        },

        rules: {
            ...reactHooks.configs.recommended.rules,
            "@typescript-eslint/no-unused-vars": "warn",
        },

        languageOptions: {
            globals: {
                ...globals.browser
            }
        }
    }
);