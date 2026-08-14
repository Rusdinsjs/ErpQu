import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    Fingerprint, Plus, Trash2, Search, Loader2, X
} from 'lucide-react';
import { masterDataExtendedApi } from '../../api/inventory';
import { useToast } from '../../components/ui/Toast';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export default function ItemAttributes() {
    const [searchTerm, setSearchTerm] = useState('');
    
    // Default company ID for MVP
    const companyId = '75d1be11-9669-42b7-a39f-26ec0398f6d6';
    
    // Create state
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [attributeName, setAttributeName] = useState('');

    const queryClient = useQueryClient();
    const { success, error: showError } = useToast();

    // Fetch Attributes
    const { data: attributes = [], isLoading } = useQuery({
        queryKey: ['item-attributes', companyId],
        queryFn: () => masterDataExtendedApi.listAttributes(companyId)
    });

    // Create Mutation
    const createMutation = useMutation({
        mutationFn: masterDataExtendedApi.createAttribute,
        onSuccess: () => {
            success('Item Attribute created successfully');
            setAttributeName('');
            setCreateModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['item-attributes'] });
        },
        onError: (err: any) => {
            showError(err.response?.data?.message || 'Failed to create Attribute');
        }
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: masterDataExtendedApi.deleteAttribute,
        onSuccess: () => {
            success('Item Attribute deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['item-attributes'] });
        },
        onError: (err: any) => {
            showError(err.response?.data?.message || 'Failed to delete Attribute');
        }
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!attributeName.trim()) return;
        
        createMutation.mutate({
            company_id: companyId,
            attribute_name: attributeName,
        });
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this Item Attribute?')) {
            deleteMutation.mutate(id);
        }
    };

    const filtered = attributes.filter((a: any) => 
        a.attribute_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Fingerprint className="text-indigo-500" />
                        Item Attributes
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Atribut dan varian spesifikasi produk (misal: Warna, Ukuran)
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <Input 
                            placeholder="Cari Atribut..." 
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
                        Tambah Atribut
                    </Button>
                </div>
            </div>

            <div className="border border-border/60 rounded-xl bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/20 border-b border-border/60">
                            <tr>
                                <th className="px-6 py-4 font-medium">Nama Atribut</th>
                                <th className="px-6 py-4 font-medium">Tgl Dibuat</th>
                                <th className="px-6 py-4 font-medium text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <Loader2 size={32} className="animate-spin text-indigo-500" />
                                            <span>Memuat data...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground">
                                        Belum ada Atribut ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((a: any) => (
                                    <tr key={a.id} className="hover:bg-muted/10 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-semibold text-foreground bg-muted/30 px-3 py-1 rounded-md inline-block">
                                                {a.attribute_name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {new Date(a.created_at).toLocaleDateString()}
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
                                <Plus size={20} className="text-indigo-500" />
                                Tambah Atribut
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
                                    Nama Atribut <span className="text-red-500">*</span>
                                </label>
                                <Input 
                                    placeholder="Contoh: Warna, Ukuran, Kapasitas" 
                                    value={attributeName}
                                    onChange={(e) => setAttributeName(e.target.value)}
                                    required
                                />
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
                                    className="bg-indigo-500 hover:bg-indigo-600 text-white"
                                    disabled={createMutation.isPending}
                                >
                                    {createMutation.isPending ? 'Menyimpan...' : 'Simpan Atribut'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
