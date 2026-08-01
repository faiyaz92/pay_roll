# PWA Enable Guideline

## Current Status
- PWA features are disabled intentionally for QA/local testing to avoid cached installs interfering with rapid iteration.
- The disabled blocks are marked with `PWA_ENABLE_NOTE` comments so they can be reactivated without guesswork.

## What Was Disabled
- `src/main.tsx`: the entire PWA bootstrap (dynamic manifest swapping, shortcut handling, install prompts, service worker registration, offline banner helpers). The block is wrapped in a multiline comment directly under the `PWA_ENABLE_NOTE` marker.
- `index.html`: the PWA meta tags and the `<link rel="manifest" />` declaration are enclosed in an HTML comment labelled `PWA_ENABLE_NOTE`.

## How To Re-enable For Production
1. Remove the surrounding comment block in `src/main.tsx` (search for `PWA_ENABLE_NOTE` to locate it) so the PWA bootstrap code runs again.
2. Uncomment the PWA meta tags and manifest link in `index.html` by deleting the HTML comment markers around the block.
3. Clear any previously cached service workers in your browser (Application tab in DevTools) to ensure the freshly restored code registers cleanly.
4. Rebuild and redeploy the app; verify the install banner and offline support behave as expected before shipping.

## Reminder For Future Changes
- When adding new PWA-related logic, wrap it with a nearby `PWA_ENABLE_NOTE` so it is easy to toggle with the rest of the block.
- Keep this file updated if additional steps become necessary to enable or disable the PWA features.
