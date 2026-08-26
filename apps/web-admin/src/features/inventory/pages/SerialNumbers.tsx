import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    Barcode, Plus, Trash2, Search, Loader2, X
} from 'lucide-react';
import { itemTrackingApi, inventoryApi } from'../api/inventory';
import { useToast } from'../../../components/ui/Toast';
import { Input } from'../../../components/ui/Input';
import { Button } from'../../../components/ui/Button';

export default function SerialNumbers() {
    const [searchTerm, setSearchTerm] = useState('');
    
    // Default company ID for MVP
    const companyId = '75d1be11-9669-42b7-a39f-26ec0398f6d6';
    
    // Create state
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [serialNo, setSerialNo] = useState('');
    const [itemId, setItemId] = useState('');
    const [warehouseId, setWarehouseId] = useState('');
    const [status, setStatus] = useState('Active');
    const [warrantyExpiryDate, setWarrantyExpiryDate] = useState('');

    const queryClient = useQueryClient();
    const { success, error: showError } = useToast();

    // Fetch Serial Numbers
    const { data: serialNumbers = [], isLoading } = useQuery({
        queryKey: ['serial-numbers', companyId],
        queryFn: () => itemTrackingApi.listSerialNumbers(companyId)
    });

    // Fetch dropdown data
    const { data: items = [] } = useQuery({
        queryKey: ['items-list'],
        queryFn: () => inventoryApi.listItems()
    });
    
    const { data: warehouses = [] } = useQuery({
        queryKey: ['warehouses'],
        queryFn: inventoryApi.listWarehouses
    });

    // Create Mutation
    const createMutation = useMutation({
        mutationFn: itemTrackingApi.createSerialNumber,
        onSuccess: () => {
            success('Serial Number created successfully');
            setSerialNo('');
            setItemId('');
            setWarehouseId('');
            setStatus('Active');
            setWarrantyExpiryDate('');
            setCreateModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['serial-numbers'] });
        },
        onError: (err: any) => {
            showError(err.response?.data?.message || 'Failed to create Serial Number');
        }
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: itemTrackingApi.deleteSerialNumber,
        onSuccess: () => {
            success('Serial Number deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['serial-numbers'] });
        },
        onError: (err: any) => {
            showError(err.response?.data?.message || 'Failed to delete Serial Number');
        }
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!serialNo.trim() || !itemId) return;
        
        createMutation.mutate({
            company_id: companyId,
            serial_no: serialNo,
            item_id: itemId,
            warehouse_id: warehouseId || null,
            status,
            warranty_expiry_date: warrantyExpiryDate || null
        });
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this Serial Number?')) {
            deleteMutation.mutate(id);
        }
    };

    const filtered = serialNumbers.filter((sn: any) => 
        sn.serial_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sn.item_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Barcode className="text-purple-500" />
                        Serial Numbers
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Lacak identitas unik untuk setiap unit barang individu
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <Input 
                            placeholder="Cari Serial No..." 
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button 
                        onClick={() => setCreateModalOpen(true)}
                        className="bg-purple-500 hover:bg-purple-600 text-white shrink-0"
                    >
                        <Plus size={18} className="mr-2" />
                        Tambah SN
                    </Button>
                </div>
            </div>

            <div className="border border-border/60 rounded-xl bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/20 border-b border-border/60">
                            <tr>
                                <th className="px-6 py-4 font-medium">Serial No</th>
                                <th className="px-6 py-4 font-medium">Barang (Item)</th>
                                <th className="px-6 py-4 font-medium">Gudang</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <Loader2 size={32} className="animate-spin text-purple-500" />
                                            <span>Memuat data...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                        Belum ada Serial Number ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((sn: any) => (
                                    <tr key={sn.id} className="hover:bg-muted/10 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-semibold text-foreground bg-muted/30 px-3 py-1 rounded-md inline-block">
                                                {sn.serial_no}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-foreground">{sn.item_name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {sn.warehouse_name || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                sn.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                                                'bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400'
                                            }`}>
                                                {sn.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => handleDelete(sn.id)}
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
                                <Plus size={20} className="text-purple-500" />
                                Tambah Serial Number
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
                                    Serial Number <span className="text-red-500">*</span>
                                </label>
                                <Input 
                                    placeholder="Contoh: SN-2023-0001" 
                                    value={serialNo}
                                    onChange={(e) => setSerialNo(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                    Pilih Barang <span className="text-red-500">*</span>
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
                                    Lokasi Gudang (Opsional)
                                </label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={warehouseId}
                                    onChange={(e) => setWarehouseId(e.target.value)}
                                >
                                    <option value="">-- Tidak di Gudang --</option>
                                    {warehouses.filter((w:any) => !w.is_group).map((w: any) => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">
                                        Status
                                    </label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                        <option value="Defective">Defective</option>
                                        <option value="Delivered">Delivered</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">
                                        Expired Garansi
                                    </label>
                                    <Input 
                                        type="date"
                                        value={warrantyExpiryDate}
                                        onChange={(e) => setWarrantyExpiryDate(e.target.value)}
                                    />
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
                                    className="bg-purple-500 hover:bg-purple-600 text-white"
                                    disabled={createMutation.isPending}
                                >
                                    {createMutation.isPending ? 'Menyimpan...' : 'Simpan Serial No'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
