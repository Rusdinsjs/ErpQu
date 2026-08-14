import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { useAuthStore } from '../../store/useAuthStore';
import { stockReportsApi } from '../../api/inventory';
import { useToast } from '../../components/ui/toast-context';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';

export default function BatchBalanceReport() {
    const { companyId } = useAuthStore();
    const { toast } = useToast();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!companyId) return;
        stockReportsApi.getBatchBalance(companyId)
            .then(res => {
                setData(res || []);
            })
            .catch(err => {
                console.error(err);
                toast({ title: 'Error', description: 'Gagal memuat Batch Balance.', variant: 'destructive' });
            })
            .finally(() => setLoading(false));
    }, [companyId]);

    return (
        <div className="p-6 max-w-6xl space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Batch-Wise Balance History</CardTitle>
                    <CardDescription>Saldo stok barang berdasarkan masing-masing nomor batch</CardDescription>
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
                                        <TableHead>No. Batch</TableHead>
                                        <TableHead>Gudang</TableHead>
                                        <TableHead className="text-right">Sisa Stok (Qty)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.map((row, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell className="font-medium">{row.item_code}</TableCell>
                                            <TableCell>{row.batch_no}</TableCell>
                                            <TableCell>{row.warehouse_name}</TableCell>
                                            <TableCell className="text-right font-bold">{Number(row.balance).toLocaleString('id-ID')}</TableCell>
                                        </TableRow>
                                    ))}
                                    {data.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center">Tidak ada stok dengan batch.</TableCell>
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
