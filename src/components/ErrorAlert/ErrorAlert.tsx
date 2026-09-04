'use client';

import { Alert } from '@heroui/react';
import { FC, ReactNode } from 'react';

type Props = {
    title: string;
    description: ReactNode;
    /** Optional recovery control rendered after the text. */
    action?: ReactNode;
    status?: 'danger' | 'warning';
    /** "alert" interrupts (a crash); "status" waits its turn (a failed fetch). */
    role?: 'alert' | 'status';
    className?: string;
};

/** The explorer's one error alert: failed fetches, pane crashes, and the route fallback all render it. */
const ErrorAlert: FC<Props> = ({ title, description, action, status = 'danger', role = 'alert', className }) => (
    <Alert status={status} role={role} className={className}>
        <Alert.Indicator />
        <Alert.Content>
            <Alert.Title>{title}</Alert.Title>
            <Alert.Description>{description}</Alert.Description>
        </Alert.Content>
        {action}
    </Alert>
);

export default ErrorAlert;
