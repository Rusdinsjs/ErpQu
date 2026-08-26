import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    Tag, Plus, Trash2, Search, Loader2, X
} from 'lucide-react';
import { masterDataExtendedApi } from'../api/inventory';
import { useToast } from'../../../components/ui/Toast';
import { Input } from'../../../components/ui/Input';
import { Button } from'../../../components/ui/Button';

export default function Brands() {
    const [searchTerm, setSearchTerm] = useState('');
    
    // Default company ID for MVP
    const companyId = '75d1be11-9669-42b7-a39f-26ec0398f6d6';
    
    // Create state
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [brandName, setBrandName] = useState('');
    const [description, setDescription] = useState('');

    const queryClient = useQueryClient();
    const { success, error: showError } = useToast();

    // Fetch Brands
    const { data: brands = [], isLoading } = useQuery({
        queryKey: ['brands', companyId],
        queryFn: () => masterDataExtendedApi.listBrands(companyId)
    });

    // Create Mutation
    const createMutation = useMutation({
        mutationFn: masterDataExtendedApi.createBrand,
        onSuccess: () => {
            success('Brand created successfully');
            setBrandName('');
            setDescription('');
            setCreateModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['brands'] });
        },
        onError: (err: any) => {
            showError(err.response?.data?.message || 'Failed to create Brand');
        }
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: masterDataExtendedApi.deleteBrand,
        onSuccess: () => {
            success('Brand deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['brands'] });
        },
        onError: (err: any) => {
            showError(err.response?.data?.message || 'Failed to delete Brand');
        }
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!brandName.trim()) return;
        
        createMutation.mutate({
            company_id: companyId,
            brand_name: brandName,
            description: description || null
        });
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this Brand?')) {
            deleteMutation.mutate(id);
        }
    };

    const filtered = brands.filter((b: any) => 
        b.brand_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Tag className="text-pink-500" />
                        Brands
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Kelola merek dan brand produk di inventaris Anda
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <Input 
                            placeholder="Cari Brand..." 
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button 
                        onClick={() => setCreateModalOpen(true)}
                        className="bg-pink-500 hover:bg-pink-600 text-white shrink-0"
                    >
                        <Plus size={18} className="mr-2" />
                        Tambah Brand
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    <div className="col-span-full flex flex-col items-center justify-center p-12 text-muted-foreground bg-card rounded-xl border border-border/60">
                        <Loader2 size={32} className="animate-spin text-pink-500 mb-4" />
                        <p>Memuat data...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center p-12 text-muted-foreground bg-card rounded-xl border border-border/60">
                        <Tag size={48} className="text-muted-foreground/30 mb-4" />
                        <p>Belum ada Brand ditemukan.</p>
                    </div>
                ) : (
                    filtered.map((b: any) => (
                        <div key={b.id} className="bg-card rounded-xl border border-border/60 p-5 hover:border-pink-500/30 hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-pink-500/10 text-pink-600 flex items-center justify-center">
                                        <Tag size={20} />
                                    </div>
                                    <h3 className="font-semibold text-lg text-foreground">{b.brand_name}</h3>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleDelete(b.id)}
                                    className="text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 transition-all -mt-1 -mr-2"
                                >
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                            {b.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                                    {b.description}
                                </p>
                            )}
                        </div>
                    ))
                )}
            </div>

            {createModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-border/60 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-4 md:p-6 border-b border-border/60">
                            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                <Plus size={20} className="text-pink-500" />
                                Tambah Brand
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
                                    Nama Brand <span className="text-red-500">*</span>
                                </label>
                                <Input 
                                    placeholder="Contoh: Samsung, Sony, dll" 
                                    value={brandName}
                                    onChange={(e) => setBrandName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                    Deskripsi (Opsional)
                                </label>
                                <textarea
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Keterangan mengenai brand ini..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
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
                                    className="bg-pink-500 hover:bg-pink-600 text-white"
                                    disabled={createMutation.isPending}
                                >
                                    {createMutation.isPending ? 'Menyimpan...' : 'Simpan Brand'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
