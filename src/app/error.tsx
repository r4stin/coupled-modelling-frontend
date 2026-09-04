'use client';

import { Button } from '@heroui/react';

import ErrorAlert from '@/components/ErrorAlert/ErrorAlert';

type Props = {
    error: Error & { digest?: string };
    retry: () => void;
};

/** Route-level fallback for errors the pane boundaries do not contain (the shell itself). */
const ExplorerError = ({ error, retry }: Props) => (
    <main className="flex flex-1 items-start p-4">
        <ErrorAlert
            className="w-full"
            title="Something went wrong in the explorer"
            description={error.digest ? `${error.message} (reference ${error.digest})` : error.message}
            action={
                <Button size="sm" variant="ghost" onPress={retry}>
                    Try again
                </Button>
            }
        />
    </main>
);

export default ExplorerError;
