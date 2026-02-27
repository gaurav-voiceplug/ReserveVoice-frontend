import type { JSX, ReactNode } from 'react';

interface PageHeaderProps {
    title: string;
    children?: ReactNode;
    subtitle?: string;
}

export default function PageHeader({ title, subtitle, children }: PageHeaderProps): JSX.Element {
    return (
        <div className="flex flex-wrap justify-between items-end gap-3 mb-2">
            <div className="flex flex-col gap-1">
                <h1 className="text-[#0e101b] text-4xl font-black leading-tight tracking-[-0.033em]">{title}</h1>
                {subtitle && <span className="text-sm text-[#505795]">{subtitle}</span>}
            </div>
            {children && <div>{children}</div>}
        </div>
    );
}
