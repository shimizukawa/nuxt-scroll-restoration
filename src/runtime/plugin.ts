/*
A plugin for proper scroll position restoration in SPA (Nuxt).

PURPOSE:
Automatically restore the scroll position during browser back navigation or page reloads,
ensuring users return to the same position they were viewing after a reload during page editing or viewing.
Note: This plugin does not handle textarea scroll restoration.

CONCEPT:
- Store scroll positions in history.state to maintain state during navigation

DESIGN:
- Use history.scrollRestoration = 'manual' to disable standard functionality
- Hook into history.pushState and history.replaceState to record position information in state
- Handle popstate events to restore position information
- Implement a mechanism to repeatedly attempt scrolling until the DOM is fully loaded

LIMITATIONS:
- Requires browser support for the History API
- May have difficulty with accurate scroll position restoration when dynamic content is loaded with timing issues
- Maximum scroll restoration attempt time is 3 seconds

REFERENCES:
- Original code: https://github.com/janpaul123/delayed-scroll-restoration-polyfill/blob/fc3587538df3b257e866e11058a13b88f7ff3a41/index.es6.js
- About conflicts between history.scrollRestoration="auto" and SPAs: https://www.ccdatalab.org/blog/automatic-scroll-restoration-single-page-applications
*/
import { useEventListener } from '@vueuse/core'
import type { NuxtApp } from "#app";
import { defineNuxtPlugin, useRuntimeConfig } from '#app';

type ScrollTarget = {
  x: number;
  y: number;
  latestTimeToTry: number;
};

export default defineNuxtPlugin((nuxtApp: NuxtApp) => {
  if (typeof window === 'undefined' || !("scrollRestoration" in window.history)) {
    console.log("Scroll restoration is not supported in this browser.");
    return {};
  }

  // Get module configuration
  const config = useRuntimeConfig().public.scrollRestoration || {};
  const SCROLL_RESTORATION_TIMEOUT_MS = config.scrollRestorationTimeoutMs || 3000;
  const TRY_TO_SCROLL_INTERVAL_MS = config.tryToScrollIntervalMs || 50;
  const DEBUG = config.debug || false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const debug = (...args: any[]) => {
    if (DEBUG) {
      console.log("ScrollRestorationPlugin", ...args);
    }
  };


  // Set to "manual" to manage scroll restoration in the SPA rather than letting the browser handle it
  // refs: https://developer.mozilla.org/en-US/docs/Web/API/History/scrollRestoration
  window.history.scrollRestoration = "manual";

  // Hook into history.pushState and history.replaceState to adjust scroll position
  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;

  // Variable to hold the state popped by popstate event
  let poppedState: PopStateEvent["state"] = null;
  let isMounted = false;

  // Setup app:mounted hook only once
  nuxtApp.hook("app:mounted", () => {
    debug("app:mounted hook is called");
    isMounted = true;
  });

  // Make sure we don't throw away scroll position when calling "replaceState".
  // Preserve current scroll coordinates by storing them in the most recent state
  window.history.replaceState = function (state, ...otherArgs) {
    debug("replaceState hook is called.", { isMounted });
    if (isMounted) {
      const newState = Object.assign({}, state, {
        __scrollX: window.scrollX,
        __scrollY: window.scrollY
      });
      debug("Storing current scroll position before replace: state -> newState", state, newState );
      originalReplaceState.apply(window.history, [newState, ...otherArgs]);
      debug("stored as", window.history.state);
    } else {
      // replaceState is called before app:mounted due to nuxt-router processing.
      // https://github.com/nuxt/nuxt/blob/fd8b263/packages/nuxt/src/pages/runtime/plugins/router.ts#L226-L232
      // At this point, the scroll coordinates are (0,0), so overwriting with these coordinates would lose our desired scroll position.
      // Therefore, when isMounted is false, we pass the state with position that is stored in most recent state.
      const newState = Object.assign({}, state, {
        __scrollX: window.history.state.__scrollX,
        __scrollY: window.history.state.__scrollY,
      });
      debug("call original replaceState with keeping position.", history.state, state, newState, { windowScrollX: window.scrollX, windowScrollY: window.scrollY });
      originalReplaceState.apply(window.history, [newState, ...otherArgs]);
    }
  };
  
  // Store current scroll position in current state when navigating away.
  // Call our overridden replaceState to save the current scroll position before transitioning
  window.history.pushState = function (...args) {
    debug("pushState hook is called.", window.history.state);
    window.history.replaceState(window.history.state, "");
    originalPushState.apply(window.history, args);
  };

  const onPageFinish = (source: string) => {
    debug("onPageFinish is called from", source);

    // Prioritize state saved from popstate event
    const state = poppedState || window.history.state;
    debug("Restoring scroll position", { poppedState, state: window.history.state});
    poppedState = null; // Clear used poppedState

    if (state &&
      Number.isFinite(state.__scrollX) &&
      Number.isFinite(state.__scrollY)) {

      setTimeout(() => tryToScrollTo({
        x: state.__scrollX,
        y: state.__scrollY,
        latestTimeToTry: Date.now() + SCROLL_RESTORATION_TIMEOUT_MS,
      }));
    } else {
      // Since we set to manual, we need to manually scroll to top
      window.scrollTo(0, 0);
    }
  };

  // Restore scroll position after page reload
  nuxtApp.hook("page:finish", () => onPageFinish("page:finish"));
  // sometime page:finish may not be called, so we also use app:suspense:resolve
  nuxtApp.hook("app:suspense:resolve", () => onPageFinish("app:suspense:resolve"));

  let timeoutHandle: NodeJS.Timeout;
  let scrollBarWidth: number = 0;

  // Try to scroll to the scrollTarget, but only if we can actually scroll
  // there. Otherwise keep trying until we time out, then scroll as far as
  // we can.
  const tryToScrollTo = (scrollTarget: ScrollTarget) => {
    // Stop any previous calls to "tryToScrollTo".
    clearTimeout(timeoutHandle);

    const body = document.body;
    const html = document.documentElement;
    if (!scrollBarWidth) {
      scrollBarWidth = getScrollbarWidth();
    }

    // From http://stackoverflow.com/a/1147768
    const documentWidth = Math.max(body.scrollWidth, body.offsetWidth,
      html.clientWidth, html.scrollWidth, html.offsetWidth);
    const documentHeight = Math.max(body.scrollHeight, body.offsetHeight,
      html.clientHeight, html.scrollHeight, html.offsetHeight);

    if ((documentWidth + scrollBarWidth - window.innerWidth >= scrollTarget.x &&
      documentHeight + scrollBarWidth - window.innerHeight >= scrollTarget.y) ||
      Date.now() > scrollTarget.latestTimeToTry) {
      window.scrollTo(scrollTarget.x, scrollTarget.y);
    } else {
      timeoutHandle = setTimeout(() => tryToScrollTo(scrollTarget),
        TRY_TO_SCROLL_INTERVAL_MS);
    }
  };

  // Try scrolling to the previous scroll position on popstate
  const onPopState = (event: PopStateEvent) => {
    debug("onPopState is called.", event);
    // Use event state coordinates to determine scroll position
    if (event.state &&
      Number.isFinite(event.state.__scrollX) &&
      Number.isFinite(event.state.__scrollY)) {
      poppedState = event.state;
    }
  };

  // store scroll position in history state when navigating away
  function onBeforeUnload() {
    window.history.replaceState(window.history.state, "");
  };

  // Calculating width of browser's scrollbar
  function getScrollbarWidth(): number {
    const outer = document.createElement("div");
    outer.style.visibility = "hidden";
    outer.style.width = "100px";

    document.body.appendChild(outer);

    const widthNoScroll = outer.offsetWidth;
    // force scrollbars
    outer.style.overflow = "scroll";

    // add innerdiv
    const inner = document.createElement("div");
    inner.style.width = "100%";
    outer.appendChild(inner);

    const widthWithScroll = inner.offsetWidth;

    // remove divs
    (outer.parentNode as Node).removeChild(outer);

    return widthNoScroll - widthWithScroll;
  }

  useEventListener("popstate", onPopState, true);
  useEventListener("beforeunload", onBeforeUnload, true);

  return {};
});
