import React, { useState } from 'react';
import { Button } from'../../../components/ui';
import { Settings, Save, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function BuyingSettingsView() {
    const [poMandatoryForPI, setPoMandatoryForPI] = useState(true);
    const [prMandatoryForPO, setPrMandatoryForPO] = useState(true);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success('Pengaturan umum modul pengadaan & pembelian berhasil disimpan.');
    };

    return (
        <div className="p-8 space-y-6 max-w-4xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
                        <Settings className="text-blue-500" size={32} />
                        Pengaturan Umum Modul Pembelian (Buying Settings)
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Konfigurasi alur kerja pengadaan barang, keharusan Purchase Order (PO), dan verifikasi Purchase Receipt.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSave} className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="space-y-4">
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                        <ShieldCheck className="text-blue-500" size={20} /> Kebijakan Transaksi Pembelian & Supplier
                    </h3>
                    
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/40">
                        <div>
                            <p className="font-bold text-sm text-foreground">Wajibkan Material Request (PR) Sebelum Membuat Purchase Order</p>
                            <p className="text-xs text-muted-foreground">Penerbitan PO ke supplier wajib mereferensikan nomor Material Request dari departemen.</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={prMandatoryForPO}
                            onChange={(e) => setPrMandatoryForPO(e.target.checked)}
                            className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/40">
                        <div>
                            <p className="font-bold text-sm text-foreground">Wajibkan Purchase Order (PO) Sebelum Menginput Faktur Pembelian (Purchase Bill)</p>
                            <p className="text-xs text-muted-foreground">Faktur tagihan dari supplier wajib ditautkan ke PO yang telah disetujui.</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={poMandatoryForPI}
                            onChange={(e) => setPoMandatoryForPI(e.target.checked)}
                            className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-border">
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold gap-2 px-6 rounded-xl">
                        <Save size={18} /> Simpan Buying Settings
                    </Button>
                </div>
            </form>
        </div>
    );
}
