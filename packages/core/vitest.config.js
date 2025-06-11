import { defineConfig } from "vitest/config";
import path from "path";
export default defineConfig({
    test: {
        setupFiles: ["./src/test_resources/testSetup.ts"],
        environment: "node",
        globals: true,
        testTimeout: 120000,
        include: ['src/**/*.{test,spec}.ts', 'src/**/runCharacterTests.ts'],
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});
//# sourceMappingURL=vitest.config.js.map