import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesPosDataApi } from '../../api/sales-pos-data';
import { Button, Input } from '../../components/ui';
import { Settings, Save, CheckCircle2, ShieldCheck, Printer } from 'lucide-react';
import { toast } from 'sonner';

export default function POSSettingsView() {
    const queryClient = useQueryClient();
    const [allowDiscountChange, setAllowDiscountChange] = useState(true);
    const [allowRateChange, setAllowRateChange] = useState(false);
    const [autoPrintReceipt, setAutoPrintReceipt] = useState(true);

    const { isLoading } = useQuery({
        queryKey: ['sales', 'pos-settings'],
        queryFn: salesPosDataApi.listPosSettings,
    });

    const updateSettingsMutation = useMutation({
        mutationFn: salesPosDataApi.createPosSettings,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales', 'pos-settings'] });
            toast.success('Pengaturan umum POS Kasir berhasil disimpan.');
        },
        onError: (err: any) => toast.error('Gagal menyimpan: ' + err.message)
    });

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        updateSettingsMutation.mutate({
            allow_discount_change: allowDiscountChange,
            allow_rate_change: allowRateChange,
            auto_print_receipt: autoPrintReceipt,
        });
    };

    if (isLoading) return <div className="p-8 text-center text-muted-foreground font-medium">Memuat konfigurasi POS...</div>;

    return (
        <div className="p-8 space-y-6 max-w-4xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
                        <Settings className="text-rose-500" size={32} />
                        Pengaturan Umum Terminal POS Kasir
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Konfigurasi hak otorisasi ubah harga, batas diskon transaksi kasir, dan pencetakan otomatis struk thermal.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSave} className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="space-y-4">
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                        <ShieldCheck className="text-emerald-500" size={20} /> Otorisasi Kasir
                    </h3>
                    
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/40">
                        <div>
                            <p className="font-bold text-sm text-foreground">Izinkan Kasir Mengubah Diskon Transaksi</p>
                            <p className="text-xs text-muted-foreground">Kasir dapat menerapkan diskon persen atau nominal langsung di terminal kasir.</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={allowDiscountChange}
                            onChange={(e) => setAllowDiscountChange(e.target.checked)}
                            className="w-5 h-5 accent-rose-600 rounded cursor-pointer"
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/40">
                        <div>
                            <p className="font-bold text-sm text-foreground">Izinkan Kasir Mengubah Harga Jual Satuan (Rate Override)</p>
                            <p className="text-xs text-muted-foreground">Kasir dapat mengubah harga satuan barang tanpa persetujuan supervisor.</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={allowRateChange}
                            onChange={(e) => setAllowRateChange(e.target.checked)}
                            className="w-5 h-5 accent-rose-600 rounded cursor-pointer"
                        />
                    </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-border">
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                        <Printer className="text-blue-500" size={20} /> Cetak Struk Thermal
                    </h3>
                    
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/40">
                        <div>
                            <p className="font-bold text-sm text-foreground">Cetak Struk Pembayaran Otomatis Setelah Bayar</p>
                            <p className="text-xs text-muted-foreground">Sistem akan langsung membuka dialog cetak printer thermal begitu pembayaran selesai.</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={autoPrintReceipt}
                            onChange={(e) => setAutoPrintReceipt(e.target.checked)}
                            className="w-5 h-5 accent-rose-600 rounded cursor-pointer"
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-border">
                    <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold gap-2 px-6 rounded-xl">
                        <Save size={18} /> Simpan Pengaturan POS
                    </Button>
                </div>
            </form>
        </div>
    );
}
