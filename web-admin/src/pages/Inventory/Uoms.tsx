import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    Scale, Plus, Trash2, Info, Search, Loader2, X
} from 'lucide-react';
import { uomApi } from '../../api/inventory';
import { useToast } from '../../components/ui/Toast';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export default function Uoms() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUom, setSelectedUom] = useState<any | null>(null);
    
    // Default company ID for MVP
    const companyId = '75d1be11-9669-42b7-a39f-26ec0398f6d6';
    
    // Create UOM state
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [uomName, setUomName] = useState('');
    const [mustBeWhole, setMustBeWhole] = useState(false);

    const queryClient = useQueryClient();
    const { success, error: showError } = useToast();

    // Fetch UOMs
    const { data: uoms = [], isLoading } = useQuery({
        queryKey: ['uoms', companyId],
        queryFn: () => uomApi.listUoms(companyId)
    });

    // Create UOM Mutation
    const createUomMutation = useMutation({
        mutationFn: uomApi.createUom,
        onSuccess: () => {
            success('UOM created successfully');
            setUomName('');
            setMustBeWhole(false);
            setCreateModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['uoms'] });
        },
        onError: (err: any) => {
            showError(err.response?.data?.message || 'Failed to create UOM');
        }
    });

    // Delete UOM Mutation
    const deleteUomMutation = useMutation({
        mutationFn: uomApi.deleteUom,
        onSuccess: () => {
            success('UOM deleted successfully');
            setSelectedUom(null);
            queryClient.invalidateQueries({ queryKey: ['uoms'] });
        },
        onError: (err: any) => {
            showError(err.response?.data?.message || 'Failed to delete UOM');
        }
    });

    const handleCreateUom = (e: React.FormEvent) => {
        e.preventDefault();
        if (!uomName.trim()) return;
        createUomMutation.mutate({
            company_id: companyId,
            uom_name: uomName,
            must_be_whole_number: mustBeWhole
        });
    };

    const handleDeleteUom = (id: string) => {
        if (window.confirm('Are you sure you want to delete this Unit of Measure?')) {
            deleteUomMutation.mutate(id);
        }
    };

    const filteredUoms = uoms.filter((uom: any) => 
        uom.uom_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Scale className="text-orange-500" />
                        Unit of Measure (UOM)
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Kelola satuan ukuran barang (Pcs, Box, Kg, dll)
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <Input 
                            placeholder="Cari UOM..." 
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
                        UOM Baru
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* UOM List */}
                <div className="lg:col-span-1 border border-border/60 rounded-xl bg-card overflow-hidden flex flex-col h-[600px]">
                    <div className="p-4 border-b border-border/60 bg-muted/20">
                        <h3 className="font-semibold text-foreground">Daftar UOM</h3>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-2">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-3">
                                <Loader2 size={32} className="animate-spin text-orange-500" />
                                <span>Memuat data...</span>
                            </div>
                        ) : filteredUoms.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-3">
                                <Scale size={48} className="opacity-20" />
                                <span>Belum ada UOM ditemukan</span>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {filteredUoms.map((uom: any) => (
                                    <button
                                        key={uom.id}
                                        onClick={() => setSelectedUom(uom)}
                                        className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left
                                            ${selectedUom?.id === uom.id 
                                                ? 'bg-orange-50 border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/20 border' 
                                                : 'hover:bg-muted/50 border border-transparent'
                                            }
                                        `}
                                    >
                                        <div>
                                            <div className={`font-medium ${selectedUom?.id === uom.id ? 'text-orange-700 dark:text-orange-400' : 'text-foreground'}`}>
                                                {uom.uom_name}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {uom.must_be_whole_number ? 'Bilangan Bulat Saja' : 'Bisa Desimal'}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* UOM Detail */}
                <div className="lg:col-span-2">
                    {selectedUom ? (
                        <div className="border border-border/60 rounded-xl bg-card h-[600px] flex flex-col">
                            <div className="p-6 border-b border-border/60 flex items-center justify-between bg-muted/10">
                                <div>
                                    <h2 className="text-2xl font-bold text-foreground">{selectedUom.uom_name}</h2>
                                    <div className="flex items-center gap-4 mt-2">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border
                                            ${selectedUom.must_be_whole_number 
                                                ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' 
                                                : 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                                            }`}
                                        >
                                            {selectedUom.must_be_whole_number ? 'Hanya Bilangan Bulat' : 'Boleh Desimal'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button 
                                        variant="outline" 
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                                        onClick={() => handleDeleteUom(selectedUom.id)}
                                        disabled={deleteUomMutation.isPending}
                                    >
                                        <Trash2 size={16} className="mr-2" />
                                        Hapus
                                    </Button>
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-6 bg-muted/5">
                                <div className="space-y-6 max-w-2xl">
                                    <div className="p-4 rounded-xl border border-blue-100 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800/30">
                                        <div className="flex gap-3">
                                            <Info className="text-blue-500 shrink-0 mt-0.5" size={20} />
                                            <div>
                                                <h4 className="font-semibold text-blue-800 dark:text-blue-300">Info UOM</h4>
                                                <p className="text-sm text-blue-700/80 dark:text-blue-400/80 mt-1 leading-relaxed">
                                                    Satuan <strong>{selectedUom.uom_name}</strong> digunakan untuk mengukur kuantitas barang dalam sistem. Jika "Hanya Bilangan Bulat" aktif, barang tidak bisa ditransaksikan dengan pecahan (misal 1.5).
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="border border-border/60 rounded-xl bg-card h-[600px] flex flex-col items-center justify-center text-muted-foreground p-8 text-center border-dashed">
                            <div className="w-20 h-20 rounded-full bg-orange-500/10 flex items-center justify-center mb-6">
                                <Scale size={40} className="text-orange-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-foreground mb-2">Pilih UOM</h3>
                            <p className="max-w-md">
                                Pilih salah satu satuan di panel kiri untuk melihat detailnya, atau klik tombol "UOM Baru" untuk menambahkan satuan baru.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create UOM Modal */}
            {createModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-border/60 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-4 md:p-6 border-b border-border/60">
                            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                <Plus size={20} className="text-orange-500" />
                                Tambah UOM
                            </h2>
                            <button 
                                onClick={() => setCreateModalOpen(false)}
                                className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleCreateUom} className="p-4 md:p-6 space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                    Nama UOM <span className="text-red-500">*</span>
                                </label>
                                <Input 
                                    placeholder="Contoh: Pcs, Box, Kg, Liter" 
                                    value={uomName}
                                    onChange={(e) => setUomName(e.target.value)}
                                    autoFocus
                                    required
                                />
                            </div>

                            <div className="flex items-center space-x-2 border rounded-xl p-4 bg-muted/30">
                                <input
                                    type="checkbox"
                                    id="mustBeWhole"
                                    checked={mustBeWhole}
                                    onChange={(e) => setMustBeWhole(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-600"
                                />
                                <label htmlFor="mustBeWhole" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none">
                                    Hanya Bilangan Bulat (Must be whole number)
                                </label>
                            </div>
                            
                            <div className="pt-4 flex justify-end gap-3 border-t border-border/60">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setCreateModalOpen(false)}
                                    disabled={createUomMutation.isPending}
                                >
                                    Batal
                                </Button>
                                <Button 
                                    type="submit" 
                                    className="bg-orange-500 hover:bg-orange-600 text-white"
                                    disabled={createUomMutation.isPending}
                                >
                                    {createUomMutation.isPending ? 'Menyimpan...' : 'Simpan UOM'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
