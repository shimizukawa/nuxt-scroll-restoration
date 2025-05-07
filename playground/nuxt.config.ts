export default defineNuxtConfig({
  modules: ["../src/module"],
  scrollRestoration: {
    scrollRestorationTimeoutMs: 3000,
    tryToScrollIntervalMs: 50
  },
  devtools: { enabled: true }
});
