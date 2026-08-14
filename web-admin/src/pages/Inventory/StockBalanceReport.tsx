import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, Loader2, Download, Filter } from 'lucide-react';
import { stockReportApi } from '../../api/inventory';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function StockBalanceReport() {
    const companyId = '75d1be11-9669-42b7-a39f-26ec0398f6d6';
    const [asOnDate, setAsOnDate] = useState('');

    const { data: rows = [], isLoading } = useQuery({
        queryKey: ['stock-balance', companyId, asOnDate],
        queryFn: () => stockReportApi.getStockBalance(companyId, { as_on: asOnDate })
    });

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Package className="text-indigo-500" />
                        Stock Balance
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Laporan saldo stok barang di seluruh gudang
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">Per Tanggal:</span>
                        <Input 
                            type="date"
                            value={asOnDate}
                            onChange={(e) => setAsOnDate(e.target.value)}
                            className="w-40"
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
                                <th className="px-4 py-3">Item Code</th>
                                <th className="px-4 py-3">Item Name</th>
                                <th className="px-4 py-3">Item Group</th>
                                <th className="px-4 py-3">Warehouse</th>
                                <th className="px-4 py-3 text-right">Balance Qty</th>
                                <th className="px-4 py-3 text-right">Valuation Rate</th>
                                <th className="px-4 py-3 text-right">Balance Value</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <Loader2 size={32} className="animate-spin text-indigo-500" />
                                            <span>Memuat data...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : rows.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                                        <p>Tidak ada saldo stok ditemukan.</p>
                                    </td>
                                </tr>
                            ) : (
                                rows.map((r: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-muted/10 transition-colors">
                                        <td className="px-4 py-3 font-medium">{r.item_code}</td>
                                        <td className="px-4 py-3">{r.item_name}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{r.item_group || '-'}</td>
                                        <td className="px-4 py-3">{r.warehouse_name}</td>
                                        <td className="px-4 py-3 text-right font-medium">{r.balance_qty}</td>
                                        <td className="px-4 py-3 text-right text-muted-foreground">
                                            Rp {parseFloat(r.valuation_rate).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-foreground">
                                            Rp {parseFloat(r.balance_value).toLocaleString('id-ID')}
                                        </td>
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
