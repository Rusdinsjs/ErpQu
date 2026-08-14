import { useQuery } from '@tanstack/react-query';
import { PackageOpen, Loader2, Download, Filter } from 'lucide-react';
import { stockReportApi } from '../../api/inventory';
import { Button } from '../../components/ui/Button';

export default function StockProjectedQtyReport() {
    const companyId = '75d1be11-9669-42b7-a39f-26ec0398f6d6';

    const { data: rows = [], isLoading } = useQuery({
        queryKey: ['stock-projected-qty', companyId],
        queryFn: () => stockReportApi.getStockProjectedQty(companyId)
    });

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <PackageOpen className="text-purple-500" />
                        Stock Projected Qty
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Laporan proyeksi kuantitas stok (Actual + Planned + Requested + Ordered - Reserved)
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
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
                                <th className="px-4 py-3">Warehouse</th>
                                <th className="px-4 py-3 text-right" title="Stock saat ini">Actual Qty</th>
                                <th className="px-4 py-3 text-right" title="Rencana produksi">Planned Qty</th>
                                <th className="px-4 py-3 text-right" title="Diminta">Requested Qty</th>
                                <th className="px-4 py-3 text-right" title="Dipesan (PO)">Ordered Qty</th>
                                <th className="px-4 py-3 text-right" title="Dipesan pelanggan">Reserved Qty</th>
                                <th className="px-4 py-3 text-right text-purple-600 font-bold">Projected Qty</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <Loader2 size={32} className="animate-spin text-purple-500" />
                                            <span>Memuat data...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : rows.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                                        <p>Tidak ada data proyeksi stok ditemukan.</p>
                                    </td>
                                </tr>
                            ) : (
                                rows.map((r: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-muted/10 transition-colors">
                                        <td className="px-4 py-3 font-medium">{r.item_code}</td>
                                        <td className="px-4 py-3">{r.item_name}</td>
                                        <td className="px-4 py-3">{r.warehouse_name}</td>
                                        <td className="px-4 py-3 text-right font-medium">{r.actual_qty}</td>
                                        <td className="px-4 py-3 text-right text-muted-foreground">{r.planned_qty}</td>
                                        <td className="px-4 py-3 text-right text-muted-foreground">{r.requested_qty}</td>
                                        <td className="px-4 py-3 text-right text-muted-foreground">{r.ordered_qty}</td>
                                        <td className="px-4 py-3 text-right text-muted-foreground">{r.reserved_qty}</td>
                                        <td className="px-4 py-3 text-right font-bold text-purple-600">{r.projected_qty}</td>
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
