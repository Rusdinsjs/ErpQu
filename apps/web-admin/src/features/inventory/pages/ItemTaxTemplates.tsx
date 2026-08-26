import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, Table, TableHead, TableBody, TableRow, TableTh, TableTd } from'../../../components/ui';
import { Plus } from 'lucide-react';
import { masterDataExtendedApi, inventoryApi } from'../api/inventory';
import { toast } from 'sonner';

export default function ItemTaxTemplates() {
    const [items, setItems] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    
    const [formTitle, setFormTitle] = useState('');
    const [formRate, setFormRate] = useState('11');

    const fetchData = async () => {
        setLoading(true);
        try {
            const itemsData = await inventoryApi.listItems();
            setItems(itemsData || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        setTemplates(prev => [...prev, { id: Date.now().toString(), title: formTitle, rate: parseFloat(formRate) || 0 }]);
        toast.success('Template pajak barang berhasil dibuat.');
        setOpenDialog(false);
        setFormTitle('');
        setFormRate('11');
    };

    return (
        <div className="p-8 max-w-6xl space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Item Tax Templates</h1>
                    <p className="text-sm text-muted-foreground mt-1">Konfigurasi tarif pajak pertambahan nilai (PPN) & pembebasan pajak per kategori barang</p>
                </div>
                <Button onClick={() => setOpenDialog(true)} className="bg-primary text-white flex items-center gap-2">
                    <Plus size={16} /> Tambah Template Pajak
                </Button>
            </div>

            <Card className="overflow-hidden">
                <Table>
                    <TableHead>
                        <TableRow className="bg-muted/40">
                            <TableTh>Nama Template Pajak</TableTh>
                            <TableTh align="center">Tarif Pajak (%)</TableTh>
                            <TableTh align="center">Status</TableTh>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            <TableTd className="font-semibold text-foreground">PPN Standar Barang 11%</TableTd>
                            <TableTd align="center" className="font-bold text-emerald-600">11%</TableTd>
                            <TableTd align="center">
                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600">Default</span>
                            </TableTd>
                        </TableRow>
                        <TableRow>
                            <TableTd className="font-semibold text-foreground">Bebas PPN (Non-BKP 0%)</TableTd>
                            <TableTd align="center" className="font-bold text-blue-600">0%</TableTd>
                            <TableTd align="center">
                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600">Aktif</span>
                            </TableTd>
                        </TableRow>
                        {templates.map((t) => (
                            <TableRow key={t.id}>
                                <TableTd className="font-semibold text-foreground">{t.title}</TableTd>
                                <TableTd align="center" className="font-bold text-emerald-600">{t.rate}%</TableTd>
                                <TableTd align="center">
                                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600">Aktif</span>
                                </TableTd>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            <Modal isOpen={openDialog} onClose={() => setOpenDialog(false)} title="Buat Template Pajak Barang">
                <form onSubmit={handleCreate} className="space-y-4 pt-2">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Nama Template Pajak</label>
                        <input
                            type="text"
                            placeholder="Contoh: PPh 22 Bahan Impor 2.5%"
                            value={formTitle}
                            onChange={(e) => setFormTitle(e.target.value)}
                            required
                            className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Tarif Pajak (%)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={formRate}
                            onChange={(e) => setFormRate(e.target.value)}
                            required
                            className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>Batal</Button>
                        <Button type="submit" className="bg-primary text-white">Simpan</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
