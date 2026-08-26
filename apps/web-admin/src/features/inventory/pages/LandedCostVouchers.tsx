import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    FileText, Plus, Search, Loader2, X, Trash2
} from 'lucide-react';
import { landedCostVoucherApi, inventoryApi } from'../api/inventory';
import { useToast } from'../../../components/ui/Toast';
import { Input } from'../../../components/ui/Input';
import { Button } from'../../../components/ui/Button';

export default function LandedCostVouchers() {
    const [searchTerm, setSearchTerm] = useState('');
    
    // Default company ID for MVP
    const companyId = '75d1be11-9669-42b7-a39f-26ec0398f6d6';
    
    // Create state
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [voucherNumber, setVoucherNumber] = useState('');
    const [postingDate, setPostingDate] = useState(new Date().toISOString().split('T')[0]);
    const [totalFreightCharge, setTotalFreightCharge] = useState<number>(0);
    const [items, setItems] = useState([
        { receipt_document_type: 'Purchase Receipt', receipt_document_id: '', item_id: '', qty: 1, applicable_charges: 0 }
    ]);

    const queryClient = useQueryClient();
    const { success, error: showError } = useToast();

    // Fetch Vouchers
    const { data: vouchers = [], isLoading } = useQuery({
        queryKey: ['landed-cost-vouchers', companyId],
        queryFn: () => landedCostVoucherApi.listVouchers(companyId)
    });

    // Fetch Items for dropdown
    const { data: inventoryItems = [] } = useQuery({
        queryKey: ['inventory-items', companyId],
        queryFn: () => inventoryApi.listItems({ company_id: companyId })
    });

    // Create Mutation
    const createMutation = useMutation({
        mutationFn: landedCostVoucherApi.createVoucher,
        onSuccess: () => {
            success('Landed Cost Voucher created successfully');
            setVoucherNumber('');
            setPostingDate(new Date().toISOString().split('T')[0]);
            setTotalFreightCharge(0);
            setItems([{ receipt_document_type: 'Purchase Receipt', receipt_document_id: '', item_id: '', qty: 1, applicable_charges: 0 }]);
            setCreateModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['landed-cost-vouchers'] });
        },
        onError: (err: any) => {
            showError(err.response?.data?.message || 'Failed to create Landed Cost Voucher');
        }
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: landedCostVoucherApi.deleteVoucher,
        onSuccess: () => {
            success('Voucher deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['landed-cost-vouchers'] });
        },
        onError: (err: any) => {
            showError(err.response?.data?.message || 'Failed to delete Voucher');
        }
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!voucherNumber.trim()) return;

        // Validasi UUID untuk document id (simulasi)
        const validItems = items.map(item => ({
            ...item,
            receipt_document_id: item.receipt_document_id || '00000000-0000-0000-0000-000000000000'
        }));
        
        createMutation.mutate({
            company_id: companyId,
            voucher_number: voucherNumber,
            posting_date: postingDate,
            total_freight_charge: totalFreightCharge,
            items: validItems
        });
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this Voucher?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleAddItem = () => {
        setItems([...items, { receipt_document_type: 'Purchase Receipt', receipt_document_id: '', item_id: '', qty: 1, applicable_charges: 0 }]);
    };

    const handleRemoveItem = (index: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const filtered = vouchers.filter((v: any) => 
        v.voucher_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <FileText className="text-indigo-500" />
                        Landed Cost Vouchers
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Alokasikan biaya pengiriman dan bea cukai ke nilai persediaan
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <Input 
                            placeholder="Cari Voucher..." 
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button 
                        onClick={() => setCreateModalOpen(true)}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white shrink-0"
                    >
                        <Plus size={18} className="mr-2" />
                        Buat Voucher Baru
                    </Button>
                </div>
            </div>

            <div className="border border-border/60 rounded-xl bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/20 border-b border-border/60">
                            <tr>
                                <th className="px-6 py-4 font-medium">No. Voucher</th>
                                <th className="px-6 py-4 font-medium">Tanggal</th>
                                <th className="px-6 py-4 font-medium">Total Biaya (Freight)</th>
                                <th className="px-6 py-4 font-medium text-center">Status</th>
                                <th className="px-6 py-4 font-medium text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <Loader2 size={32} className="animate-spin text-indigo-500" />
                                            <span>Memuat data...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                        <div className="bg-muted/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <FileText size={24} className="text-muted-foreground/50" />
                                        </div>
                                        <p>Tidak ada voucher yang ditemukan.</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((v: any) => (
                                    <tr key={v.id} className="hover:bg-muted/10 transition-colors">
                                        <td className="px-6 py-4 font-medium text-foreground">
                                            {v.voucher_number}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {v.posting_date}
                                        </td>
                                        <td className="px-6 py-4 text-foreground font-medium">
                                            Rp {parseFloat(v.total_freight_charge || 0).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                v.status === 'Submitted' ? 'bg-green-100 text-green-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                                {v.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {v.status === 'Draft' && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => handleDelete(v.id)}
                                                    title="Hapus"
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Modal */}
            {createModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-background rounded-xl border border-border shadow-lg w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 mt-10 mb-10">
                        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-card sticky top-0 z-10">
                            <h2 className="text-lg font-semibold">Buat Landed Cost Voucher</h2>
                            <Button variant="ghost" size="sm" onClick={() => setCreateModalOpen(false)} className="h-8 w-8 p-0 rounded-full">
                                <X size={18} />
                            </Button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">No. Voucher <span className="text-red-500">*</span></label>
                                        <Input
                                            required
                                            value={voucherNumber}
                                            onChange={(e) => setVoucherNumber(e.target.value)}
                                            placeholder="LCV-0001"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Tanggal Posting <span className="text-red-500">*</span></label>
                                        <Input
                                            type="date"
                                            required
                                            value={postingDate}
                                            onChange={(e) => setPostingDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium mb-1">Total Biaya Tambahan (Freight/Cukai) <span className="text-red-500">*</span></label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        required
                                        value={totalFreightCharge}
                                        onChange={(e) => setTotalFreightCharge(parseFloat(e.target.value))}
                                    />
                                </div>

                                <div className="border border-border rounded-lg overflow-hidden">
                                    <div className="bg-muted/30 px-4 py-2 border-b border-border font-medium text-sm flex justify-between items-center">
                                        <span>Barang yang Dialokasikan</span>
                                        <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="h-7 text-xs">
                                            <Plus size={14} className="mr-1" /> Tambah
                                        </Button>
                                    </div>
                                    <div className="p-4 space-y-4">
                                        {items.map((item, index) => (
                                            <div key={index} className="flex flex-col gap-3 p-3 border border-border/50 rounded-md relative bg-muted/10">
                                                {items.length > 1 && (
                                                    <button type="button" onClick={() => handleRemoveItem(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700">
                                                        <X size={16} />
                                                    </button>
                                                )}
                                                
                                                <div className="grid grid-cols-2 gap-3 pr-6">
                                                    <div>
                                                        <label className="block text-xs font-medium mb-1">Dokumen Referensi</label>
                                                        <select 
                                                            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                                                            value={item.receipt_document_type}
                                                            onChange={(e) => handleItemChange(index, 'receipt_document_type', e.target.value)}
                                                        >
                                                            <option value="Purchase Receipt">Purchase Receipt</option>
                                                            <option value="Purchase Bill">Purchase Bill</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium mb-1">ID Dokumen</label>
                                                        <Input
                                                            value={item.receipt_document_id}
                                                            onChange={(e) => handleItemChange(index, 'receipt_document_id', e.target.value)}
                                                            placeholder="UUID dokumen penerimaan"
                                                            className="h-8 text-sm"
                                                        />
                                                    </div>
                                                </div>
                                                
                                                <div>
                                                    <label className="block text-xs font-medium mb-1">Barang <span className="text-red-500">*</span></label>
                                                    <select 
                                                        className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                                                        value={item.item_id}
                                                        onChange={(e) => handleItemChange(index, 'item_id', e.target.value)}
                                                        required
                                                    >
                                                        <option value="">-- Pilih Barang --</option>
                                                        {inventoryItems.map((invItem: any) => (
                                                            <option key={invItem.id} value={invItem.id}>
                                                                {invItem.item_code} - {invItem.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-medium mb-1">Kuantitas</label>
                                                        <Input
                                                            type="number"
                                                            min="0.01"
                                                            step="0.01"
                                                            required
                                                            value={item.qty}
                                                            onChange={(e) => handleItemChange(index, 'qty', parseFloat(e.target.value))}
                                                            className="h-8 text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium mb-1">Alokasi Biaya</label>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={item.applicable_charges}
                                                            onChange={(e) => handleItemChange(index, 'applicable_charges', parseFloat(e.target.value))}
                                                            className="h-8 text-sm"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-muted/30 border-t border-border flex justify-end gap-3 sticky bottom-0 z-10">
                                <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                                    Batal
                                </Button>
                                <Button type="submit" disabled={createMutation.isPending} className="bg-indigo-500 hover:bg-indigo-600 text-white">
                                    {createMutation.isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                                    Simpan
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
