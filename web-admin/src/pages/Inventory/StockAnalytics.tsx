import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card';
import { useAuthStore } from '../../store/useAuthStore';
import { stockAnalyticsApi } from '../../api/inventory';
import { useToast } from '../../components/ui/toast-context';
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
    const { companyId } = useAuthStore();
    const { toast } = useToast();
    
    const [warehouseValuations, setWarehouseValuations] = useState<any[]>([]);
    const [itemGroupValuations, setItemGroupValuations] = useState<any[]>([]);
    const [movementTrends, setMovementTrends] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(30);

    const fetchData = async () => {
        if (!companyId) return;
        setLoading(true);
        try {
            const [whData, igData, trendsData] = await Promise.all([
                stockAnalyticsApi.getWarehouseValuations(companyId),
                stockAnalyticsApi.getItemGroupValuations(companyId),
                stockAnalyticsApi.getMovementTrends(companyId, days)
            ]);
            
            // Map Decimal strings to numbers
            setWarehouseValuations((whData || []).map((w: any) => ({ ...w, total_value: Number(w.total_value) })));
            setItemGroupValuations((igData || []).map((ig: any) => ({ ...ig, total_value: Number(ig.total_value) })));
            setMovementTrends((trendsData || []).map((t: any) => ({ ...t, inward_qty: Number(t.inward_qty), outward_qty: Number(t.outward_qty) })));
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'Gagal memuat data analitik.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [companyId, days]);

    if (loading) return <div className="p-6">Loading analytics data...</div>;

    const totalValuation = warehouseValuations.reduce((sum, w) => sum + w.total_value, 0);

    return (
        <div className="p-6 max-w-7xl space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Stock Analytics</h1>
                    <p className="text-muted-foreground">Dashboard analitik dan valuasi persediaan tingkat lanjut.</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Tren:</span>
                    <select
                        value={days}
                        onChange={(e) => setDays(Number(e.target.value))}
                        className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                        <option value={7}>7 Hari Terakhir</option>
                        <option value={30}>30 Hari Terakhir</option>
                        <option value={90}>90 Hari Terakhir</option>
                    </select>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Valuasi Persediaan</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalValuation)}</div>
                        <p className="text-xs text-muted-foreground">Total aset persediaan saat ini</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Gudang Aktif</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{warehouseValuations.length}</div>
                        <p className="text-xs text-muted-foreground">Gudang dengan nilai persediaan &gt; 0</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Kategori Barang</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{itemGroupValuations.length}</div>
                        <p className="text-xs text-muted-foreground">Grup barang dengan nilai persediaan</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Valuasi per Gudang - Bar Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Valuasi per Gudang</CardTitle>
                        <CardDescription>Distribusi nilai aset di setiap gudang</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={warehouseValuations} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="warehouse_name" />
                                    <YAxis tickFormatter={(val) => `Rp${(val / 1000000).toFixed(0)}M`} />
                                    <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                                    <Bar dataKey="total_value" fill="#8884d8" name="Total Valuasi" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Valuasi per Item Group - Pie Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Valuasi per Kategori Barang</CardTitle>
                        <CardDescription>Komposisi nilai aset berdasarkan grup</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={itemGroupValuations}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="total_value"
                                        nameKey="item_group"
                                    >
                                        {itemGroupValuations.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Tren Mutasi Harian - Line Chart */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Tren Mutasi Harian ({days} Hari)</CardTitle>
                        <CardDescription>Perbandingan jumlah barang masuk (Inward) dan keluar (Outward)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={movementTrends} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <RechartsTooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="inward_qty" stroke="#10b981" name="Barang Masuk (Qty)" strokeWidth={2} />
                                    <Line type="monotone" dataKey="outward_qty" stroke="#ef4444" name="Barang Keluar (Qty)" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
