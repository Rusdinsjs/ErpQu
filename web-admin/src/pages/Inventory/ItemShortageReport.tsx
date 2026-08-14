import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { useAuthStore } from '../../store/useAuthStore';
import { stockReportsApi } from '../../api/inventory';
import { useToast } from '../../components/ui/toast-context';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { AlertTriangle } from 'lucide-react';

export default function ItemShortageReport() {
    const { companyId } = useAuthStore();
    const { toast } = useToast();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!companyId) return;
        stockReportsApi.getItemShortage(companyId)
            .then(res => {
                setData(res || []);
            })
            .catch(err => {
                console.error(err);
                toast({ title: 'Error', description: 'Gagal memuat Item Shortage Report.', variant: 'destructive' });
            })
            .finally(() => setLoading(false));
    }, [companyId]);

    return (
        <div className="p-6 max-w-6xl space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        Item Shortage Report
                    </CardTitle>
                    <CardDescription>Barang yang jumlah stoknya di bawah batas pemesanan ulang (Reorder Level)</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-4">Loading...</div>
                    ) : (
                        <div className="border rounded-lg overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Kode Barang</TableHead>
                                        <TableHead>Nama Barang</TableHead>
                                        <TableHead className="text-right">Stok Aktual</TableHead>
                                        <TableHead className="text-right">Reorder Level</TableHead>
                                        <TableHead className="text-right text-red-600">Kekurangan (Shortage)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.map((row, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell className="font-bold">{row.item_code}</TableCell>
                                            <TableCell>{row.item_name}</TableCell>
                                            <TableCell className="text-right">{Number(row.actual_qty).toLocaleString('id-ID')}</TableCell>
                                            <TableCell className="text-right">{Number(row.reorder_level).toLocaleString('id-ID')}</TableCell>
                                            <TableCell className="text-right text-red-600 font-bold">{Number(row.shortage_qty).toLocaleString('id-ID')}</TableCell>
                                        </TableRow>
                                    ))}
                                    {data.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-green-600 font-medium">Stok aman, tidak ada barang yang kekurangan (shortage).</TableCell>
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
