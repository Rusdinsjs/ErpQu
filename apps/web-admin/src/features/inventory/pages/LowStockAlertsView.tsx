import React, { useState, useEffect } from 'react';
import { api } from '../../../api/http';
import { PageHeader, Card, Badge, LoadingSpinner } from '../../../components/ui';
import { AlertOctagon, RefreshCw, ShoppingCart, CheckCircle2, Search } from 'lucide-react';

interface LowStockItem {
    id: string;
    sku: string;
    name: string;
    description?: string;
    min_stock: string | number;
    current_quantity: string | number;
    average_cost: string | number;
}

export default function LowStockAlertsView() {
    const [items, setItems] = useState<LowStockItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchAlerts = async () => {
        try {
            setLoading(true);
            const res = await api.get('/inventory/alerts/low-stock');
            if (res.data?.success && res.data?.data) {
                setItems(res.data.data);
            }
        } catch (error) {
            console.error('Failed to load low stock alerts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlerts();
    }, []);

    const filteredItems = items.filter(
        (it) =>
            it.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
            it.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <PageHeader
                title="Peringatan Stok Menipis (Low Stock Alerts)"
                subtitle="Pemantauan persediaan aktif yang berada di bawah batas minimum untuk mencegah kehabisan stok (stockout)"
            >
                <button
                    onClick={fetchAlerts}
                    className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground text-sm font-medium rounded-xl hover:bg-muted border border-border transition-colors cursor-pointer"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </PageHeader>

            {loading ? (
                <div className="flex justify-center py-20">
                    <LoadingSpinner size="lg" />
                </div>
            ) : items.length === 0 ? (
                <Card className="p-12 text-center border-border bg-card/60">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-1">Semua Stok Dalam Batas Aman</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Tidak ada item persediaan yang berada di bawah ambang batas stok minimum saat ini.
                    </p>
                </Card>
            ) : (
                <>
                    <div className="flex items-center justify-between gap-4">
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                            <input
                                type="text"
                                placeholder="Cari SKU atau nama barang..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div className="flex items-center gap-2 text-sm font-semibold text-red-500">
                            <AlertOctagon size={18} />
                            <span>{items.length} Item Membutuhkan Pengadaan</span>
                        </div>
                    </div>

                    <Card className="overflow-hidden border-border bg-card/70">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-muted-foreground uppercase text-[11px] font-semibold border-b border-border">
                                    <tr>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">SKU</th>
                                        <th className="px-4 py-3">Nama Barang</th>
                                        <th className="px-4 py-3 text-right">Stok Saat Ini</th>
                                        <th className="px-4 py-3 text-right">Batas Minimum</th>
                                        <th className="px-4 py-3 text-right">Defisit</th>
                                        <th className="px-4 py-3 text-center">Tindakan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {filteredItems.map((item) => {
                                        const current = Number(item.current_quantity) || 0;
                                        const min = Number(item.min_stock) || 0;
                                        const deficit = Math.max(0, min - current);
                                        const isCritical = current === 0;

                                        return (
                                            <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-3">
                                                    {isCritical ? (
                                                        <Badge variant="destructive" className="font-bold animate-pulse">
                                                            HABIS (0)
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="default" className="bg-amber-500 text-white font-bold">
                                                            DI BAWAH MIN
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 font-mono font-medium text-foreground">{item.sku}</td>
                                                <td className="px-4 py-3 font-medium text-foreground">{item.name}</td>
                                                <td className="px-4 py-3 text-right font-mono font-bold text-red-500">
                                                    {current.toLocaleString('id-ID')}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                                                    {min.toLocaleString('id-ID')}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                                                    +{deficit.toLocaleString('id-ID')}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => alert(`Membuat Material Request untuk ${item.sku}`)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors cursor-pointer shadow-sm"
                                                    >
                                                        <ShoppingCart size={13} />
                                                        Reorder
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </>
            )}
        </div>
    );
}
