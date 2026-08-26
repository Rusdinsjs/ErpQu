import React, { useState } from 'react';
import { Button } from'../../../components/ui';
import { Settings, Save, ShieldCheck, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function SellingSettingsView() {
    const [allowNegativeStock, setAllowNegativeStock] = useState(false);
    const [soMandatoryForSI, setSoMandatoryForSI] = useState(true);
    const [defaultPriceList, setDefaultPriceList] = useState('Standard Selling Retail');

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success('Pengaturan umum modul penjualan berhasil disimpan.');
    };

    return (
        <div className="p-8 space-y-6 max-w-4xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
                        <Settings className="text-orange-500" size={32} />
                        Pengaturan Umum Modul Penjualan (Selling Settings)
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Konfigurasi alur kerja faktur penjualan, keharusan Sales Order (SO), dan master price list default.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSave} className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="space-y-4">
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                        <ShieldCheck className="text-orange-500" size={20} /> Kebijakan Transaksi Penjualan
                    </h3>
                    
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/40">
                        <div>
                            <p className="font-bold text-sm text-foreground">Wajibkan Sales Order (SO) Sebelum Membuat Sales Invoice</p>
                            <p className="text-xs text-muted-foreground">Penerbitan faktur penjualan memerlukan nomor SO yang telah disetujui.</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={soMandatoryForSI}
                            onChange={(e) => setSoMandatoryForSI(e.target.checked)}
                            className="w-5 h-5 accent-orange-600 rounded cursor-pointer"
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/40">
                        <div>
                            <p className="font-bold text-sm text-foreground">Izinkan Penjualan Saat Stok Minus (Negative Stock Delivery)</p>
                            <p className="text-xs text-muted-foreground">Pengiriman barang tetap dapat diproses meskipun kuantitas stok di sistem 0.</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={allowNegativeStock}
                            onChange={(e) => setAllowNegativeStock(e.target.checked)}
                            className="w-5 h-5 accent-orange-600 rounded cursor-pointer"
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-border">
                    <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white font-extrabold gap-2 px-6 rounded-xl">
                        <Save size={18} /> Simpan Selling Settings
                    </Button>
                </div>
            </form>
        </div>
    );
}
