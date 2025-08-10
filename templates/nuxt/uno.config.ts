import { defineConfig, presetAttributify, presetWind3, transformerDirectives, transformerVariantGroup } from "unocss";

export default defineConfig({
    presets: [
        presetAttributify(),
        presetWind3({
            dark: "media",
        }),
    ],
    transformers: [
        transformerDirectives(),
        transformerVariantGroup(),
    ],
});
