import React, { ReactNode } from 'react';
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableEmpty } from './Table';
import { TableSkeleton } from './Skeleton';

export interface DataTableProps {
    isLoading?: boolean;
    skeletonRows?: number;
    skeletonCols?: number;
    isEmpty?: boolean;
    emptyMessage?: string;
    children: ReactNode;
    className?: string;
    minWidth?: string;
}

export const DataTable: React.FC<DataTableProps> = ({
    isLoading = false,
    skeletonRows = 5,
    skeletonCols = 6,
    isEmpty = false,
    emptyMessage = 'Tidak ada data yang ditemukan',
    children,
    className = '',
    minWidth = 'min-w-[750px]',
}) => {
    return (
        <div className={`overflow-x-auto rounded-2xl border border-border/60 bg-card shadow-sm w-full custom-scrollbar ${className}`}>
            {isLoading ? (
                <TableSkeleton rows={skeletonRows} columns={skeletonCols} />
            ) : (
                <table className={`w-full text-sm ${minWidth}`}>
                    {children}
                    {isEmpty && (
                        <TableBody>
                            <TableEmpty colSpan={skeletonCols} message={emptyMessage} />
                        </TableBody>
                    )}
                </table>
            )}
        </div>
    );
};
