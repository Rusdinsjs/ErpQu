import { useState, useEffect } from 'react';
import { Card, Table, TableHead, TableBody, TableRow, TableTh, TableTd } from '../../components/ui';
import { stockReportApi } from '../../api/inventory';
import { toast } from 'sonner';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);
};

export default function StockSummaryReport() {
    const companyId = '00000000-0000-0000-0000-000000000001';
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        stockReportApi.getStockSummary(companyId)
            .then(res => {
                setData(res || []);
            })
            .catch(err => {
                console.error(err);
                toast.error('Gagal memuat Stock Summary.');
            })
            .finally(() => setLoading(false));
    }, [companyId]);

    return (
        <div className="p-8 max-w-6xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Stock Summary Report</h1>
                <p className="text-sm text-muted-foreground mt-1">Ringkasan total persediaan dan valuasi per kategori barang</p>
            </div>

            <Card className="overflow-hidden">
                {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Memuat data ringkasan stok...</div>
                ) : data.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">Belum ada data stok persediaan.</div>
                ) : (
                    <Table>
                        <TableHead>
                            <TableRow className="bg-muted/40">
                                <TableTh>Kategori Barang</TableTh>
                                <TableTh align="right">Jumlah Item</TableTh>
                                <TableTh align="right">Total Kuantitas</TableTh>
                                <TableTh align="right">Total Valuasi (Rp)</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.map((row, idx) => (
                                <TableRow key={idx}>
                                    <TableTd className="font-semibold text-foreground">{row.category_name || row.category || '-'}</TableTd>
                                    <TableTd align="right">{row.item_count || 0}</TableTd>
                                    <TableTd align="right">{row.total_quantity || 0}</TableTd>
                                    <TableTd align="right" className="font-bold text-foreground">{formatCurrency(Number(row.total_value || 0))}</TableTd>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Card>
        </div>
    );
}
