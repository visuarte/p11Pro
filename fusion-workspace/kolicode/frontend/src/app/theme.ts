import { applyTheme as applyOriginalTheme, resolveInitialTheme as resolveOriginalTheme } from './createApp';

// We are going to re-export them for now, but we might want to change the implementation.
// However, note that the original createApp.ts also had other functions that we are not using.
// We are only using the theme functions.

export { applyOriginalTheme as applyTheme, resolveOriginalTheme as resolveInitialTheme };