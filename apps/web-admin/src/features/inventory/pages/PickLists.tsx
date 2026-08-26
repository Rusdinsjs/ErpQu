import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { outboundLogisticsApi } from'../api/inventory';
import { Card, Button, Badge } from'../../../components/ui';
import { Plus, Search, ClipboardCheck } from 'lucide-react';

export default function PickLists() {
    const [searchTerm, setSearchTerm] = useState('');
    
    const companyId = '75d1be11-9669-42b7-a39f-26ec0398f6d6'; 

    const { data: lists, isLoading } = useQuery({
        queryKey: ['inventory', 'pick-lists', companyId],
        queryFn: () => outboundLogisticsApi.listPickLists(companyId)
    });

    const filtered = Array.isArray(lists) ? lists.filter((n: any) => 
        n.pick_list_number?.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <ClipboardCheck className="h-6 w-6 text-primary" />
                        Pick Lists
                    </h1>
                    <p className="text-muted-foreground mt-1">Daftar pengambilan barang dari gudang</p>
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
                            placeholder="Cari nomor pick list..."
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
                                <th className="px-4 py-3">Tujuan</th>
                                <th className="px-4 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={4} className="text-center py-8">Memuat data...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">Belum ada Pick List</td></tr>
                            ) : (
                                filtered.map((doc: any) => (
                                    <tr key={doc.id} className="border-b border-border/50 hover:bg-secondary/20">
                                        <td className="px-4 py-3 font-medium">{doc.pick_list_number}</td>
                                        <td className="px-4 py-3">{new Date(doc.date).toLocaleDateString('id-ID')}</td>
                                        <td className="px-4 py-3">{doc.purpose}</td>
                                        <td className="px-4 py-3">
                                            <Badge variant="outline">{doc.status}</Badge>
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
