import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { useAuthStore } from '../../store/useAuthStore';
import { stockReportsApi } from '../../api/inventory';
import { useToast } from '../../components/ui/toast-context';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);
};

export default function StockSummaryReport() {
    const { companyId } = useAuthStore();
    const { toast } = useToast();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!companyId) return;
        stockReportsApi.getStockSummary(companyId)
            .then(res => {
                setData(res || []);
            })
            .catch(err => {
                console.error(err);
                toast({ title: 'Error', description: 'Gagal memuat Stock Summary.', variant: 'destructive' });
            })
            .finally(() => setLoading(false));
    }, [companyId]);

    return (
        <div className="p-6 max-w-6xl space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Stock Summary</CardTitle>
                    <CardDescription>Ringkasan total persediaan dan valuasi per kategori barang</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-4">Loading...</div>
                    ) : (
                        <div className="border rounded-lg overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Kategori Barang</TableHead>
                                        <TableHead className="text-right">Total Kuantitas</TableHead>
                                        <TableHead className="text-right">Total Valuasi (IDR)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.map((row, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell className="font-medium">{row.item_group}</TableCell>
                                            <TableCell className="text-right">{Number(row.total_qty).toLocaleString('id-ID')}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(Number(row.total_value))}</TableCell>
                                        </TableRow>
                                    ))}
                                    {data.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center">Tidak ada data persediaan.</TableCell>
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
