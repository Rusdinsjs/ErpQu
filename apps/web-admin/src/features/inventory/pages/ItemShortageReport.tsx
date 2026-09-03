import { useState, useEffect } from 'react';
import { Card, Table, TableHead, TableBody, TableRow, TableTh, TableTd } from '../../../components/ui';
import { stockReportApi } from '../api/inventory';
import { useAuthStore } from '../../../store/useAuthStore';
import { toast } from 'sonner';

export default function ItemShortageReport() {
    const companyId = useAuthStore(s => s.activeCompanyId) || 'c0000000-0000-0000-0000-000000000001';
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        stockReportApi.getItemShortage(companyId)
            .then(res => {
                setData(res || []);
            })
            .catch(err => {
                console.error(err);
                toast.error('Gagal memuat Item Shortage Report.');
            })
            .finally(() => setLoading(false));
    }, [companyId]);

    return (
        <div className="p-8 max-w-6xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Item Shortage Report</h1>
                <p className="text-sm text-muted-foreground mt-1">Daftar barang dengan stok di bawah batas minimum (safety stock) yang perlu segera diorder ulang</p>
            </div>

            <Card className="overflow-hidden">
                {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Memuat data shortage...</div>
                ) : data.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">Tidak ada barang yang mengalami kekurangan stok saat ini (Semua stok aman).</div>
                ) : (
                    <Table>
                        <TableHead>
                            <TableRow className="bg-muted/40">
                                <TableTh>SKU</TableTh>
                                <TableTh>Nama Barang</TableTh>
                                <TableTh align="right">Stok Saat Ini</TableTh>
                                <TableTh align="right">Batas Min (Reorder)</TableTh>
                                <TableTh align="right">Kekurangan (Shortage)</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.map((row, idx) => (
                                <TableRow key={idx}>
                                    <TableTd className="font-mono text-muted-foreground">{row.sku}</TableTd>
                                    <TableTd className="font-semibold text-foreground">{row.item_name || row.name}</TableTd>
                                    <TableTd align="right" className="font-bold text-rose-600">{row.current_quantity || row.actual_qty || 0}</TableTd>
                                    <TableTd align="right">{row.min_stock || row.reorder_level || 0}</TableTd>
                                    <TableTd align="right" className="font-bold text-amber-600">{row.shortage_qty || 0}</TableTd>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Card>
        </div>
    );
}
