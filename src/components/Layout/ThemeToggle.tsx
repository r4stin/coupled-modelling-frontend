'use client';

import { Button, useIsHydrated } from '@heroui/react';
import { useTheme } from 'next-themes';

import Icon from '@/components/Icons/Icon';

const ThemeToggle = () => {
    const { resolvedTheme, setTheme } = useTheme();
    // The theme is only known on the client; render the light icon during SSR/hydration.
    const isDark = useIsHydrated() && resolvedTheme === 'dark';

    return (
        <Button
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            isIconOnly
            size="sm"
            variant="ghost"
            onPress={() => setTheme(isDark ? 'light' : 'dark')}
        >
            {isDark ? (
                <Icon>
                    <circle cx="12" cy="12" r="4" />
                    <path
                        d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
                        strokeLinecap="round"
                    />
                </Icon>
            ) : (
                <Icon>
                    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" strokeLinecap="round" strokeLinejoin="round" />
                </Icon>
            )}
        </Button>
    );
};

export default ThemeToggle;
