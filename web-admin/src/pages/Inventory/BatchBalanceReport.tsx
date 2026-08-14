import { useState, useEffect } from 'react';
import { Card, Table, TableHead, TableBody, TableRow, TableTh, TableTd } from '../../components/ui';
import { stockReportApi } from '../../api/inventory';
import { toast } from 'sonner';

export default function BatchBalanceReport() {
    const companyId = '00000000-0000-0000-0000-000000000001';
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        stockReportApi.getBatchBalance(companyId)
            .then(res => {
                setData(res || []);
            })
            .catch(err => {
                console.error(err);
                toast.error('Gagal memuat Batch Balance.');
            })
            .finally(() => setLoading(false));
    }, [companyId]);

    return (
        <div className="p-8 max-w-6xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Batch Balance Report</h1>
                <p className="text-sm text-muted-foreground mt-1">Saldo kuantitas dan tanggal kedaluwarsa per batch barang</p>
            </div>

            <Card className="overflow-hidden">
                {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Memuat data batch...</div>
                ) : data.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">Belum ada data batch persediaan.</div>
                ) : (
                    <Table>
                        <TableHead>
                            <TableRow className="bg-muted/40">
                                <TableTh>Nomor Batch</TableTh>
                                <TableTh>Nama Barang / SKU</TableTh>
                                <TableTh align="right">Kuantitas</TableTh>
                                <TableTh>Tanggal Kedaluwarsa</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.map((row, idx) => (
                                <TableRow key={idx}>
                                    <TableTd className="font-mono font-semibold text-foreground">{row.batch_no || '-'}</TableTd>
                                    <TableTd>{row.item_name || row.item_id || '-'}</TableTd>
                                    <TableTd align="right" className="font-bold text-foreground">{row.balance_qty || row.quantity || 0}</TableTd>
                                    <TableTd className="text-muted-foreground">{row.expiry_date || '-'}</TableTd>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Card>
        </div>
    );
}
