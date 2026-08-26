import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    Factory, Plus, Trash2, Search, Loader2, X
} from 'lucide-react';
import { masterDataExtendedApi } from'../api/inventory';
import { useToast } from'../../../components/ui/Toast';
import { Input } from'../../../components/ui/Input';
import { Button } from'../../../components/ui/Button';

export default function Manufacturers() {
    const [searchTerm, setSearchTerm] = useState('');
    
    // Default company ID for MVP
    const companyId = '75d1be11-9669-42b7-a39f-26ec0398f6d6';
    
    // Create state
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [name, setName] = useState('');
    const [website, setWebsite] = useState('');

    const queryClient = useQueryClient();
    const { success, error: showError } = useToast();

    // Fetch Manufacturers
    const { data: manufacturers = [], isLoading } = useQuery({
        queryKey: ['manufacturers', companyId],
        queryFn: () => masterDataExtendedApi.listManufacturers(companyId)
    });

    // Create Mutation
    const createMutation = useMutation({
        mutationFn: masterDataExtendedApi.createManufacturer,
        onSuccess: () => {
            success('Manufacturer created successfully');
            setName('');
            setWebsite('');
            setCreateModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['manufacturers'] });
        },
        onError: (err: any) => {
            showError(err.response?.data?.message || 'Failed to create Manufacturer');
        }
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: masterDataExtendedApi.deleteManufacturer,
        onSuccess: () => {
            success('Manufacturer deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['manufacturers'] });
        },
        onError: (err: any) => {
            showError(err.response?.data?.message || 'Failed to delete Manufacturer');
        }
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        
        createMutation.mutate({
            company_id: companyId,
            name: name,
            website: website || null
        });
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this Manufacturer?')) {
            deleteMutation.mutate(id);
        }
    };

    const filtered = manufacturers.filter((m: any) => 
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Factory className="text-teal-500" />
                        Manufacturers
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Kelola data produsen atau pabrikan barang
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <Input 
                            placeholder="Cari Manufacturer..." 
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button 
                        onClick={() => setCreateModalOpen(true)}
                        className="bg-teal-500 hover:bg-teal-600 text-white shrink-0"
                    >
                        <Plus size={18} className="mr-2" />
                        Tambah Manufacturer
                    </Button>
                </div>
            </div>

            <div className="border border-border/60 rounded-xl bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/20 border-b border-border/60">
                            <tr>
                                <th className="px-6 py-4 font-medium">Nama Manufacturer</th>
                                <th className="px-6 py-4 font-medium">Website</th>
                                <th className="px-6 py-4 font-medium">Tanggal Dibuat</th>
                                <th className="px-6 py-4 font-medium text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <Loader2 size={32} className="animate-spin text-teal-500" />
                                            <span>Memuat data...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                                        <div className="bg-muted/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Factory size={24} className="text-muted-foreground/50" />
                                        </div>
                                        <p>Tidak ada manufacturer yang ditemukan.</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((m: any) => (
                                    <tr key={m.id} className="hover:bg-muted/10 transition-colors">
                                        <td className="px-6 py-4 font-medium text-foreground">
                                            {m.name}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {m.website ? (
                                                <a href={m.website} target="_blank" rel="noreferrer" className="text-teal-500 hover:underline">
                                                    {m.website}
                                                </a>
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {new Date(m.created_at).toLocaleDateString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => handleDelete(m.id)}
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

            {/* Create Modal */}
            {createModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-background rounded-xl border border-border shadow-lg w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-border flex justify-between items-center">
                            <h2 className="text-lg font-semibold">Tambah Manufacturer</h2>
                            <Button variant="ghost" size="sm" onClick={() => setCreateModalOpen(false)} className="h-8 w-8 p-0 rounded-full">
                                <X size={18} />
                            </Button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Nama Manufacturer <span className="text-red-500">*</span></label>
                                    <Input
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Cari contoh: PT. ABC, Sony, dll"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Website</label>
                                    <Input
                                        type="url"
                                        value={website}
                                        onChange={(e) => setWebsite(e.target.value)}
                                        placeholder="https://www.example.com"
                                    />
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-muted/30 border-t border-border flex justify-end gap-3">
                                <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                                    Batal
                                </Button>
                                <Button type="submit" disabled={createMutation.isPending} className="bg-teal-500 hover:bg-teal-600 text-white">
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
