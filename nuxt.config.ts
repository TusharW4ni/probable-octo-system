import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  css: ["~/assets/css/main.css"],
  modules: ["@prisma/nuxt", "@nuxt/ui"],
  vite: {
    plugins: [tailwindcss()],
  },
  runtimeConfig: {
    betterAuthSecret: "",
    emailHost: "",
    emailUser: "",
    emailPass: "",
    emailFrom: "",
    emailFromName: "",

    awsAccessKeyId: "",
    awsSecretAccessKey: "",
    awsRegion: "",

    public: {
      betterAuthUrl: "",
    },
  },
});
