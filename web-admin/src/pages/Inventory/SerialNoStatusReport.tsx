import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { useAuthStore } from '../../store/useAuthStore';
import { stockReportsApi } from '../../api/inventory';
import { useToast } from '../../components/ui/toast-context';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';

export default function SerialNoStatusReport() {
    const { companyId } = useAuthStore();
    const { toast } = useToast();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!companyId) return;
        stockReportsApi.getSerialNoStatus(companyId)
            .then(res => {
                setData(res || []);
            })
            .catch(err => {
                console.error(err);
                toast({ title: 'Error', description: 'Gagal memuat Serial No Status.', variant: 'destructive' });
            })
            .finally(() => setLoading(false));
    }, [companyId]);

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'inactive': return 'bg-red-100 text-red-800';
            case 'delivered': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="p-6 max-w-6xl space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Serial Number Status</CardTitle>
                    <CardDescription>Status lokasi dan pergerakan nomor seri barang individu</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-4">Loading...</div>
                    ) : (
                        <div className="border rounded-lg overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Serial No</TableHead>
                                        <TableHead>Kode Barang</TableHead>
                                        <TableHead>Lokasi Saat Ini</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.map((row, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell className="font-bold">{row.serial_no}</TableCell>
                                            <TableCell>{row.item_code}</TableCell>
                                            <TableCell>{row.warehouse_name || '-'}</TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(row.status)}`}>
                                                    {row.status}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {data.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center">Tidak ada serial number terdaftar.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
