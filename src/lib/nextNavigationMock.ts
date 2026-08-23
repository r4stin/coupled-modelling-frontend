/**
 * Minimal next/navigation replacement for tests (aliased in vitest.config.mts):
 * components render outside a Next.js runtime there, where the real hooks throw.
 */
export const useRouter = () => ({
    push: () => {},
    replace: () => {},
    back: () => {},
    forward: () => {},
    refresh: () => {},
    prefetch: () => {},
});

export const usePathname = () => '/';

export const useSearchParams = () => new URLSearchParams();
