import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { outboundLogisticsApi } from '../../api/inventory';
import { Card, Button, Badge } from '../../components/ui';
import { Plus, Search, Truck } from 'lucide-react';
import { toast } from 'sonner';

export default function DeliveryNotes() {
    const [searchTerm, setSearchTerm] = useState('');
    
    const queryClient = useQueryClient();
    const companyId = '75d1be11-9669-42b7-a39f-26ec0398f6d6'; 

    const { data: notes, isLoading } = useQuery({
        queryKey: ['inventory', 'delivery-notes', companyId],
        queryFn: () => outboundLogisticsApi.listDeliveryNotes(companyId)
    });

    const submitMutation = useMutation({
        mutationFn: outboundLogisticsApi.submitDeliveryNote,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory', 'delivery-notes'] });
            toast.success('Delivery Note berhasil di-submit dan stok telah dikurangi!');
        },
        onError: (error: any) => {
            toast.error('Gagal men-submit: ' + error.message);
        }
    });

    const filtered = Array.isArray(notes) ? notes.filter((n: any) => 
        n.delivery_note_number?.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Truck className="h-6 w-6 text-primary" />
                        Delivery Notes
                    </h1>
                    <p className="text-muted-foreground mt-1">Kelola pengiriman barang ke pelanggan</p>
                </div>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Buat Baru
                </Button>
            </div>

            <Card className="p-4">
                <div className="flex gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Cari nomor delivery note..."
                            className="w-full pl-9 pr-4 py-2 bg-secondary/50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-secondary/50">
                            <tr>
                                <th className="px-4 py-3 rounded-l-xl">No. Dokumen</th>
                                <th className="px-4 py-3">Tanggal</th>
                                <th className="px-4 py-3">Total</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 rounded-r-xl text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={5} className="text-center py-8">Memuat data...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Belum ada Delivery Note</td></tr>
                            ) : (
                                filtered.map((note: any) => (
                                    <tr key={note.id} className="border-b border-border/50 hover:bg-secondary/20">
                                        <td className="px-4 py-3 font-medium">{note.delivery_note_number}</td>
                                        <td className="px-4 py-3">{new Date(note.transaction_date).toLocaleDateString('id-ID')}</td>
                                        <td className="px-4 py-3">Rp {Number(note.grand_total).toLocaleString('id-ID')}</td>
                                        <td className="px-4 py-3">
                                            <Badge variant={note.status === 'Submitted' ? 'success' : 'outline'}>
                                                {note.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {note.status === 'Draft' && (
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => submitMutation.mutate(note.id)}
                                                    disabled={submitMutation.isPending}
                                                >
                                                    Submit
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
