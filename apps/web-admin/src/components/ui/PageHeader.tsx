// Standardized PageHeader Component - Pure Tailwind UI Design System
import { type ReactNode } from 'react';

export interface PageHeaderProps {
    title: ReactNode;
    description?: ReactNode;
    action?: ReactNode;
    actions?: ReactNode;
    badge?: ReactNode;
    children?: ReactNode;
    className?: string;
}

export function PageHeader({
    title,
    description,
    action,
    actions,
    badge,
    children,
    className = '',
}: PageHeaderProps) {
    return (
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40 mb-6 ${className}`}>
            <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                        {title}
                    </h1>
                    {badge && (
                        typeof badge === 'string' ? (
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                {badge}
                            </span>
                        ) : (
                            badge
                        )
                    )}
                </div>
                {description && (
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        {description}
                    </p>
                )}
                {children}
            </div>

            {(action || actions) && (
                <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                    {actions}
                    {action}
                </div>
            )}
        </div>
    );
}
