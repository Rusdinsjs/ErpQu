import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    GitMerge, Plus, Trash2, Search, Loader2, X
} from 'lucide-react';
import { masterDataExtendedApi, inventoryApi } from '../../api/inventory';
import { useToast } from '../../components/ui/Toast';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export default function ItemAlternatives() {
    const [searchTerm, setSearchTerm] = useState('');
    
    // Default company ID for MVP
    const companyId = '75d1be11-9669-42b7-a39f-26ec0398f6d6';
    
    // Create state
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [itemId, setItemId] = useState('');
    const [alternativeItemId, setAlternativeItemId] = useState('');
    const [twoWay, setTwoWay] = useState(true);

    const queryClient = useQueryClient();
    const { success, error: showError } = useToast();

    // Fetch Alternatives
    const { data: alternatives = [], isLoading } = useQuery({
        queryKey: ['item-alternatives', companyId],
        queryFn: () => masterDataExtendedApi.listAlternatives(companyId)
    });

    // Fetch Items for Dropdown
    const { data: items = [] } = useQuery({
        queryKey: ['items-list'],
        queryFn: () => inventoryApi.listItems()
    });

    // Create Mutation
    const createMutation = useMutation({
        mutationFn: masterDataExtendedApi.createAlternative,
        onSuccess: () => {
            success('Item Alternative created successfully');
            setItemId('');
            setAlternativeItemId('');
            setTwoWay(true);
            setCreateModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['item-alternatives'] });
        },
        onError: (err: any) => {
            showError(err.response?.data?.message || 'Failed to create Alternative');
        }
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: masterDataExtendedApi.deleteAlternative,
        onSuccess: () => {
            success('Item Alternative deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['item-alternatives'] });
        },
        onError: (err: any) => {
            showError(err.response?.data?.message || 'Failed to delete Alternative');
        }
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!itemId || !alternativeItemId) return;
        if (itemId === alternativeItemId) {
            showError('Barang asli dan alternatif tidak boleh sama');
            return;
        }
        
        createMutation.mutate({
            item_id: itemId,
            alternative_item_id: alternativeItemId,
            two_way: twoWay
        });
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this Item Alternative?')) {
            deleteMutation.mutate(id);
        }
    };

    const filtered = alternatives.filter((a: any) => 
        (a.item_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.alternative_item_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <GitMerge className="text-blue-500" />
                        Item Alternatives
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Kelola daftar barang pengganti atau substitusi jika stok habis
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <Input 
                            placeholder="Cari Alternatif..." 
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button 
                        onClick={() => setCreateModalOpen(true)}
                        className="bg-blue-500 hover:bg-blue-600 text-white shrink-0"
                    >
                        <Plus size={18} className="mr-2" />
                        Tambah Alternatif
                    </Button>
                </div>
            </div>

            <div className="border border-border/60 rounded-xl bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/20 border-b border-border/60">
                            <tr>
                                <th className="px-6 py-4 font-medium">Barang Asli (Item)</th>
                                <th className="px-6 py-4 font-medium">Barang Alternatif</th>
                                <th className="px-6 py-4 font-medium">Two-Way (Dua Arah)</th>
                                <th className="px-6 py-4 font-medium text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <Loader2 size={32} className="animate-spin text-blue-500" />
                                            <span>Memuat data...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                                        Belum ada Item Alternative ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((a: any) => (
                                    <tr key={a.id} className="hover:bg-muted/10 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-foreground">{a.item_name}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-blue-600 dark:text-blue-400">{a.alternative_item_name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {a.two_way ? (
                                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                                                    Ya (Mutual)
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400">
                                                    Tidak (Satu Arah)
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => handleDelete(a.id)}
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
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

            {createModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-border/60 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-4 md:p-6 border-b border-border/60">
                            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                <Plus size={20} className="text-blue-500" />
                                Tambah Alternatif
                            </h2>
                            <button 
                                onClick={() => setCreateModalOpen(false)}
                                className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleCreate} className="p-4 md:p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                    Pilih Barang Asli <span className="text-red-500">*</span>
                                </label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={itemId}
                                    onChange={(e) => setItemId(e.target.value)}
                                    required
                                >
                                    <option value="" disabled>Pilih Barang...</option>
                                    {items.map((i: any) => (
                                        <option key={i.id} value={i.id}>{i.item_code} - {i.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                    Pilih Barang Pengganti <span className="text-red-500">*</span>
                                </label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={alternativeItemId}
                                    onChange={(e) => setAlternativeItemId(e.target.value)}
                                    required
                                >
                                    <option value="" disabled>Pilih Barang...</option>
                                    {items.map((i: any) => (
                                        <option key={i.id} value={i.id}>{i.item_code} - {i.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input 
                                    type="checkbox" 
                                    id="twoWay"
                                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                    checked={twoWay}
                                    onChange={(e) => setTwoWay(e.target.checked)}
                                />
                                <label htmlFor="twoWay" className="text-sm text-foreground">
                                    Dua Arah (Two-Way)
                                </label>
                            </div>
                            <p className="text-xs text-muted-foreground ml-6">
                                Jika diaktifkan, barang pengganti juga bisa digantikan oleh barang asli.
                            </p>

                            <div className="pt-4 flex justify-end gap-3 border-t border-border/60">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setCreateModalOpen(false)}
                                    disabled={createMutation.isPending}
                                >
                                    Batal
                                </Button>
                                <Button 
                                    type="submit" 
                                    className="bg-blue-500 hover:bg-blue-600 text-white"
                                    disabled={createMutation.isPending}
                                >
                                    {createMutation.isPending ? 'Menyimpan...' : 'Simpan Alternatif'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
