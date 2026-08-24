'use client';

import { Button, Tooltip } from '@heroui/react';
import { ReactNode } from 'react';
import useSWR from 'swr';

import Icon from '@/components/Icons/Icon';
import { getHealth, healthUrl } from '@/services/backend/health';

const REFRESH_INTERVAL_MS = 30_000;

// Corner glyphs paired with the truncated database cylinder below. Each state
// gets a distinct shape so the status is readable without relying on color.
const CHECK_GLYPH = <path d="m15 18.5 2.5 2.5 5-5.5" strokeLinecap="round" strokeLinejoin="round" />;
const EXCLAMATION_GLYPH = (
    <>
        <path d="M19 13.5v5" strokeLinecap="round" />
        <path d="M19 21.5h.01" strokeLinecap="round" />
    </>
);
const CROSS_GLYPH = <path d="m16 15.5 6 6m0-6-6 6" strokeLinecap="round" />;

const HealthIndicator = () => {
    const { data, error, mutate } = useSWR(healthUrl, getHealth, {
        refreshInterval: REFRESH_INTERVAL_MS,
        // SWR skips interval refreshes while an error is cached (and the global
        // config disables all other recovery paths), so keep retrying at the
        // same cadence to recover automatically once the backend is back.
        shouldRetryOnError: true,
        onErrorRetry: (_error, _key, _config, revalidate, { retryCount }) => {
            setTimeout(() => revalidate({ retryCount }), REFRESH_INTERVAL_MS);
        },
    });

    let statusClassName = 'animate-pulse text-muted';
    let label = 'Checking connection…';
    let glyph: ReactNode = null;
    if (error) {
        statusClassName = 'text-danger';
        label = 'Backend unreachable';
        glyph = CROSS_GLYPH;
    } else if (data?.status === 'ok') {
        statusClassName = 'text-success';
        label = `GraphDB connected · ${data.repository}`;
        glyph = CHECK_GLYPH;
    } else if (data?.status === 'error') {
        statusClassName = 'text-warning';
        label = 'GraphDB unavailable';
        glyph = EXCLAMATION_GLYPH;
    }

    return (
        <Tooltip closeDelay={100} delay={400}>
            <Button aria-label={label} className={statusClassName} isIconOnly size="sm" variant="ghost" onPress={() => mutate()}>
                <Icon className="size-5">
                    {/* Database cylinder with the bottom-right corner left open for the status glyph */}
                    <ellipse cx="12" cy="5" rx="9" ry="3" />
                    <path d="M3 5v14a9 3 0 0 0 12 2.84" strokeLinecap="round" />
                    <path d="M21 5v6.5" strokeLinecap="round" />
                    <path d="M3 12a9 3 0 0 0 11.59 2.87" strokeLinecap="round" />
                    {glyph}
                </Icon>
            </Button>
            <Tooltip.Content showArrow>
                <p>{label}</p>
                <p className="text-muted">Click to refresh</p>
            </Tooltip.Content>
        </Tooltip>
    );
};

export default HealthIndicator;
