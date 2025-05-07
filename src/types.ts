export interface ScrollRestorationOptions {
  /**
   * Maximum time to attempt scroll restoration (milliseconds)
   * @default 3000
   */
  scrollRestorationTimeoutMs?: number
  
  /**
   * Interval between scroll restoration attempts (milliseconds)
   * @default 50
   */
  tryToScrollIntervalMs?: number

  /**
   * Enable debug mode
   * @default false
   */
  debug?: boolean;
}

declare module '@nuxt/schema' {
  interface PublicRuntimeConfig {
    scrollRestoration?: ScrollRestorationOptions
  }
  
  interface NuxtConfig {
    scrollRestoration?: ScrollRestorationOptions
  }
}

// Export module options type
export type ModuleOptions = ScrollRestorationOptions