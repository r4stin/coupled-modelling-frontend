import { FC, ReactNode } from 'react';

type Props = {
    /** The `<path>`/`<circle>` elements of a 24×24 stroke icon. */
    children: ReactNode;
    className?: string;
};

const Icon: FC<Props> = ({ children, className = 'size-4' }) => (
    <svg aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        {children}
    </svg>
);

export default Icon;
