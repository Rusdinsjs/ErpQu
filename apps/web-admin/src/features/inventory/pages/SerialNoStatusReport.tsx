import { useState, useEffect } from 'react';
import { Card, Table, TableHead, TableBody, TableRow, TableTh, TableTd } from'../../../components/ui';
import { stockReportApi } from'../api/inventory';
import { toast } from 'sonner';

export default function SerialNoStatusReport() {
    const companyId = '00000000-0000-0000-0000-000000000001';
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        stockReportApi.getSerialNoStatus(companyId)
            .then(res => {
                setData(res || []);
            })
            .catch(err => {
                console.error(err);
                toast.error('Gagal memuat Serial No Status.');
            })
            .finally(() => setLoading(false));
    }, [companyId]);

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'active': return 'bg-emerald-500/10 text-emerald-600';
            case 'inactive': return 'bg-rose-500/10 text-rose-600';
            case 'delivered': return 'bg-blue-500/10 text-blue-600';
            default: return 'bg-muted text-muted-foreground';
        }
    };

    return (
        <div className="p-8 max-w-6xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Serial Number Status Report</h1>
                <p className="text-sm text-muted-foreground mt-1">Status pelacakan dan alokasi nomor seri per barang</p>
            </div>

            <Card className="overflow-hidden">
                {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Memuat data nomor seri...</div>
                ) : data.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">Belum ada data nomor seri terdaftar.</div>
                ) : (
                    <Table>
                        <TableHead>
                            <TableRow className="bg-muted/40">
                                <TableTh>Nomor Seri (Serial No)</TableTh>
                                <TableTh>Nama Barang / SKU</TableTh>
                                <TableTh>Lokasi Gudang</TableTh>
                                <TableTh align="center">Status</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.map((row, idx) => (
                                <TableRow key={idx}>
                                    <TableTd className="font-mono font-semibold text-foreground">{row.serial_no || '-'}</TableTd>
                                    <TableTd>{row.item_name || row.item_id || '-'}</TableTd>
                                    <TableTd className="text-muted-foreground">{row.warehouse_name || '-'}</TableTd>
                                    <TableTd align="center">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(row.status)}`}>
                                            {row.status || 'Active'}
                                        </span>
                                    </TableTd>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Card>
        </div>
    );
}
