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
