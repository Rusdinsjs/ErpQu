import React, { useState, useMemo } from 'react';
import {
    Search, Filter, Download, Columns3, RefreshCw, X, FileSpreadsheet,
    FileText, Printer, Check, ChevronDown, LayoutGrid, List
} from 'lucide-react';
import Papa from 'papaparse';

export interface TableColumnOption {
    key: string;
    label: string;
    visible?: boolean;
}

export interface FilterChip {
    id: string;
    label: string;
    value: string;
}

export interface UniversalTableToolbarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    searchPlaceholder?: string;
    
    // Column Visibility
    columns?: TableColumnOption[];
    onToggleColumn?: (key: string) => void;
    
    // View Modes
    viewMode?: 'table' | 'grid';
    onViewModeChange?: (mode: 'table' | 'grid') => void;
    
    // Filter Chips
    activeFilterChips?: FilterChip[];
    onRemoveFilterChip?: (id: string) => void;
    onResetAllFilters?: () => void;
    
    // Exporting
    exportData?: any[];
    exportFilename?: string;
    
    // Additional Actions
    actions?: React.ReactNode;
}

export const UniversalTableToolbar: React.FC<UniversalTableToolbarProps> = ({
    searchQuery,
    onSearchChange,
    searchPlaceholder = 'Cari data...',
    columns = [],
    onToggleColumn,
    viewMode,
    onViewModeChange,
    activeFilterChips = [],
    onRemoveFilterChip,
    onResetAllFilters,
    exportData = [],
    exportFilename = 'export_data',
    actions
}) => {
    const [columnMenuOpen, setColumnMenuOpen] = useState(false);
    const [exportMenuOpen, setExportMenuOpen] = useState(false);

    // Export to CSV using PapaParse
    const handleExportCSV = () => {
        if (!exportData || exportData.length === 0) return;
        const csv = Papa.unparse(exportData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${exportFilename}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setExportMenuOpen(false);
    };

    // Export to Excel-compatible HTML Table
    const handleExportExcel = () => {
        if (!exportData || exportData.length === 0) return;
        const keys = Object.keys(exportData[0]);
        let tableHtml = `<table border="1"><thead><tr>${keys.map(k => `<th>${k}</th>`).join('')}</tr></thead><tbody>`;
        exportData.forEach(row => {
            tableHtml += `<tr>${keys.map(k => `<td>${row[k] ?? ''}</td>`).join('')}</tr>`;
        });
        tableHtml += '</tbody></table>';

        const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${exportFilename}_${new Date().toISOString().slice(0, 10)}.xls`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setExportMenuOpen(false);
    };

    // Print Preview
    const handlePrint = () => {
        window.print();
        setExportMenuOpen(false);
    };

    return (
        <div className="space-y-3">
            {/* Top Row: Search, Columns, Export, View Toggle & Actions */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                {/* Search Input */}
                <div className="relative flex-1 w-full max-w-md">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 bg-muted/40 border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => onSearchChange('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Controls Group */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                    {/* View Mode Toggle */}
                    {onViewModeChange && viewMode && (
                        <div className="flex bg-muted/40 p-1 rounded-xl border border-border/40">
                            <button
                                type="button"
                                onClick={() => onViewModeChange('table')}
                                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                title="Tampilan Tabel"
                            >
                                <List size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => onViewModeChange('grid')}
                                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                title="Tampilan Kartu / Grid"
                            >
                                <LayoutGrid size={16} />
                            </button>
                        </div>
                    )}

                    {/* Column Visibility Selector */}
                    {columns.length > 0 && onToggleColumn && (
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => {
                                    setColumnMenuOpen(!columnMenuOpen);
                                    setExportMenuOpen(false);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-muted/40 border border-border/60 hover:bg-muted/80 text-foreground transition-colors"
                            >
                                <Columns3 size={14} />
                                <span>Kolom</span>
                                <ChevronDown size={12} className="opacity-60" />
                            </button>

                            {columnMenuOpen && (
                                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-card border border-border/80 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                                    <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-1.5 border-b border-border/40 mb-1">
                                        Tampilkan Kolom
                                    </div>
                                    <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar">
                                        {columns.map(col => (
                                            <button
                                                key={col.key}
                                                type="button"
                                                onClick={() => onToggleColumn(col.key)}
                                                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-foreground/80 hover:bg-muted/60 transition-colors"
                                            >
                                                <span>{col.label}</span>
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${col.visible !== false ? 'bg-primary border-primary text-primary-foreground' : 'border-border'}`}>
                                                    {col.visible !== false && <Check size={12} />}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Export Hub Dropdown */}
                    {exportData.length > 0 && (
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => {
                                    setExportMenuOpen(!exportMenuOpen);
                                    setColumnMenuOpen(false);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-muted/40 border border-border/60 hover:bg-muted/80 text-foreground transition-colors"
                            >
                                <Download size={14} />
                                <span>Ekspor</span>
                                <ChevronDown size={12} className="opacity-60" />
                            </button>

                            {exportMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-card border border-border/80 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                                    <button
                                        type="button"
                                        onClick={handleExportExcel}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors text-left"
                                    >
                                        <FileSpreadsheet size={15} className="text-emerald-400" />
                                        <span>Ekspor ke Excel (.xls)</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleExportCSV}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors text-left"
                                    >
                                        <FileText size={15} className="text-cyan-400" />
                                        <span>Ekspor ke CSV (.csv)</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handlePrint}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-colors text-left"
                                    >
                                        <Printer size={15} className="text-primary" />
                                        <span>Cetak Dokumen / PDF</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Additional Custom Actions */}
                    {actions}
                </div>
            </div>

            {/* Active Filter Chips Row */}
            {activeFilterChips.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
                    <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
                        Filter Aktif:
                    </span>
                    {activeFilterChips.map(chip => (
                        <span
                            key={chip.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-medium"
                        >
                            <span>{chip.label}: <strong>{chip.value}</strong></span>
                            {onRemoveFilterChip && (
                                <button
                                    type="button"
                                    onClick={() => onRemoveFilterChip(chip.id)}
                                    className="hover:text-foreground/80 transition-colors"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </span>
                    ))}
                    {onResetAllFilters && (
                        <button
                            type="button"
                            onClick={onResetAllFilters}
                            className="text-xs text-rose-400 hover:text-rose-300 font-medium inline-flex items-center gap-1 ml-1"
                        >
                            <RefreshCw size={12} /> Reset Semua
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
