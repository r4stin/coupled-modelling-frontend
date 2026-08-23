'use client';

import { Button, Chip } from '@heroui/react';
import useSWR from 'swr';

import Icon from '@/components/Icons/Icon';
import { getHealth, healthUrl } from '@/services/backend/health';

const REFRESH_INTERVAL_MS = 30_000;

const HealthBadge = () => {
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

    let color: 'default' | 'success' | 'warning' | 'danger' = 'default';
    let label = 'Checking connection…';
    if (error) {
        color = 'danger';
        label = 'Backend unreachable';
    } else if (data?.status === 'ok') {
        color = 'success';
        label = `GraphDB connected · ${data.repository}`;
    } else if (data?.status === 'error') {
        color = 'warning';
        label = 'GraphDB unavailable';
    }

    return (
        <div className="flex items-center gap-1.5">
            <Chip color={color} size="sm" variant="soft">
                {label}
            </Chip>
            <Button aria-label="Refresh connection status" isIconOnly size="sm" variant="ghost" onPress={() => mutate()}>
                <Icon>
                    <path
                        d="M4 4v6h6M20 20v-6h-6M5.5 10a7 7 0 0 1 12-3.5L20 9M4 15l2.5 2.5A7 7 0 0 0 18.5 14"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </Icon>
            </Button>
        </div>
    );
};

export default HealthBadge;
