export default defineNuxtConfig({
    compatibilityDate: "2024-07-19",
    modules: [
        "@nuxt/icon",
        "@pinia/nuxt",
        "@unocss/nuxt",
        "@vueuse/nuxt",
    ],
    icon: {
        componentName: "iconify",
    },
});
