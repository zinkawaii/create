import { defineConfig } from "tsdown";

export default defineConfig({
    entry: [
        "./src/index.ts",
    ],
    outputOptions: {
        banner: "#!/usr/bin/env node",
    },
});
