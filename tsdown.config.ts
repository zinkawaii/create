import { defineConfig } from "tsdown";

export default defineConfig({
    entry: [
        "./src/index.ts"
    ],
    clean: true,
    outputOptions: {
        banner: "#!/usr/bin/env node"
    }
});