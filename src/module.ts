import { defineNuxtModule, addPlugin, createResolver } from '@nuxt/kit'
import { fileURLToPath } from 'url'
import type { ModuleOptions } from './types'

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-scroll-restoration',
    configKey: 'scrollRestoration',
    compatibility: {
      nuxt: '^3.0.0'
    }
  },
  // Default settings
  defaults: {
    scrollRestorationTimeoutMs: 3000,
    tryToScrollIntervalMs: 50,
    debug: false
  },
  setup (options, nuxt) {
    const { resolve } = createResolver(import.meta.url)
    const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))

    // Add plugin
    addPlugin({
      src: resolve(runtimeDir, 'plugin'),
      mode: 'client' // Run only on client-side
    })

    // Provide configuration values to Nuxt runtime
    nuxt.options.runtimeConfig.public.scrollRestoration = {
      scrollRestorationTimeoutMs: options.scrollRestorationTimeoutMs,
      tryToScrollIntervalMs: options.tryToScrollIntervalMs,
      debug: options.debug
    }
  }
})