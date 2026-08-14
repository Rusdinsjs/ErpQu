import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    Calculator, Plus, Trash2, Search, Loader2, X, ArrowRight
} from 'lucide-react';
import { uomApi } from '../../api/inventory';
import { useToast } from '../../components/ui/Toast';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export default function UomConversions() {
    const [searchTerm, setSearchTerm] = useState('');
    
    // Default company ID for MVP
    const companyId = '75d1be11-9669-42b7-a39f-26ec0398f6d6';
    
    // Create Conversion state
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [fromUomId, setFromUomId] = useState('');
    const [toUomId, setToUomId] = useState('');
    const [conversionValue, setConversionValue] = useState('1');

    const queryClient = useQueryClient();
    const { success, error: showError } = useToast();

    // Fetch Conversions
    const { data: conversions = [], isLoading } = useQuery({
        queryKey: ['uom-conversions', companyId],
        queryFn: () => uomApi.listConversions(companyId)
    });

    // Fetch UOMs for dropdowns
    const { data: uoms = [] } = useQuery({
        queryKey: ['uoms', companyId],
        queryFn: () => uomApi.listUoms(companyId)
    });

    // Create Conversion Mutation
    const createConversionMutation = useMutation({
        mutationFn: uomApi.createConversion,
        onSuccess: () => {
            success('UOM Conversion created successfully');
            setFromUomId('');
            setToUomId('');
            setConversionValue('1');
            setCreateModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['uom-conversions'] });
        },
        onError: (err: any) => {
            showError(err.response?.data?.message || 'Failed to create UOM Conversion');
        }
    });

    // Delete Conversion Mutation
    const deleteConversionMutation = useMutation({
        mutationFn: uomApi.deleteConversion,
        onSuccess: () => {
            success('UOM Conversion deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['uom-conversions'] });
        },
        onError: (err: any) => {
            showError(err.response?.data?.message || 'Failed to delete UOM Conversion');
        }
    });

    const handleCreateConversion = (e: React.FormEvent) => {
        e.preventDefault();
        if (!fromUomId || !toUomId || !conversionValue) return;
        
        createConversionMutation.mutate({
            company_id: companyId,
            from_uom_id: fromUomId,
            to_uom_id: toUomId,
            value: parseFloat(conversionValue)
        });
    };

    const handleDeleteConversion = (id: string) => {
        if (window.confirm('Are you sure you want to delete this conversion factor?')) {
            deleteConversionMutation.mutate(id);
        }
    };

    const filteredConversions = conversions.filter((conv: any) => 
        (conv.from_uom_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (conv.to_uom_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Calculator className="text-orange-500" />
                        UOM Conversions
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Kelola faktor konversi antar satuan (Misal: 1 Box = 12 Pcs)
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <Input 
                            placeholder="Cari konversi..." 
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button 
                        onClick={() => setCreateModalOpen(true)}
                        className="bg-orange-500 hover:bg-orange-600 text-white shrink-0"
                    >
                        <Plus size={18} className="mr-2" />
                        Konversi Baru
                    </Button>
                </div>
            </div>

            {/* List */}
            <div className="border border-border/60 rounded-xl bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/20 border-b border-border/60">
                            <tr>
                                <th className="px-6 py-4 font-medium">Satuan Asal (From)</th>
                                <th className="px-6 py-4 font-medium text-center">Faktor (Value)</th>
                                <th className="px-6 py-4 font-medium">Satuan Tujuan (To)</th>
                                <th className="px-6 py-4 font-medium text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <Loader2 size={32} className="animate-spin text-orange-500" />
                                            <span>Memuat data konversi...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredConversions.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                                        Belum ada konversi satuan ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                filteredConversions.map((conv: any) => (
                                    <tr key={conv.id} className="hover:bg-muted/10 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-semibold text-foreground bg-muted/30 px-3 py-1 rounded-md inline-block">
                                                1 {conv.from_uom_name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex items-center justify-center gap-3 text-muted-foreground">
                                                <ArrowRight size={16} />
                                                <span className="font-bold text-orange-600 dark:text-orange-400">
                                                    = {Number(conv.value).toString()}
                                                </span>
                                                <ArrowRight size={16} />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-semibold text-foreground bg-muted/30 px-3 py-1 rounded-md inline-block">
                                                {conv.to_uom_name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => handleDeleteConversion(conv.id)}
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                title="Hapus Konversi"
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Conversion Modal */}
            {createModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-border/60 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-4 md:p-6 border-b border-border/60">
                            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                <Plus size={20} className="text-orange-500" />
                                Tambah Konversi UOM
                            </h2>
                            <button 
                                onClick={() => setCreateModalOpen(false)}
                                className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleCreateConversion} className="p-4 md:p-6 space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                    Dari Satuan (From UOM) <span className="text-red-500">*</span>
                                </label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={fromUomId}
                                    onChange={(e) => setFromUomId(e.target.value)}
                                    required
                                >
                                    <option value="" disabled>Pilih Satuan...</option>
                                    {uoms.map((u: any) => (
                                        <option key={u.id} value={u.id}>{u.uom_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                    Faktor Konversi (Value) <span className="text-red-500">*</span>
                                </label>
                                <Input 
                                    type="number"
                                    min="0.000001"
                                    step="any"
                                    placeholder="Contoh: 12" 
                                    value={conversionValue}
                                    onChange={(e) => setConversionValue(e.target.value)}
                                    required
                                />
                                <p className="text-xs text-muted-foreground">
                                    Berapa banyak satuan tujuan yang setara dengan 1 satuan asal?
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                    Ke Satuan (To UOM) <span className="text-red-500">*</span>
                                </label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={toUomId}
                                    onChange={(e) => setToUomId(e.target.value)}
                                    required
                                >
                                    <option value="" disabled>Pilih Satuan...</option>
                                    {uoms.map((u: any) => (
                                        <option key={u.id} value={u.id}>{u.uom_name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Preview */}
                            {fromUomId && toUomId && conversionValue && (
                                <div className="p-3 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-900/30 rounded-lg text-sm text-center">
                                    <strong>1</strong> {uoms.find((u:any) => u.id === fromUomId)?.uom_name} 
                                    {' '} = {' '}
                                    <strong>{conversionValue}</strong> {uoms.find((u:any) => u.id === toUomId)?.uom_name}
                                </div>
                            )}
                            
                            <div className="pt-4 flex justify-end gap-3 border-t border-border/60">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setCreateModalOpen(false)}
                                    disabled={createConversionMutation.isPending}
                                >
                                    Batal
                                </Button>
                                <Button 
                                    type="submit" 
                                    className="bg-orange-500 hover:bg-orange-600 text-white"
                                    disabled={createConversionMutation.isPending}
                                >
                                    {createConversionMutation.isPending ? 'Menyimpan...' : 'Simpan Konversi'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
