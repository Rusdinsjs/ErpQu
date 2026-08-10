import React, { useState, useEffect } from 'react';
import { Plus, X, Calculator } from 'lucide-react';
import { Button, Input, Modal, DateInput, Select, Textarea, Checkbox } from '../ui';
import { getDocTypeSchema } from '../../config/docTypeFormSchemas';
import type { DocTypeSchema, FormField } from '../../config/docTypeFormSchemas';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    moduleName: 'Selling' | 'Buying' | 'Stock';
    onSave?: (formData: any) => void;
}

export function DocTypeFormModal({ isOpen, onClose, title, moduleName, onSave }: Props) {
    const schema: DocTypeSchema = getDocTypeSchema(title, moduleName);

    // Dynamic Form State
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [tableRows, setTableRows] = useState<Record<string, any[]>>({});
    const [dynamicOptions, setDynamicOptions] = useState<Record<string, string[]>>({});

    // Quick Create Nested Modal State
    const [quickCreateModal, setQuickCreateModal] = useState<{
        isOpen: boolean;
        targetLink: string;
        fieldName: string;
    }>({ isOpen: false, targetLink: '', fieldName: '' });

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            const initialData: Record<string, any> = {};
            const initialTables: Record<string, any[]> = {};
            const initialOpts: Record<string, string[]> = {};

            (schema?.fields || []).forEach(field => {
                if (field.type === 'Table') {
                    // Initialize default item row
                    const defaultRow: Record<string, any> = {};
                    field.tableColumns?.forEach(col => {
                        defaultRow[col.name] = col.defaultValue ?? (col.type === 'Float' || col.type === 'Currency' ? 0 : '');
                    });
                    initialTables[field.name] = [{ ...defaultRow, id: 1, amount: 0 }];
                } else {
                    initialData[field.name] = field.defaultValue ?? '';
                    if (field.options) {
                        initialOpts[field.name] = field.options;
                    }
                }
            });

            setFormData(initialData);
            setTableRows(initialTables);
            setDynamicOptions(initialOpts);
        }
    }, [isOpen, title, schema]);

    // Handle Form Input Change
    const handleInputChange = (fieldName: string, value: any, targetLink?: string) => {
        if (value === '__CREATE_NEW__' && targetLink) {
            handleOpenQuickCreate(fieldName, targetLink);
            return;
        }
        setFormData(prev => ({ ...prev, [fieldName]: value }));
    };

    // Open Quick Create for linked DocType
    const handleOpenQuickCreate = (fieldName: string, targetLink: string) => {
        setQuickCreateModal({ isOpen: true, targetLink, fieldName });
    };

    // Handle Quick Create Save
    const handleQuickCreateSave = (newRecord: any) => {
        const createdName = newRecord.name || newRecord.customer_name || newRecord.supplier_name || newRecord.item_name || newRecord.profile_name || newRecord.warehouse_name || newRecord.code || `${quickCreateModal.targetLink} Baru`;
        
        // Add to dynamic options for this field
        setDynamicOptions(prev => ({
            ...prev,
            [quickCreateModal.fieldName]: [createdName, ...(prev[quickCreateModal.fieldName] || [])]
        }));

        // Set form field value to newly created record
        setFormData(prev => ({
            ...prev,
            [quickCreateModal.fieldName]: createdName
        }));

        setQuickCreateModal({ isOpen: false, targetLink: '', fieldName: '' });
    };

    // Handle Child Table Cell Change
    const handleTableCellChange = (tableName: string, rowIndex: number, colName: string, value: any) => {
        setTableRows(prev => {
            const currentRows = [...(prev[tableName] || [])];
            const targetRow = { ...currentRows[rowIndex], [colName]: value };

            // Auto-calculate amount = qty * rate if both exist
            if ('qty' in targetRow && 'rate' in targetRow) {
                const qty = parseFloat(targetRow.qty) || 0;
                const rate = parseFloat(targetRow.rate) || 0;
                targetRow.amount = qty * rate;
            }

            currentRows[rowIndex] = targetRow;
            return { ...prev, [tableName]: currentRows };
        });
    };

    // Add Row to Child Table
    const handleAddRow = (tableName: string, columns?: FormField[]) => {
        setTableRows(prev => {
            const currentRows = [...(prev[tableName] || [])];
            const newRow: Record<string, any> = { id: Date.now() };

            columns?.forEach(col => {
                newRow[col.name] = col.defaultValue ?? (col.type === 'Float' || col.type === 'Currency' ? 0 : '');
            });
            newRow.amount = 0;

            return { ...prev, [tableName]: [...currentRows, newRow] };
        });
    };

    // Delete Row from Child Table
    const handleDeleteRow = (tableName: string, rowIndex: number) => {
        setTableRows(prev => {
            const currentRows = [...(prev[tableName] || [])];
            if (currentRows.length > 1) {
                currentRows.splice(rowIndex, 1);
            }
            return { ...prev, [tableName]: currentRows };
        });
    };

    // Calculate Table Subtotal
    const calculateSubtotal = (tableName: string): number => {
        const rows = tableRows[tableName] || [];
        return rows.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...formData,
            ...tableRows,
            doctype: title,
            naming_series: schema.namingSeriesPrefix
        };

        if (onSave) {
            onSave(payload);
        }
        onClose();
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={`Buat ${schema.title}`} size="xl">
                <form onSubmit={handleFormSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto pr-1">
                    {/* Header Metadata Fields (2-Column Grid matching Image 1 Left) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(schema?.fields || []).filter(f => f.type !== 'Table' && f.type !== 'Text').map((field) => {
                            const fieldOptions = dynamicOptions[field.name] || field.options || [];

                            return (
                                <div key={field.name} className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground/80 block">
                                        {field.label} {field.required && <span className="text-red-500">*</span>}
                                    </label>

                                    {field.type === 'Select' || field.targetLink ? (
                                        <Select
                                            value={formData[field.name] || ''}
                                            onChange={(val) => handleInputChange(field.name, val, field.targetLink)}
                                            className="w-full bg-background border border-border/80 rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                                        >
                                            <option value="">-- Pilih {field.label} --</option>
                                            {field.targetLink && (
                                                <option value="__CREATE_NEW__" className="font-bold text-primary">
                                                    + Create a new {field.targetLink}
                                                </option>
                                            )}
                                            {fieldOptions.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </Select>
                                    ) : field.type === 'Date' ? (
                                        <DateInput
                                            value={formData[field.name] || ''}
                                            onChange={(dateVal) => handleInputChange(field.name, dateVal ? (dateVal instanceof Date ? dateVal.toISOString().split('T')[0] : dateVal) : '')}
                                            className="w-full bg-background border border-border/80 rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                                        />
                                    ) : field.type === 'Check' ? (
                                        <div className="pt-2">
                                            <Checkbox
                                                checked={Boolean(formData[field.name])}
                                                onChange={(e) => handleInputChange(field.name, e.target.checked)}
                                                label={field.label}
                                            />
                                        </div>
                                    ) : (
                                        <Input
                                            type={field.type === 'Currency' || field.type === 'Float' || field.type === 'Int' ? 'number' : 'text'}
                                            placeholder={field.label}
                                            value={formData[field.name] ?? ''}
                                            onChange={(e) => handleInputChange(field.name, e.target.value)}
                                            readOnly={field.readOnly}
                                            className="w-full bg-background border border-border/80 rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                {/* Child Tables (Item Lines matching Image 1 Left) */}
                {(schema?.fields || []).filter(f => f.type === 'Table').map((tableField) => {
                    const rows = tableRows[tableField.name] || [];
                    const subtotal = calculateSubtotal(tableField.name);

                    return (
                        <div key={tableField.name} className="space-y-3 pt-2">
                            <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                                <h3 className="text-sm font-semibold text-foreground">
                                    {tableField.label}
                                </h3>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAddRow(tableField.name, tableField.tableColumns)}
                                    className="rounded-xl border-border/80 hover:bg-muted font-medium text-xs px-3 py-1.5"
                                >
                                    <Plus size={14} className="mr-1" /> Tambah Baris
                                </Button>
                            </div>

                            <div className="overflow-x-auto border border-border/70 rounded-2xl bg-card shadow-sm">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] font-bold tracking-wider border-b border-border/50">
                                        <tr>
                                            <th className="p-3 w-10 text-center">#</th>
                                            {tableField.tableColumns?.map(col => (
                                                <th key={col.name} className="p-3 font-semibold">{col.label}</th>
                                            ))}
                                            <th className="p-3 w-12 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40 bg-background/50">
                                        {rows.map((row, rIdx) => (
                                            <tr key={rIdx} className="hover:bg-muted/20 transition-colors">
                                                <td className="p-3 text-center font-mono text-muted-foreground font-medium">{rIdx + 1}</td>
                                                {tableField.tableColumns?.map(col => (
                                                    <td key={col.name} className="p-2">
                                                        {col.type === 'Select' ? (
                                                            <Select
                                                                value={row[col.name] || ''}
                                                                onChange={(val) => handleTableCellChange(tableField.name, rIdx, col.name, val)}
                                                                className="w-full bg-background border border-border/70 rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary/20"
                                                            >
                                                                {col.options?.map(o => <option key={o} value={o}>{o}</option>)}
                                                            </Select>
                                                        ) : (
                                                            <Input
                                                                type={col.type === 'Float' || col.type === 'Currency' ? 'number' : 'text'}
                                                                value={row[col.name] ?? ''}
                                                                onChange={(e) => handleTableCellChange(tableField.name, rIdx, col.name, e.target.value)}
                                                                readOnly={col.readOnly}
                                                                className="w-full bg-background border border-border/70 rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary/20"
                                                            />
                                                        )}
                                                    </td>
                                                ))}
                                                <td className="p-2 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteRow(tableField.name, rIdx)}
                                                        className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                        title="Hapus Baris"
                                                    >
                                                        <X size={15} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Subtotal Display */}
                            <div className="flex justify-end pt-2">
                                <div className="px-4 py-2 rounded-xl bg-muted/30 border border-border/40 flex items-center gap-3">
                                    <span className="text-xs text-muted-foreground font-medium">Subtotal Item:</span>
                                    <span className="text-sm font-bold text-foreground">
                                        Rp {subtotal.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Text / Remarks Fields */}
                {(schema?.fields || []).filter(f => f.type === 'Text').map((textField) => (
                    <div key={textField.name} className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground/80 block">
                            {textField.label}
                        </label>
                        <Textarea
                            placeholder={textField.label}
                            value={formData[textField.name] || ''}
                            onChange={(e) => handleInputChange(textField.name, e.target.value)}
                            rows={3}
                            className="w-full bg-background border border-border/80 rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                        />
                    </div>
                ))}

                {/* Action Buttons (Matching Image 1 Left) */}
                <div className="flex justify-end items-center gap-3 pt-4 border-t border-border/60">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="rounded-xl border-border/80 font-medium px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted"
                    >
                        Batal
                    </Button>
                    <Button
                        type="submit"
                        variant="default"
                        className="rounded-xl font-bold px-5 py-2.5 text-sm shadow-md transition-all"
                    >
                        Simpan Dokumen
                    </Button>
                </div>
            </form>
        </Modal>

        {/* Nested Quick Create Modal for Linked DocType */}
        {quickCreateModal.isOpen && (
            <DocTypeFormModal
                isOpen={quickCreateModal.isOpen}
                onClose={() => setQuickCreateModal({ isOpen: false, targetLink: '', fieldName: '' })}
                title={quickCreateModal.targetLink}
                moduleName={moduleName}
                onSave={handleQuickCreateSave}
            />
        )}
    </>
    );
}
