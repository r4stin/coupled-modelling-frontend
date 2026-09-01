import '@testing-library/jest-dom/vitest';

// jsdom lacks these browser APIs; react-resizable-panels needs ResizeObserver
// and next-themes reads matchMedia.
window.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
};
window.matchMedia ??= (query: string) =>
    ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
    }) as MediaQueryList;

// react-aria's virtual focus re-enters act() in jsdom; Vitest fails the run on the uncaught error.
window.addEventListener('error', (event) => {
    if (event.error instanceof Error && event.error.message === 'Should not already be working.') {
        event.preventDefault();
    }
});
