import { useState, useEffect } from 'react';
import { Card, Button } from'../../../components/ui';
import { toast } from 'sonner';
import { stockSettingsApi } from'../api/inventory';

interface StockSettingsForm {
    default_valuation_method: string;
    allow_negative_stock: boolean;
    auto_reorder_level: boolean;
}

export default function StockSettings() {
    const companyId = '00000000-0000-0000-0000-000000000001';
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<StockSettingsForm>({
        default_valuation_method: 'FIFO',
        allow_negative_stock: false,
        auto_reorder_level: true,
    });

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            try {
                const response = await stockSettingsApi.getSettings(companyId);
                if (response?.data) {
                    setFormData({
                        default_valuation_method: response.data.default_valuation_method || 'FIFO',
                        allow_negative_stock: response.data.allow_negative_stock || false,
                        auto_reorder_level: response.data.auto_reorder_level !== undefined ? response.data.auto_reorder_level : true,
                    });
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [companyId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await stockSettingsApi.updateSettings(companyId, formData);
            toast.success('Pengaturan stok berhasil disimpan.');
        } catch (err: any) {
            toast.error('Gagal menyimpan pengaturan: ' + (err.message || 'Error'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Pengaturan Modul Persediaan (Stock Settings)</h1>
                <p className="text-sm text-muted-foreground mt-1">Konfigurasi metode valuasi, aturan stok negatif dan reorder</p>
            </div>

            <Card className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Metode Valuasi Standar</label>
                        <select
                            value={formData.default_valuation_method}
                            onChange={(e) => setFormData({ ...formData, default_valuation_method: e.target.value })}
                            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
                        >
                            <option value="FIFO">First In, First Out (FIFO)</option>
                            <option value="Moving Average">Moving Average</option>
                            <option value="LIFO">Last In, First Out (LIFO)</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="allow_negative_stock"
                            checked={formData.allow_negative_stock}
                            onChange={(e) => setFormData({ ...formData, allow_negative_stock: e.target.checked })}
                            className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                        />
                        <label htmlFor="allow_negative_stock" className="text-sm font-medium text-foreground cursor-pointer">
                            Izinkan Pengeluaran Stok Negatif (Allow Negative Stock)
                        </label>
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="auto_reorder_level"
                            checked={formData.auto_reorder_level}
                            onChange={(e) => setFormData({ ...formData, auto_reorder_level: e.target.checked })}
                            className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                        />
                        <label htmlFor="auto_reorder_level" className="text-sm font-medium text-foreground cursor-pointer">
                            Otomatiskan Peringatan Reorder Level
                        </label>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-border">
                        <Button type="submit" disabled={loading || saving} className="bg-primary text-white px-6">
                            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
