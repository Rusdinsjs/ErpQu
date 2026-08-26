import { useState, useEffect } from 'react';
import { Card } from'../../../components/ui';
import { stockAnalyticsApi } from'../api/inventory';
import { toast } from 'sonner';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { TrendingUp, Package, Building2 } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
};

export default function StockAnalytics() {
    const companyId = '00000000-0000-0000-0000-000000000001';
    
    const [warehouseValuations, setWarehouseValuations] = useState<any[]>([]);
    const [itemGroupValuations, setItemGroupValuations] = useState<any[]>([]);
    const [movementTrends, setMovementTrends] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(30);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [whData, igData, trendsData] = await Promise.all([
                stockAnalyticsApi.getWarehouseValuations(companyId),
                stockAnalyticsApi.getItemGroupValuations(companyId),
                stockAnalyticsApi.getMovementTrends(companyId, days)
            ]);
            
            setWarehouseValuations((whData || []).map((w: any) => ({ ...w, total_value: Number(w.total_value || 0) })));
            setItemGroupValuations((igData || []).map((ig: any) => ({ ...ig, total_value: Number(ig.total_value || 0) })));
            setMovementTrends(trendsData || []);
        } catch (err: any) {
            console.error('Failed to load stock analytics:', err);
            toast.error('Gagal memuat analitik stok');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [companyId, days]);

    const totalValuation = warehouseValuations.reduce((acc, curr) => acc + (curr.total_value || 0), 0);

    return (
        <div className="p-8 space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Stock Analytics & Trends</h1>
                    <p className="text-sm text-muted-foreground mt-1">Analisis valuasi inventaris, proporsi kategori, dan tren pergerakan stok</p>
                </div>
                
                <div className="flex items-center gap-2 bg-card p-1 rounded-xl border border-border">
                    {[7, 30, 90].map((d) => (
                        <button
                            key={d}
                            onClick={() => setDays(d)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${days === d ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            {d} Hari Terakhir
                        </button>
                    ))}
                </div>
            </div>

            {/* Total Valuation Header Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-5 flex items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Valuasi Persediaan</span>
                        <h3 className="text-2xl font-bold text-foreground mt-1">{formatCurrency(totalValuation)}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                        <Package size={24} />
                    </div>
                </Card>

                <Card className="p-5 flex items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Jumlah Gudang Terdaftar</span>
                        <h3 className="text-2xl font-bold text-foreground mt-1">{warehouseValuations.length} Gudang</h3>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                        <Building2 size={24} />
                    </div>
                </Card>

                <Card className="p-5 flex items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Kategori Barang</span>
                        <h3 className="text-2xl font-bold text-foreground mt-1">{itemGroupValuations.length} Kategori</h3>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                        <TrendingUp size={24} />
                    </div>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Warehouse Valuations Bar Chart */}
                <Card className="p-6">
                    <h3 className="text-base font-bold text-foreground mb-4">Valuasi Stok per Gudang</h3>
                    <div className="h-72">
                        {loading ? (
                            <div className="h-full flex items-center justify-center text-muted-foreground">Memuat grafik...</div>
                        ) : warehouseValuations.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-muted-foreground">Tidak ada data valuasi gudang</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={warehouseValuations} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                                    <XAxis dataKey="warehouse_name" tick={{ fontSize: 12 }} />
                                    <YAxis tickFormatter={(val) => `Rp${(val / 1000000).toFixed(0)}Jt`} tick={{ fontSize: 12 }} />
                                    <RechartsTooltip formatter={(val: any) => formatCurrency(Number(val) || 0)} />
                                    <Bar dataKey="total_value" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Valuasi (Rp)" />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </Card>

                {/* Item Group Pie Chart */}
                <Card className="p-6">
                    <h3 className="text-base font-bold text-foreground mb-4">Distribusi Valuasi per Kategori</h3>
                    <div className="h-72">
                        {loading ? (
                            <div className="h-full flex items-center justify-center text-muted-foreground">Memuat grafik...</div>
                        ) : itemGroupValuations.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-muted-foreground">Tidak ada data kategori</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={itemGroupValuations}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        dataKey="total_value"
                                        nameKey="group_name"
                                        label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                                    >
                                        {itemGroupValuations.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip formatter={(val: any) => formatCurrency(Number(val) || 0)} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
