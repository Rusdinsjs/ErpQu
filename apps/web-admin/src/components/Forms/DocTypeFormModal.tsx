import React, { useState, useEffect } from 'react';
import { Plus, X, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { Button, Input, Modal, DateInput, Select, Textarea, Checkbox } from '../ui';
import { getDocTypeSchema } from '../../config/docTypeFormSchemas';
import type { DocTypeSchema, FormField } from '../../config/docTypeFormSchemas';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    moduleName: 'Selling' | 'Buying' | 'Stock' | 'Finance' | 'Assets';
    onSave?: (formData: any) => void;
}

export function DocTypeFormModal({ isOpen, onClose, title, moduleName, onSave }: Props) {
    const schema: DocTypeSchema = getDocTypeSchema(title, moduleName);

    // Full Form Toggle Mode for Supplier & Master DocTypes
    const [isFullForm, setIsFullForm] = useState(false);

    // Navigation Tab state for multi-tab forms
    const [activeTab, setActiveTab] = useState<'details' | 'address' | 'accounting' | 'tax' | 'settings' | 'portal' | 'terms' | 'more'>('details');

    // Expandable Sections state
    const [currencyExpanded, setCurrencyExpanded] = useState(false);
    const [discountExpanded, setDiscountExpanded] = useState(false);

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
            setIsFullForm(false);
            setActiveTab('details');
            setCurrencyExpanded(false);
            setDiscountExpanded(false);

            const initialData: Record<string, any> = {};
            const initialTables: Record<string, any[]> = {};
            const initialOpts: Record<string, string[]> = {};

            (schema?.fields || []).forEach(field => {
                if (field.type === 'Table') {
                    const defaultRow: Record<string, any> = {};
                    field.tableColumns?.forEach(col => {
                        defaultRow[col.name] = col.defaultValue ?? (col.type === 'Float' || col.type === 'Currency' ? 0 : col.type === 'Check' ? true : '');
                    });

                    if (field.name === 'suppliers') {
                        initialTables[field.name] = [
                            { id: 1, supplier_name: 'CV Teknik Jaya Abadi', contact: 'Bpk. Hendra', email_id: 'hendra@teknikjaya.com', send_email: true }
                        ];
                    } else if (field.name === 'items') {
                        initialTables[field.name] = [
                            { id: 1, item_code: 'MAT-PBR-001', schedule_date: new Date().toISOString().split('T')[0], qty: 100, uom: 'Liter', rate: 14500, amount: 1450000, warehouse: 'Gudang Utama - Jakarta' }
                        ];
                    } else {
                        initialTables[field.name] = [{ ...defaultRow, id: 1, amount: 0 }];
                    }
                } else {
                    initialData[field.name] = field.defaultValue ?? '';
                    if (field.options) {
                        initialOpts[field.name] = field.options;
                    }
                }
            });

            // Initialize Accounting Accounts table for Supplier Full Form
            initialTables['company_accounts'] = [];

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

        setDynamicOptions(prev => ({
            ...prev,
            [quickCreateModal.fieldName]: [createdName, ...(prev[quickCreateModal.fieldName] || [])]
        }));

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

            if (columns) {
                columns.forEach(col => {
                    newRow[col.name] = col.defaultValue ?? (col.type === 'Float' || col.type === 'Currency' ? 0 : col.type === 'Check' ? true : '');
                });
            } else if (tableName === 'company_accounts') {
                newRow['company'] = 'SJS Group';
                newRow['default_account'] = '2110.001 - Hutang Usaha Supplier';
                newRow['advance_account'] = '1140.001 - Uang Muka Supplier';
            }
            newRow.amount = 0;

            return { ...prev, [tableName]: [...currentRows, newRow] };
        });
    };

    // Delete Row from Child Table
    const handleDeleteRow = (tableName: string, rowIndex: number) => {
        setTableRows(prev => {
            const currentRows = [...(prev[tableName] || [])];
            if (currentRows.length > 0) {
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

    // Calculate Total Qty
    const calculateTotalQty = (tableName: string): number => {
        const rows = tableRows[tableName] || [];
        return rows.reduce((sum, row) => sum + (parseFloat(row.qty) || 0), 0);
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

    const isRFQ = title.includes('Request for Quotation') || title.includes('RFQ');
    const isSupplierQuotation = title.includes('Supplier Quotation');
    const isSupplierMaster = title.includes('Supplier') && !title.includes('Quotation') && !title.includes('Group') && !title.includes('Scorecard');
    const isMultiTab = isRFQ || isSupplierQuotation || (isSupplierMaster && isFullForm);

    // Financial Totals for Supplier Quotation
    const itemsNetTotal = calculateSubtotal('items');
    const totalQty = calculateTotalQty('items');
    const taxRate = formData['taxes_and_charges_template'] === 'PPN Masukan 11%' ? 0.11 : 0;
    const taxesTotal = itemsNetTotal * taxRate;
    const discountAmount = parseFloat(formData['discount_amount']) || 0;
    const grandTotal = itemsNetTotal + taxesTotal - discountAmount;

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title={isSupplierMaster ? (isFullForm ? "New Supplier" : "New Supplier (Quick Entry)") : `New ${schema.title}`}
                size={isSupplierMaster && !isFullForm ? "lg" : "xl"}
            >

                {/* Top Action Bar (Matching ERPNext Header for Transactional DocTypes or Full Form Supplier) */}
                {(!isSupplierMaster || isFullForm) && (
                    <div className="-mx-6 -mt-4 px-6 py-3 bg-muted/40 border-b border-border/60 flex items-center justify-between text-xs mb-4">
                        <div className="flex items-center gap-3">
                            {!isSupplierMaster && (
                                <>
                                    <span className="text-muted-foreground font-medium">Tindakan Cepat:</span>
                                    <select className="bg-background border border-border/80 rounded-xl px-3 py-1 text-xs text-foreground font-medium">
                                        <option value="">Get Items From :</option>
                                        <option value="material_request">Material Request</option>
                                        <option value="rfq">Request for Quotation</option>
                                    </select>
                                    <Button variant="outline" size="sm" className="rounded-xl border-border/80 text-xs px-3 py-1">
                                        Tools
                                    </Button>
                                </>
                            )}
                            {isSupplierMaster && (
                                <span className="text-xs font-semibold text-muted-foreground">Formulir Penuh Data Supplier (Full Form)</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                Not Saved
                            </span>
                        </div>
                    </div>
                )}

                {/* Tabs Bar for Full Form Supplier & Multi-tab DocTypes (Matching Left Image 1) */}
                {isMultiTab && (
                    <div className="-mx-6 px-6 border-b border-border/60 flex items-center gap-6 bg-muted/20 text-xs mb-4 overflow-x-auto">
                        {(isSupplierMaster ? [
                            { id: 'details', label: 'Details' },
                            { id: 'address', label: 'Address & Contact' },
                            { id: 'accounting', label: 'Accounting' },
                            { id: 'tax', label: 'Tax' },
                            { id: 'settings', label: 'Settings' },
                            { id: 'portal', label: 'Portal Users' },
                            { id: 'more', label: 'More Info' }
                        ] : [
                            { id: 'details', label: 'Details' },
                            { id: 'address', label: 'Address & Contact' },
                            { id: 'terms', label: 'Terms' },
                            { id: 'more', label: 'More Info' }
                        ]).map(tab => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`py-2.5 font-semibold border-b-2 whitespace-nowrap transition-all ${
                                    activeTab === tab.id ? 'border-primary text-primary font-bold' : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                )}

                <form onSubmit={handleFormSubmit} className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">

                    {/* SUPPLIER MASTER QUICK ENTRY FORM (When isFullForm === false) */}
                    {isSupplierMaster && !isFullForm ? (
                        <div className="space-y-5 text-xs">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="font-semibold text-foreground">
                                        Supplier Name <span className="text-rose-500">*</span>
                                    </label>
                                    <Input
                                        type="text"
                                        required
                                        placeholder="Nama resmi Supplier / Vendor..."
                                        value={formData['supplier_name'] || ''}
                                        onChange={(e) => handleInputChange('supplier_name', e.target.value)}
                                        className="w-full bg-background border border-border/80 rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="font-semibold text-foreground">
                                        Supplier Type <span className="text-rose-500">*</span>
                                    </label>
                                    <Select
                                        value={formData['supplier_type'] || 'Company'}
                                        onChange={(val) => handleInputChange('supplier_type', val)}
                                        className="w-full bg-background border border-border/80 rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:ring-2 focus:ring-primary/20"
                                    >
                                        <option value="Company">Company</option>
                                        <option value="Individual">Individual</option>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="font-semibold text-foreground">
                                        Supplier Group <span className="text-rose-500">*</span>
                                    </label>
                                    <Select
                                        value={formData['supplier_group'] || 'Distributor'}
                                        onChange={(val) => handleInputChange('supplier_group', val)}
                                        className="w-full bg-background border border-border/80 rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:ring-2 focus:ring-primary/20"
                                    >
                                        <option value="All Supplier Groups">All Supplier Groups</option>
                                        <option value="Distributor">Distributor</option>
                                        <option value="Manufacturer">Manufacturer</option>
                                        <option value="Services">Services</option>
                                        <option value="Raw Material">Raw Material</option>
                                        <option value="Local">Local</option>
                                        <option value="Hardware">Hardware</option>
                                    </Select>
                                </div>
                            </div>

                            {/* Section: Primary Contact Details */}
                            <div className="pt-3 border-t border-border/60 space-y-3">
                                <h3 className="font-bold text-foreground text-xs uppercase tracking-wider">Primary Contact Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="font-semibold text-muted-foreground">First Name</label>
                                        <Input
                                            type="text"
                                            value={formData['first_name'] || ''}
                                            onChange={(e) => handleInputChange('first_name', e.target.value)}
                                            className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="font-semibold text-muted-foreground">Email Id</label>
                                        <Input
                                            type="email"
                                            value={formData['email_id'] || ''}
                                            onChange={(e) => handleInputChange('email_id', e.target.value)}
                                            className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="font-semibold text-muted-foreground">Last Name</label>
                                        <Input
                                            type="text"
                                            value={formData['last_name'] || ''}
                                            onChange={(e) => handleInputChange('last_name', e.target.value)}
                                            className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="font-semibold text-muted-foreground">Mobile Number</label>
                                        <Input
                                            type="text"
                                            value={formData['mobile_number'] || ''}
                                            onChange={(e) => handleInputChange('mobile_number', e.target.value)}
                                            className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section: Primary Address Details */}
                            <div className="pt-3 border-t border-border/60 space-y-3">
                                <h3 className="font-bold text-foreground text-xs uppercase tracking-wider">Primary Address Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="font-semibold text-muted-foreground">Address Line 1</label>
                                        <Input
                                            type="text"
                                            value={formData['address_line1'] || ''}
                                            onChange={(e) => handleInputChange('address_line1', e.target.value)}
                                            className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="font-semibold text-muted-foreground">City</label>
                                        <Input
                                            type="text"
                                            value={formData['city'] || ''}
                                            onChange={(e) => handleInputChange('city', e.target.value)}
                                            className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="font-semibold text-muted-foreground">Address Line 2</label>
                                        <Input
                                            type="text"
                                            value={formData['address_line2'] || ''}
                                            onChange={(e) => handleInputChange('address_line2', e.target.value)}
                                            className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="font-semibold text-muted-foreground">State/Province</label>
                                        <Input
                                            type="text"
                                            value={formData['state'] || ''}
                                            onChange={(e) => handleInputChange('state', e.target.value)}
                                            className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="font-semibold text-muted-foreground">ZIP Code</label>
                                        <Input
                                            type="text"
                                            value={formData['zip_code'] || ''}
                                            onChange={(e) => handleInputChange('zip_code', e.target.value)}
                                            className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="font-semibold text-muted-foreground">Country</label>
                                        <Select
                                            value={formData['country'] || 'Indonesia'}
                                            onChange={(val) => handleInputChange('country', val)}
                                            className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground"
                                        >
                                            <option value="Indonesia">Indonesia</option>
                                            <option value="Singapore">Singapore</option>
                                            <option value="Japan">Japan</option>
                                            <option value="USA">USA</option>
                                            <option value="China">China</option>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Buttons: Edit Full Form & Save */}
                            <div className="flex justify-between items-center pt-4 border-t border-border/60">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsFullForm(true)}
                                    className="rounded-xl border-border/80 font-semibold px-4 py-2 text-xs text-foreground hover:bg-muted"
                                >
                                    Edit Full Form
                                </Button>
                                <Button
                                    type="submit"
                                    variant="default"
                                    className="rounded-xl font-bold px-6 py-2.5 text-xs shadow-md bg-primary text-primary-foreground hover:bg-primary/90"
                                >
                                    Save
                                </Button>
                            </div>
                        </div>
                    ) : (
                        /* GENERIC & FULL FORM DOCTYPES */
                        <>
                            {activeTab === 'details' && (
                                <div className="space-y-4 text-xs">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {(schema?.fields || []).filter(f =>
                                            f.type !== 'Table' &&
                                            f.type !== 'Text' &&
                                            !['currency', 'buying_price_list', 'tax_category', 'shipping_rule', 'incoterm', 'taxes_and_charges_template', 'apply_discount_on', 'additional_discount_percentage', 'discount_amount', 'disable_rounded_total', 'send_attached_files', 'send_document_print', 'email_template', 'subject', 'message_for_supplier'].includes(f.name)
                                        ).map((field) => {
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
                                                            className="w-full bg-background border border-border/80 rounded-xl px-3.5 py-2 text-xs text-foreground focus:ring-2 focus:ring-primary/20"
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
                                                            className="w-full bg-background border border-border/80 rounded-xl px-3.5 py-2 text-xs text-foreground focus:ring-2 focus:ring-primary/20"
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
                                                            className="w-full bg-background border border-border/80 rounded-xl px-3.5 py-2 text-xs text-foreground focus:ring-2 focus:ring-primary/20"
                                                        />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Child Tables (Item Lines & Suppliers Table) */}
                                    {(schema?.fields || []).filter(f => f.type === 'Table').map((tableField) => {
                                        const rows = tableRows[tableField.name] || [];
                                        const subtotal = calculateSubtotal(tableField.name);

                                        return (
                                            <div key={tableField.name} className="space-y-3 pt-2">
                                                <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                                                    <h3 className="text-sm font-semibold text-foreground">
                                                        {tableField.label}
                                                    </h3>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleAddRow(tableField.name, tableField.tableColumns)}
                                                            className="rounded-xl border-border/80 hover:bg-muted font-medium text-xs px-3 py-1.5"
                                                        >
                                                            <Plus size={14} className="mr-1" /> Add row
                                                        </Button>
                                                        {tableField.name === 'items' && (
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                className="rounded-xl border-border/80 hover:bg-muted font-medium text-xs px-3 py-1.5"
                                                            >
                                                                Add multiple
                                                            </Button>
                                                        )}
                                                    </div>
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
                                                                            ) : col.type === 'Check' ? (
                                                                                <div className="flex justify-center">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        checked={Boolean(row[col.name])}
                                                                                        onChange={(e) => handleTableCellChange(tableField.name, rIdx, col.name, e.target.checked)}
                                                                                        className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                                                                                    />
                                                                                </div>
                                                                            ) : (
                                                                                <Input
                                                                                    type={col.type === 'Float' || col.type === 'Currency' ? 'number' : col.type === 'Date' ? 'date' : 'text'}
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

                                                <div className="flex flex-wrap justify-between items-center p-3 rounded-xl bg-muted/30 border border-border/40 gap-4">
                                                    <div className="text-xs text-muted-foreground font-semibold">
                                                        Total Quantity: <span className="text-foreground font-bold">{totalQty}</span>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground font-semibold">
                                                        Total (IDR): <span className="text-foreground text-sm font-bold">Rp {subtotal.toLocaleString('id-ID', { minimumFractionDigits: 2 })}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* TAB ACCOUNTING FOR SUPPLIER FULL FORM (Matching Image 1 Left) */}
                            {activeTab === 'accounting' && isSupplierMaster && (
                                <div className="space-y-6 text-xs">
                                    {/* Default Accounts Section */}
                                    <div className="space-y-3">
                                        <h3 className="font-bold text-foreground text-xs">Default Accounts</h3>
                                        <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/50 space-y-1">
                                            <p className="font-semibold text-foreground">Per-Company Accounts</p>
                                            <p className="text-[11px] text-muted-foreground">
                                                Override the default payable / advance accounts on a per-company basis. Leave blank to use each company's defaults from Company settings.
                                            </p>
                                        </div>

                                        <div className="flex justify-between items-center pt-2">
                                            <span className="font-semibold text-foreground">Accounts Table</span>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleAddRow('company_accounts')}
                                                className="rounded-xl border-border/80 text-xs px-3 py-1"
                                            >
                                                <Plus size={14} className="mr-1" /> Add row
                                            </Button>
                                        </div>

                                        <div className="overflow-x-auto border border-border/70 rounded-2xl bg-card shadow-sm">
                                            <table className="w-full text-xs text-left">
                                                <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] font-bold tracking-wider border-b border-border/50">
                                                    <tr>
                                                        <th className="p-3 w-10 text-center">#</th>
                                                        <th className="p-3 font-semibold">Company *</th>
                                                        <th className="p-3 font-semibold">Default Account</th>
                                                        <th className="p-3 font-semibold">Advance Account</th>
                                                        <th className="p-3 w-12 text-center">Aksi</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border/40 bg-background/50">
                                                    {(tableRows['company_accounts'] || []).length > 0 ? (
                                                        (tableRows['company_accounts'] || []).map((row, rIdx) => (
                                                            <tr key={rIdx} className="hover:bg-muted/20 transition-colors">
                                                                <td className="p-3 text-center font-mono text-muted-foreground font-medium">{rIdx + 1}</td>
                                                                <td className="p-2">
                                                                    <Select
                                                                        value={row.company || 'SJS Group'}
                                                                        onChange={(val) => handleTableCellChange('company_accounts', rIdx, 'company', val)}
                                                                        className="w-full bg-background border border-border/70 rounded-lg px-2.5 py-1.5 text-xs text-foreground"
                                                                    >
                                                                        <option value="SJS Group">SJS Group</option>
                                                                        <option value="Main Operations">Main Operations</option>
                                                                    </Select>
                                                                </td>
                                                                <td className="p-2">
                                                                    <Select
                                                                        value={row.default_account || ''}
                                                                        onChange={(val) => handleTableCellChange('company_accounts', rIdx, 'default_account', val)}
                                                                        className="w-full bg-background border border-border/70 rounded-lg px-2.5 py-1.5 text-xs text-foreground"
                                                                    >
                                                                        <option value="2110.001 - Hutang Usaha Supplier">2110.001 - Hutang Usaha Supplier</option>
                                                                        <option value="2110.002 - Hutang Pemasok Impor">2110.002 - Hutang Pemasok Impor</option>
                                                                    </Select>
                                                                </td>
                                                                <td className="p-2">
                                                                    <Select
                                                                        value={row.advance_account || ''}
                                                                        onChange={(val) => handleTableCellChange('company_accounts', rIdx, 'advance_account', val)}
                                                                        className="w-full bg-background border border-border/70 rounded-lg px-2.5 py-1.5 text-xs text-foreground"
                                                                    >
                                                                        <option value="1140.001 - Uang Muka Supplier">1140.001 - Uang Muka Supplier</option>
                                                                        <option value="1140.002 - Panjar Pembelian Vendor">1140.002 - Panjar Pembelian Vendor</option>
                                                                    </Select>
                                                                </td>
                                                                <td className="p-2 text-center">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDeleteRow('company_accounts', rIdx)}
                                                                        className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                                    >
                                                                        <X size={15} />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={5} className="p-8 text-center text-muted-foreground italic">
                                                                No rows (Klik + Add row untuk menambah akun per-perusahaan)
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Internal Supplier Details Section (Matching Image 1 Left) */}
                                    <div className="pt-4 border-t border-border/60 space-y-3">
                                        <h3 className="font-bold text-foreground text-xs">Internal Supplier Details</h3>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="is_internal_supplier"
                                                checked={Boolean(formData['is_internal_supplier'])}
                                                onChange={(e) => handleInputChange('is_internal_supplier', e.target.checked)}
                                                className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                                            />
                                            <label htmlFor="is_internal_supplier" className="font-semibold text-foreground cursor-pointer">
                                                Is Internal Supplier
                                            </label>
                                        </div>
                                        {formData['is_internal_supplier'] && (
                                            <div className="space-y-1.5 pt-2 max-w-md">
                                                <label className="font-semibold text-muted-foreground">Represents Company</label>
                                                <Select
                                                    value={formData['represents_company'] || ''}
                                                    onChange={(val) => handleInputChange('represents_company', val)}
                                                    className="w-full bg-background border border-border/80 rounded-xl px-3.5 py-2 text-xs text-foreground"
                                                >
                                                    <option value="">-- Pilih Perusahaan --</option>
                                                    <option value="SJS Group">SJS Group</option>
                                                    <option value="Main Operations">Main Operations</option>
                                                </Select>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* TAB TAX FOR SUPPLIER FULL FORM */}
                            {activeTab === 'tax' && (
                                <div className="space-y-4 text-xs">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="font-semibold text-foreground">Tax Category</label>
                                            <Select
                                                value={formData['tax_category'] || ''}
                                                onChange={(val) => handleInputChange('tax_category', val)}
                                                className="w-full bg-background border border-border/80 rounded-xl px-3.5 py-2 text-xs text-foreground"
                                            >
                                                <option value="">Standard Tax</option>
                                                <option value="Zero Tax">Zero Tax / Bebas PPN</option>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="font-semibold text-foreground">Tax ID / NPWP Vendor</label>
                                            <Input
                                                type="text"
                                                placeholder="NPWP resmi vendor (15 digit)..."
                                                value={formData['tax_id'] || ''}
                                                onChange={(e) => handleInputChange('tax_id', e.target.value)}
                                                className="w-full bg-background border border-border/80 rounded-xl px-3.5 py-2 text-xs text-foreground"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB SETTINGS FOR SUPPLIER FULL FORM */}
                            {activeTab === 'settings' && (
                                <div className="space-y-4 text-xs">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="font-semibold text-foreground">Default Payment Terms</label>
                                            <Select
                                                value={formData['payment_terms'] || 'Net 30'}
                                                onChange={(val) => handleInputChange('payment_terms', val)}
                                                className="w-full bg-background border border-border/80 rounded-xl px-3.5 py-2 text-xs text-foreground"
                                            >
                                                <option value="Cash">Cash on Delivery (COD)</option>
                                                <option value="Net 15">Net 15 Hari</option>
                                                <option value="Net 30">Net 30 Hari</option>
                                                <option value="Net 60">Net 60 Hari</option>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="font-semibold text-foreground">Default Price List</label>
                                            <Select
                                                value={formData['buying_price_list'] || 'Standard Buying'}
                                                onChange={(val) => handleInputChange('buying_price_list', val)}
                                                className="w-full bg-background border border-border/80 rounded-xl px-3.5 py-2 text-xs text-foreground"
                                            >
                                                <option value="Standard Buying">Standard Buying</option>
                                                <option value="Bulk Wholesale Buying">Bulk Wholesale Buying</option>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="font-semibold text-foreground">Default Currency</label>
                                            <Select
                                                value={formData['currency'] || 'IDR'}
                                                onChange={(val) => handleInputChange('currency', val)}
                                                className="w-full bg-background border border-border/80 rounded-xl px-3.5 py-2 text-xs text-foreground"
                                            >
                                                <option value="IDR">IDR (Rupiah Indonesia)</option>
                                                <option value="USD">USD (US Dollar)</option>
                                                <option value="EUR">EUR (Euro)</option>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB PORTAL USERS */}
                            {activeTab === 'portal' && (
                                <div className="space-y-4 text-xs">
                                    <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 text-center text-muted-foreground italic">
                                        Belum ada pengguna portal vendor yang terdaftar.
                                    </div>
                                </div>
                            )}

                            {/* TAB MORE INFO */}
                            {activeTab === 'more' && (
                                <div className="space-y-4 text-xs">
                                    <div className="space-y-1.5">
                                        <label className="font-semibold text-foreground">Catatan / Remarks</label>
                                        <Textarea
                                            rows={4}
                                            value={formData['remarks'] || ''}
                                            onChange={(e) => handleInputChange('remarks', e.target.value)}
                                            placeholder="Catatan tambahan mengenai supplier ini..."
                                            className="w-full bg-background border border-border/80 rounded-xl px-3.5 py-2.5 text-xs text-foreground"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons for Full Form */}
                            <div className="flex justify-end items-center gap-3 pt-4 border-t border-border/60">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onClose}
                                    className="rounded-xl border-border/80 font-medium px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    variant="default"
                                    className="rounded-xl font-bold px-6 py-2 text-xs shadow-md transition-all bg-primary text-primary-foreground hover:bg-primary/90"
                                >
                                    Save Supplier
                                </Button>
                            </div>
                        </>
                    )}
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

