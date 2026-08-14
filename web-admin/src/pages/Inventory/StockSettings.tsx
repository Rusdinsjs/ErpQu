import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useToast } from '../../components/ui/toast-context';
import { Save, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { useAuthStore } from '../../store/useAuthStore';
import { stockSettingsApi } from '../../api/inventory';

interface StockSettingsForm {
    default_valuation_method: string;
    allow_negative_stock: boolean;
    auto_reorder_level: boolean;
}

export default function StockSettings() {
    const { companyId } = useAuthStore();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<StockSettingsForm>({
        default_valuation_method: 'FIFO',
        allow_negative_stock: false,
        auto_reorder_level: true,
    });

    useEffect(() => {
        if (!companyId) return;

        const fetchSettings = async () => {
            setLoading(true);
            try {
                const response = await stockSettingsApi.getSettings(companyId);
                if (response.status === 'success' && response.data) {
                    setFormData({
                        default_valuation_method: response.data.default_valuation_method || 'FIFO',
                        allow_negative_stock: response.data.allow_negative_stock || false,
                        auto_reorder_level: response.data.auto_reorder_level !== undefined ? response.data.auto_reorder_level : true,
                    });
                }
            } catch (error) {
                console.error("Failed to load settings:", error);
                toast({
                    title: 'Error',
                    description: 'Gagal memuat pengaturan stok.',
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [companyId, toast]);

    const handleSave = async () => {
        if (!companyId) return;

        setSaving(true);
        try {
            await stockSettingsApi.upsertSettings(companyId, formData);
            toast({
                title: 'Berhasil',
                description: 'Pengaturan inventaris berhasil disimpan.',
            });
        } catch (error) {
            console.error("Failed to save settings:", error);
            toast({
                title: 'Gagal',
                description: 'Gagal menyimpan pengaturan.',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-muted rounded w-1/4"></div>
                    <div className="h-64 bg-muted rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Stock Settings</h1>
                <p className="text-muted-foreground">Konfigurasi pengaturan utama untuk modul inventaris.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Global Stock Settings</CardTitle>
                    <CardDescription>Pengaturan ini berlaku untuk seluruh gudang di perusahaan.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                            <div>
                                <label className="text-sm font-medium">Default Valuation Method</label>
                                <p className="text-sm text-muted-foreground">Metode penilaian persediaan barang (hanya berlaku jika tidak ada metode spesifik di item).</p>
                            </div>
                            <select
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData.default_valuation_method}
                                onChange={(e) => setFormData({ ...formData, default_valuation_method: e.target.value })}
                            >
                                <option value="FIFO">FIFO (First In, First Out)</option>
                                <option value="Moving Average">Moving Average</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start pt-4 border-t">
                            <div>
                                <label className="text-sm font-medium">Allow Negative Stock</label>
                                <p className="text-sm text-muted-foreground">Izinkan pengeluaran stok meskipun kuantitas barang tidak mencukupi (menyebabkan saldo minus).</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="allow-negative"
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    checked={formData.allow_negative_stock}
                                    onChange={(e) => setFormData({ ...formData, allow_negative_stock: e.target.checked })}
                                />
                                <label htmlFor="allow-negative" className="text-sm">Allow Negative Balance</label>
                            </div>
                        </div>

                        {formData.allow_negative_stock && (
                            <Alert variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Peringatan Valuasi</AlertTitle>
                                <AlertDescription>
                                    Mengizinkan stok negatif dapat menyebabkan anomali pada nilai valuasi barang dan COGS (Cost of Goods Sold).
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start pt-4 border-t">
                            <div>
                                <label className="text-sm font-medium">Auto Re-order Level</label>
                                <p className="text-sm text-muted-foreground">Otomatis deteksi dan munculkan pada laporan jika stok mencapai batas minimum.</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="auto-reorder"
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    checked={formData.auto_reorder_level}
                                    onChange={(e) => setFormData({ ...formData, auto_reorder_level: e.target.checked })}
                                />
                                <label htmlFor="auto-reorder" className="text-sm">Enable Auto Re-order tracking</label>
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end border-t bg-muted/50 p-4">
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? (
                            <span className="flex items-center gap-2">Saving...</span>
                        ) : (
                            <span className="flex items-center gap-2"><Save className="h-4 w-4" /> Save Settings</span>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
