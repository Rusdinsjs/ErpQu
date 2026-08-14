import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, Loader2, Download, Filter } from 'lucide-react';
import { stockReportApi } from '../../api/inventory';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function StockLedgerReport() {
    const companyId = '75d1be11-9669-42b7-a39f-26ec0398f6d6';
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const { data: rows = [], isLoading } = useQuery({
        queryKey: ['stock-ledger', companyId, startDate, endDate],
        queryFn: () => stockReportApi.getStockLedger(companyId, { start_date: startDate, end_date: endDate })
    });

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <History className="text-blue-500" />
                        Stock Ledger
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Laporan historis pergerakan stok barang
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex gap-2">
                        <Input 
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            title="Start Date"
                            className="w-36"
                        />
                        <Input 
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            title="End Date"
                            className="w-36"
                        />
                    </div>
                    <Button variant="outline" className="shrink-0">
                        <Filter size={18} className="mr-2" />
                        Filter
                    </Button>
                    <Button className="shrink-0 bg-green-600 hover:bg-green-700 text-white">
                        <Download size={18} className="mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            <div className="border border-border/60 rounded-xl bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/20 border-b border-border/60">
                            <tr>
                                <th className="px-4 py-3">Tanggal</th>
                                <th className="px-4 py-3">Barang</th>
                                <th className="px-4 py-3">Gudang</th>
                                <th className="px-4 py-3">Dokumen</th>
                                <th className="px-4 py-3 text-right">In Qty</th>
                                <th className="px-4 py-3 text-right">Out Qty</th>
                                <th className="px-4 py-3 text-right">Balance Qty</th>
                                <th className="px-4 py-3 text-right">Balance Value</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <Loader2 size={32} className="animate-spin text-blue-500" />
                                            <span>Memuat data...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : rows.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                                        <p>Tidak ada pergerakan stok ditemukan.</p>
                                    </td>
                                </tr>
                            ) : (
                                rows.map((r: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-muted/10 transition-colors">
                                        <td className="px-4 py-3">{r.date}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{r.item_code}</div>
                                            <div className="text-xs text-muted-foreground">{r.item_name}</div>
                                        </td>
                                        <td className="px-4 py-3">{r.warehouse_name}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{r.voucher_type}</div>
                                            <div className="text-xs text-muted-foreground">{r.voucher_no}</div>
                                        </td>
                                        <td className="px-4 py-3 text-right text-green-600 font-medium">
                                            {r.in_qty > 0 ? r.in_qty : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-right text-red-500 font-medium">
                                            {r.out_qty > 0 ? r.out_qty : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium">{r.balance_qty}</td>
                                        <td className="px-4 py-3 text-right">Rp {parseFloat(r.balance_value).toLocaleString('id-ID')}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
