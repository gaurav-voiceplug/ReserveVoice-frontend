import type { JSX, ReactNode } from 'react';

interface PageHeaderProps {
    title: string;
    children?: ReactNode;
    subtitle?: string;
}

export default function PageHeader({ title, subtitle, children }: PageHeaderProps): JSX.Element {
    return (
        <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex flex-col gap-1">
                <h1 className="text-slate-900 text-3xl font-black leading-tight tracking-tight">{title}</h1>
                {subtitle && <span className="text-slate-500 text-base font-normal">{subtitle}</span>}
            </div>
            {children && <div>{children}</div>}
        </div>
    );
}
