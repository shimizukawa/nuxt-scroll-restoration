#
nuxt-scroll-restoration

[![npm version][npm-version-src]][npm-version-href]
[![License][license-src]][license-href]

> A Nuxt 3 module that restores scroll position during browser back navigation and page reloads

日本語 [README-ja.md](README-ja.md)

## License

[Apache 2.0 License](./LICENSE)

<!-- Links -->
[npm-version-src]: https://img.shields.io/npm/v/nuxt-scroll-restoration/latest.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-version-href]: https://npmjs.com/package/nuxt-scroll-restoration
[license-src]: https://img.shields.io/npm/l/nuxt-scroll-restoration.svg?style=flat&colorA=18181B&colorB=28CF8D
[license-href]: https://npmjs.com/package/nuxt-scroll-restoration

## Features

- Remembers and restores scroll positions during SPA page transitions and browser back navigation
- Maintains the same view position after reloading a page during editing or viewing
- Includes delayed scrolling functionality to accommodate dynamically loaded content
- Operates exclusively on the client-side with no impact on server-side operations
- Efficiently manages scroll positions by hooking into the History API

## Limitations

- Requires browser support for the History API (supported by most modern browsers)
- May have difficulty with precise scroll position restoration when dynamic content is loaded with timing issues
- The maximum time for scroll restoration attempts is 3 seconds (default)

## Setup

```bash
npm install nuxt-scroll-restoration
```

Add the module to your `nuxt.config.ts` file:

```ts
export default defineNuxtConfig({
  modules: [
    'nuxt-scroll-restoration'
  ],
  
  // Optional configuration
  scrollRestoration: {
    scrollRestorationTimeoutMs: 3000, // Maximum time to attempt scroll restoration (milliseconds)
    tryToScrollIntervalMs: 50        // Interval between scroll restoration attempts (milliseconds)
  }
})
```

That's it! The module automatically enables scroll position restoration functionality.

## How It Works

This module restores scroll positions using the following mechanism:

1. Disables the browser's standard scroll restoration (`history.scrollRestoration`)
2. Hooks into History state operations to record the current scroll position
3. Attempts to restore the saved scroll position after page transitions
4. Repeatedly tries to restore the scroll position over a period of time to account for dynamically loaded content

### Sequence Diagram

```mermaid
sequenceDiagram
    participant Browser
    participant NuxtApp
    participant HistoryAPI as window.history
    participant DOM

    Browser->>NuxtApp: Load the Nuxt application
    NuxtApp->>HistoryAPI: Set scrollRestoration to "manual"
    Note over HistoryAPI: Disables browser's default scroll restoration.

    NuxtApp->>HistoryAPI: Override pushState and replaceState
    Note over HistoryAPI: Hooks to save scroll positions in state.

    NuxtApp->>NuxtApp: Hook app:mounted
    Note over NuxtApp: Ensures the app is fully mounted before modifying state.

    Browser->>NuxtApp: Trigger navigation (e.g., link click)
    NuxtApp->>HistoryAPI: Call replaceState to save current scroll position
    HistoryAPI->>HistoryAPI: Save __scrollX and __scrollY in state

    Browser->>NuxtApp: Trigger page reload or navigation
    NuxtApp->>NuxtApp: Hook page:finish
    Note over NuxtApp: Restores scroll position after navigation.

    NuxtApp->>HistoryAPI: Check state for saved scroll positions
    alt State contains valid scroll positions
        NuxtApp->>DOM: Attempt to scroll to saved position
        loop Until timeout or successful scroll
            DOM->>DOM: Check if scrolling is possible
        end
    else No valid scroll positions
        NuxtApp->>DOM: Scroll to top (0, 0)
    end

    Browser->>NuxtApp: Trigger popstate event
    NuxtApp->>HistoryAPI: Retrieve state from event
    HistoryAPI->>NuxtApp: Provide saved scroll positions
    NuxtApp->>DOM: Restore scroll position
```

## Development

```bash
# Start the development environment
npm run dev

# Build the package
npm run build

# Run ESLint code checks
npm run lint

# Run TypeScript type checking
npm run typecheck

# Run lint and type checking
npm run check

# Prepare for package publishing (lint, typecheck, build)
npm run prepack

# Build and publish the package
npm run release
```
