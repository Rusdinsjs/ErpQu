import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    PackageSearch, Plus, Trash2, Search, Loader2, X
} from 'lucide-react';
import { masterDataExtendedApi, inventoryApi } from'../api/inventory';
import { useToast } from'../../../components/ui/Toast';
import { Input } from'../../../components/ui/Input';
import { Button } from'../../../components/ui/Button';

export default function ProductBundles() {
    const [searchTerm, setSearchTerm] = useState('');
    
    // Default company ID for MVP
    const companyId = '75d1be11-9669-42b7-a39f-26ec0398f6d6';
    
    // Create state
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [newItemCode, setNewItemCode] = useState('');
    const [description, setDescription] = useState('');
    const [bundleItems, setBundleItems] = useState([{ item_code: '', qty: 1 }]);

    const queryClient = useQueryClient();
    const { success, error: showError } = useToast();

    // Fetch Bundles
    const { data: bundles = [], isLoading } = useQuery({
        queryKey: ['product-bundles', companyId],
        queryFn: () => masterDataExtendedApi.listProductBundles(companyId)
    });

    // Fetch Items for Dropdown
    const { data: items = [] } = useQuery({
        queryKey: ['items-list'],
        queryFn: () => inventoryApi.listItems()
    });

    // Create Mutation
    const createMutation = useMutation({
        mutationFn: masterDataExtendedApi.createProductBundle,
        onSuccess: () => {
            success('Product Bundle created successfully');
            setNewItemCode('');
            setDescription('');
            setBundleItems([{ item_code: '', qty: 1 }]);
            setCreateModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['product-bundles'] });
        },
        onError: (err: any) => {
            showError(err.response?.data?.message || 'Failed to create Product Bundle');
        }
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: masterDataExtendedApi.deleteProductBundle,
        onSuccess: () => {
            success('Product Bundle deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['product-bundles'] });
        },
        onError: (err: any) => {
            showError(err.response?.data?.message || 'Failed to delete Product Bundle');
        }
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemCode.trim() || bundleItems.some(i => !i.item_code || i.qty <= 0)) {
            showError('Mohon isi semua data bundle dengan benar');
            return;
        }
        
        createMutation.mutate({
            company_id: companyId,
            new_item_code: newItemCode,
            description: description || null,
            items: bundleItems
        });
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this Product Bundle?')) {
            deleteMutation.mutate(id);
        }
    };

    const addBundleItemRow = () => {
        setBundleItems([...bundleItems, { item_code: '', qty: 1 }]);
    };

    const removeBundleItemRow = (index: number) => {
        const newItems = [...bundleItems];
        newItems.splice(index, 1);
        setBundleItems(newItems);
    };

    const updateBundleItem = (index: number, field: string, value: any) => {
        const newItems: any = [...bundleItems];
        newItems[index][field] = value;
        setBundleItems(newItems);
    };

    const filtered = bundles.filter((b: any) => 
        b.new_item_code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <PackageSearch className="text-orange-500" />
                        Product Bundles
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Kelola paket kombo produk yang dijual sebagai satu kesatuan
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <Input 
                            placeholder="Cari Bundle..." 
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
                        Tambah Bundle
                    </Button>
                </div>
            </div>

            <div className="border border-border/60 rounded-xl bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/20 border-b border-border/60">
                            <tr>
                                <th className="px-6 py-4 font-medium">Bundle Item Code</th>
                                <th className="px-6 py-4 font-medium">Deskripsi</th>
                                <th className="px-6 py-4 font-medium">Item Komponen</th>
                                <th className="px-6 py-4 font-medium text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <Loader2 size={32} className="animate-spin text-orange-500" />
                                            <span>Memuat data...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                                        Belum ada Product Bundle ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((b: any) => (
                                    <tr key={b.id} className="hover:bg-muted/10 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-semibold text-foreground bg-muted/30 px-3 py-1 rounded-md inline-block">
                                                {b.new_item_code}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-muted-foreground">{b.description || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                {b.items?.map((bi: any) => (
                                                    <div key={bi.id} className="text-xs bg-muted/30 px-2 py-1 rounded border border-border/40 inline-flex items-center gap-2">
                                                        <span className="font-medium text-foreground">{bi.item_code}</span>
                                                        <span className="text-muted-foreground">x {bi.qty}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => handleDelete(b.id)}
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto pt-24 pb-12">
                    <div className="bg-card w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden border border-border/60 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-4 md:p-6 border-b border-border/60 sticky top-0 bg-card z-10">
                            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                <Plus size={20} className="text-orange-500" />
                                Tambah Product Bundle
                            </h2>
                            <button 
                                onClick={() => setCreateModalOpen(false)}
                                className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleCreate} className="p-4 md:p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">
                                        Bundle Item Code (Nama Baru) <span className="text-red-500">*</span>
                                    </label>
                                    <Input 
                                        placeholder="Contoh: PAKET-HEMAT-1" 
                                        value={newItemCode}
                                        onChange={(e) => setNewItemCode(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">
                                        Deskripsi (Opsional)
                                    </label>
                                    <Input 
                                        placeholder="Keterangan singkat..." 
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-foreground">
                                        Item Komponen (Isi Paket)
                                    </label>
                                    <Button 
                                        type="button" 
                                        size="sm" 
                                        variant="outline"
                                        onClick={addBundleItemRow}
                                    >
                                        <Plus size={14} className="mr-1" /> Tambah Baris
                                    </Button>
                                </div>
                                
                                <div className="border border-border/60 rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/30 border-b border-border/60 text-muted-foreground">
                                            <tr>
                                                <th className="px-4 py-2 text-left font-medium">Pilih Barang Asli</th>
                                                <th className="px-4 py-2 text-left font-medium w-32">Kuantitas</th>
                                                <th className="px-4 py-2 text-center w-16"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/30">
                                            {bundleItems.map((bi, index) => (
                                                <tr key={index}>
                                                    <td className="px-4 py-2">
                                                        <select
                                                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1"
                                                            value={bi.item_code}
                                                            onChange={(e) => updateBundleItem(index, 'item_code', e.target.value)}
                                                            required
                                                        >
                                                            <option value="" disabled>Pilih Item...</option>
                                                            {items.map((i: any) => (
                                                                <option key={i.id} value={i.item_code}>{i.item_code} - {i.name}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <Input 
                                                            type="number"
                                                            min="0.01"
                                                            step="0.01"
                                                            className="h-9"
                                                            value={bi.qty}
                                                            onChange={(e) => updateBundleItem(index, 'qty', parseFloat(e.target.value))}
                                                            required
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        <Button 
                                                            type="button"
                                                            variant="ghost" 
                                                            size="sm"
                                                            onClick={() => removeBundleItemRow(index)}
                                                            disabled={bundleItems.length === 1}
                                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                        >
                                                            <Trash2 size={16} />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

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
                                    className="bg-orange-500 hover:bg-orange-600 text-white"
                                    disabled={createMutation.isPending}
                                >
                                    {createMutation.isPending ? 'Menyimpan...' : 'Simpan Product Bundle'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
