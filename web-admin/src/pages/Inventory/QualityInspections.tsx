import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    ClipboardCheck, Plus, Search, Loader2, X, Check, XCircle
} from 'lucide-react';
import { qualityInspectionApi, inventoryApi } from '../../api/inventory';
import { useToast } from '../../components/ui/Toast';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export default function QualityInspections() {
    const [searchTerm, setSearchTerm] = useState('');
    
    // Default company ID for MVP
    const companyId = '75d1be11-9669-42b7-a39f-26ec0398f6d6';
    
    // Create state
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [inspectionNumber, setInspectionNumber] = useState('');
    const [inspectionType, setInspectionType] = useState('INCOMING');
    const [itemId, setItemId] = useState('');
    const [batchNo, setBatchNo] = useState('');
    const [sampleSize, setSampleSize] = useState(1);

    const queryClient = useQueryClient();
    const { success, error: showError } = useToast();

    // Fetch Quality Inspections
    const { data: inspections = [], isLoading } = useQuery({
        queryKey: ['quality-inspections', companyId],
        queryFn: () => qualityInspectionApi.listInspections(companyId)
    });

    // Fetch Items for dropdown
    const { data: items = [] } = useQuery({
        queryKey: ['inventory-items', companyId],
        queryFn: () => inventoryApi.listItems({ company_id: companyId })
    });

    // Create Mutation
    const createMutation = useMutation({
        mutationFn: qualityInspectionApi.createInspection,
        onSuccess: () => {
            success('Quality Inspection created successfully');
            setInspectionNumber('');
            setInspectionType('INCOMING');
            setItemId('');
            setBatchNo('');
            setSampleSize(1);
            setCreateModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['quality-inspections'] });
        },
        onError: (err: any) => {
            showError(err.response?.data?.message || 'Failed to create Quality Inspection');
        }
    });

    // Update Status Mutation
    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) => 
            qualityInspectionApi.updateStatus(id, status),
        onSuccess: () => {
            success('Status updated successfully');
            queryClient.invalidateQueries({ queryKey: ['quality-inspections'] });
        },
        onError: (err: any) => {
            showError(err.response?.data?.message || 'Failed to update status');
        }
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inspectionNumber.trim() || !itemId) return;
        
        createMutation.mutate({
            company_id: companyId,
            inspection_number: inspectionNumber,
            inspection_type: inspectionType,
            item_id: itemId,
            batch_no: batchNo || null,
            sample_size: sampleSize
        });
    };

    const handleUpdateStatus = (id: string, status: string) => {
        if (window.confirm(`Are you sure you want to mark this inspection as ${status}?`)) {
            updateStatusMutation.mutate({ id, status });
        }
    };

    const filtered = inspections.filter((i: any) => 
        i.inspection_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.item_name && i.item_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <ClipboardCheck className="text-blue-500" />
                        Quality Inspections
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Kelola hasil inspeksi kualitas barang (QA/QC)
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <Input 
                            placeholder="Cari Inspeksi..." 
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
                        Buat Inspeksi Baru
                    </Button>
                </div>
            </div>

            <div className="border border-border/60 rounded-xl bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/20 border-b border-border/60">
                            <tr>
                                <th className="px-6 py-4 font-medium">No. Inspeksi</th>
                                <th className="px-6 py-4 font-medium">Tipe</th>
                                <th className="px-6 py-4 font-medium">Barang</th>
                                <th className="px-6 py-4 font-medium">Batch</th>
                                <th className="px-6 py-4 font-medium text-center">Ukuran Sampel</th>
                                <th className="px-6 py-4 font-medium text-center">Status</th>
                                <th className="px-6 py-4 font-medium text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <Loader2 size={32} className="animate-spin text-blue-500" />
                                            <span>Memuat data...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                                        <div className="bg-muted/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <ClipboardCheck size={24} className="text-muted-foreground/50" />
                                        </div>
                                        <p>Tidak ada inspeksi yang ditemukan.</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((i: any) => (
                                    <tr key={i.id} className="hover:bg-muted/10 transition-colors">
                                        <td className="px-6 py-4 font-medium text-foreground">
                                            {i.inspection_number}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                i.inspection_type === 'INCOMING' ? 'bg-purple-100 text-purple-700' :
                                                i.inspection_type === 'OUTGOING' ? 'bg-indigo-100 text-indigo-700' :
                                                'bg-amber-100 text-amber-700'
                                            }`}>
                                                {i.inspection_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-foreground">
                                            {i.item_name}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {i.batch_no || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center text-foreground font-medium">
                                            {i.sample_size}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                i.status === 'PASSED' ? 'bg-green-100 text-green-700' :
                                                i.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                i.status === 'QUALITY_HOLD' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                                {i.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {i.status === 'PENDING' && (
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                        onClick={() => handleUpdateStatus(i.id, 'PASSED')}
                                                        title="Passed"
                                                    >
                                                        <Check size={16} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                        onClick={() => handleUpdateStatus(i.id, 'REJECTED')}
                                                        title="Rejected"
                                                    >
                                                        <XCircle size={16} />
                                                    </Button>
                                                </div>
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-background rounded-xl border border-border shadow-lg w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-border flex justify-between items-center">
                            <h2 className="text-lg font-semibold">Buat Quality Inspection</h2>
                            <Button variant="ghost" size="sm" onClick={() => setCreateModalOpen(false)} className="h-8 w-8 p-0 rounded-full">
                                <X size={18} />
                            </Button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">No. Inspeksi <span className="text-red-500">*</span></label>
                                        <Input
                                            required
                                            value={inspectionNumber}
                                            onChange={(e) => setInspectionNumber(e.target.value)}
                                            placeholder="QA-001"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Tipe Inspeksi <span className="text-red-500">*</span></label>
                                        <select 
                                            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                                            value={inspectionType}
                                            onChange={(e) => setInspectionType(e.target.value)}
                                        >
                                            <option value="INCOMING">Incoming</option>
                                            <option value="IN_PROCESS">In Process</option>
                                            <option value="OUTGOING">Outgoing</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium mb-1">Barang (Item) <span className="text-red-500">*</span></label>
                                    <select 
                                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                                        value={itemId}
                                        onChange={(e) => setItemId(e.target.value)}
                                        required
                                    >
                                        <option value="">-- Pilih Barang --</option>
                                        {items.map((item: any) => (
                                            <option key={item.id} value={item.id}>
                                                {item.item_code} - {item.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Batch No.</label>
                                        <Input
                                            value={batchNo}
                                            onChange={(e) => setBatchNo(e.target.value)}
                                            placeholder="Biarkan kosong jika tidak ada"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Ukuran Sampel <span className="text-red-500">*</span></label>
                                        <Input
                                            type="number"
                                            min="1"
                                            step="0.01"
                                            required
                                            value={sampleSize}
                                            onChange={(e) => setSampleSize(parseFloat(e.target.value))}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-muted/30 border-t border-border flex justify-end gap-3">
                                <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                                    Batal
                                </Button>
                                <Button type="submit" disabled={createMutation.isPending} className="bg-blue-500 hover:bg-blue-600 text-white">
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
