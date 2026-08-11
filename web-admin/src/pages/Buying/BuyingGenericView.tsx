import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Plus, Search, Filter, Download, ArrowLeft, RefreshCw, BarChart2, FileText, Table
} from 'lucide-react';
import { Button, Input } from '../../components/ui';
import { DocTypeFormModal } from '../../components/Forms/DocTypeFormModal';
import { buyingMasterDataApi } from '../../api/buying-master-data';
import { buyingQuotationDataApi } from '../../api/buying-quotation-data';
import { buyingScorecardDataApi } from '../../api/buying-scorecard-data';

interface Props {
    title: string;
    description: string;
    type: 'table' | 'settings' | 'report';
    columns?: string[];
    sampleData?: any[];
}

export default function BuyingGenericView({ title, description, type, columns: initialColumns }: Props) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [createModalOpen, setCreateModalOpen] = useState(false);

    // Determine query fn based on title
    const getQueryFn = () => {
        switch (title) {
            case 'Supplier Group': return buyingMasterDataApi.getSupplierGroups;
            case 'Contact': return buyingMasterDataApi.getSupplierContacts;
            case 'Address': return buyingMasterDataApi.getSupplierAddresses;
            case 'Buying Settings': return buyingMasterDataApi.getBuyingSettings;
            case 'Purchase Taxes and Charges Template': return buyingMasterDataApi.getPurchaseTaxesTemplates;
            case 'Request for Quotation': return buyingQuotationDataApi.getRequestsForQuotation;
            case 'Supplier Quotation': return buyingQuotationDataApi.getSupplierQuotations;
            case 'Subcontracting Order': return buyingQuotationDataApi.getSubcontractingOrders;
            case 'Supplier Scorecard': return buyingScorecardDataApi.getSupplierScorecards;
            case 'Supplier Scorecard Variable': return buyingScorecardDataApi.getSupplierScorecardVariables;
            case 'Supplier Scorecard Criteria': return buyingScorecardDataApi.getSupplierScorecardCriteria;
            case 'Supplier Scorecard Standing': return buyingScorecardDataApi.getSupplierScorecardStandings;
            default: return async () => [];
        }
    };

    const getMutationFn = () => {
        switch (title) {
            case 'Supplier Group': return buyingMasterDataApi.createSupplierGroup;
            case 'Contact': return buyingMasterDataApi.createSupplierContact;
            case 'Address': return buyingMasterDataApi.createSupplierAddress;
            case 'Buying Settings': return buyingMasterDataApi.createBuyingSettings;
            case 'Purchase Taxes and Charges Template': return buyingMasterDataApi.createPurchaseTaxesTemplate;
            case 'Request for Quotation': return buyingQuotationDataApi.createRequestForQuotation;
            case 'Supplier Quotation': return buyingQuotationDataApi.createSupplierQuotation;
            case 'Subcontracting Order': return buyingQuotationDataApi.createSubcontractingOrder;
            case 'Supplier Scorecard': return buyingScorecardDataApi.createSupplierScorecard;
            case 'Supplier Scorecard Variable': return buyingScorecardDataApi.createSupplierScorecardVariable;
            case 'Supplier Scorecard Criteria': return buyingScorecardDataApi.createSupplierScorecardCriteria;
            case 'Supplier Scorecard Standing': return buyingScorecardDataApi.createSupplierScorecardStanding;
            default: return async () => {};
        }
    };

    const queryKey = ['buying', title.toLowerCase()];

    const { data: records = [], isLoading } = useQuery({
        queryKey,
        queryFn: getQueryFn(),
    });

    const createMutation = useMutation({
        mutationFn: getMutationFn(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            setCreateModalOpen(false);
        }
    });

    const handleCreate = (data: any) => {
        createMutation.mutate(data);
    };

    const filteredRecords = records.filter((r: any) => 
        JSON.stringify(r).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getColumns = () => {
        if (initialColumns && initialColumns.length > 0) return initialColumns;
        if (records.length > 0) {
            return Object.keys(records[0]).filter(k => k !== 'id' && k !== 'company_id');
        }
        return ['name', 'status'];
    };

    const renderTableView = () => (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b border-border/60">
                    <tr>
                        {getColumns().map((col) => (
                            <th key={col} className="px-6 py-4 font-medium">{col.replace(/_/g, ' ')}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {isLoading ? (
                        <tr>
                            <td colSpan={getColumns().length} className="px-6 py-12 text-center text-muted-foreground">
                                Loading...
                            </td>
                        </tr>
                    ) : filteredRecords.length === 0 ? (
                        <tr>
                            <td colSpan={getColumns().length} className="px-6 py-12 text-center">
                                <div className="flex flex-col items-center justify-center text-muted-foreground">
                                    <Table size={32} className="mb-2 opacity-50" />
                                    <p>No records found for {title}</p>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        filteredRecords.map((record: any) => (
                            <tr key={record.id} className="bg-card border-b border-border/40 hover:bg-muted/20 transition-colors">
                                {getColumns().map((col) => (
                                    <td key={col} className="px-6 py-4">
                                        {typeof record[col] === 'boolean' ? (
                                            record[col] ? 'Yes' : 'No'
                                        ) : (
                                            record[col] || '-'
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="p-6 space-y-6 bg-background min-h-screen">
            {/* Header / Breadcrumb */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/buying-workspace')}
                        className="p-2 rounded-xl bg-card border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
                        <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => {}}>
                        <Download size={16} className="mr-2" /> Export
                    </Button>
                    <Button variant="primary" onClick={() => setCreateModalOpen(true)}>
                        <Plus size={16} className="mr-2" /> Tambah Baru
                    </Button>
                </div>
            </div>

            {/* Filter / Action Toolbar */}
            <div className="p-4 rounded-2xl bg-card border border-border/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:w-96">
                    <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder={`Cari dalam ${title.toLowerCase()}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    <Button variant="outline" size="sm">
                        <Filter size={14} className="mr-1.5" /> Filter
                    </Button>
                    <Button variant="outline" size="sm">
                        <RefreshCw size={14} className="mr-1.5" /> Refresh
                    </Button>
                </div>
            </div>

            {/* Table / Content View */}
            <div className="rounded-2xl bg-card border border-border/60 shadow-sm overflow-hidden">
                {type === 'report' ? (
                    <div className="p-6 space-y-6">
                        <div className="flex items-center justify-between border-b border-border pb-4">
                            <h3 className="font-semibold text-foreground flex items-center gap-2">
                                <BarChart2 size={18} className="text-primary" /> Ringkasan Laporan
                            </h3>
                        </div>
                        <div className="py-12 text-center text-muted-foreground">
                            <FileText size={48} className="mx-auto text-muted-foreground/40 mb-3" />
                            <p className="font-medium text-foreground">Belum Ada Data Laporan</p>
                        </div>
                    </div>
                ) : (
                    renderTableView()
                )}
            </div>

            {/* ERPNext Compliant DocType Form Modal */}
            <DocTypeFormModal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                title={title}
                moduleName="Buying"
                onSave={handleCreate}
            />
        </div>
    );
}
