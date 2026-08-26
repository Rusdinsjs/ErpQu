import React, { type ReactNode } from 'react';

// Table Root
interface TableProps {
    children: ReactNode;
    className?: string;
    minWidth?: string;
}

export function Table({ children, className = '', minWidth = 'min-w-[750px]' }: TableProps) {
    return (
        <div className="overflow-x-auto rounded-xl border border-border shadow-md w-full">
            <table className={`w-full text-sm ${minWidth} ${className}`}>
                {children}
            </table>
        </div>
    );
}

// Table Head
interface TableHeadProps {
    children: ReactNode;
    className?: string;
}

export function TableHead({ children, className = '' }: TableHeadProps) {
    return (
        <thead className={`bg-muted/50 border-b border-border ${className}`}>
            {children}
        </thead>
    );
}

// Table Body
interface TableBodyProps {
    children: ReactNode;
    className?: string;
}

export function TableBody({ children, className = '' }: TableBodyProps) {
    return <tbody className={`divide-y divide-border/50 ${className}`}>{children}</tbody>;
}

// Table Row
export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
    children: ReactNode;
    onClick?: () => void;
    className?: string;
    style?: React.CSSProperties;
}

export const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
    ({ children, onClick, className = '', style, ...props }, ref) => {
        return (
            <tr
                ref={ref}
                style={style}
                className={`
                    bg-card/30 hover:bg-muted/50 transition-colors
                    ${onClick ? 'cursor-pointer' : ''}
                    ${className}
                `}
                onClick={onClick}
                {...props}
            >
                {children}
            </tr>
        );
    }
);
TableRow.displayName = 'TableRow';

// Table Header Cell
interface TableThProps {
    children: ReactNode;
    className?: string;
    align?: 'left' | 'center' | 'right';
    onClick?: () => void;
}

export function TableTh({ children, className = '', align = 'left', onClick }: TableThProps) {
    const alignClass = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
    };

    return (
        <th
            className={`px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-xs whitespace-nowrap ${alignClass[align]} ${className} ${onClick ? 'cursor-pointer' : ''}`}
            onClick={onClick}
        >
            {children}
        </th>
    );
}

// Table Data Cell
interface TableTdProps {
    children: ReactNode;
    className?: string;
    align?: 'left' | 'center' | 'right';
    colSpan?: number;
}

export function TableTd({ children, className = '', align = 'left', colSpan }: TableTdProps) {
    const alignClass = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
    };

    return (
        <td
            className={`px-4 py-3 text-foreground ${alignClass[align]} ${className}`}
            colSpan={colSpan}
        >
            {children}
        </td>
    );
}

// Empty State
interface TableEmptyProps {
    colSpan: number;
    message?: string;
    description?: ReactNode;
    action?: ReactNode;
}

export function TableEmpty({ colSpan, message = 'No data found', description, action }: TableEmptyProps) {
    return (
        <tr>
            <td colSpan={colSpan} className="px-4 py-12 text-center text-muted-foreground">
                <div className="flex flex-col items-center justify-center space-y-3">
                    <p className="font-medium text-foreground">{message}</p>
                    {description && <p className="text-sm">{description}</p>}
                    {action && <div className="mt-2">{action}</div>}
                </div>
            </td>
        </tr>
    );
}
