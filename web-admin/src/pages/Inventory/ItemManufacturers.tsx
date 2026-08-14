import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, Table, TableHead, TableBody, TableRow, TableTh, TableTd } from '../../components/ui';
import { Plus, Trash2 } from 'lucide-react';
import { masterDataExtendedApi, inventoryApi } from '../../api/inventory';
import { toast } from 'sonner';

export default function ItemManufacturers() {
    const companyId = '00000000-0000-0000-0000-000000000001';
    
    const [items, setItems] = useState<any[]>([]);
    const [manufacturers, setManufacturers] = useState<any[]>([]);
    const [itemManufacturers, setItemManufacturers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    
    // Form state
    const [formItemId, setFormItemId] = useState('');
    const [formManufacturerId, setFormManufacturerId] = useState('');
    const [manufacturerPartNo, setManufacturerPartNo] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [itemsData, mfgData] = await Promise.all([
                inventoryApi.listItems(),
                masterDataExtendedApi.listManufacturers('00000000-0000-0000-0000-000000000001')
            ]);
            setItems(itemsData || []);
            setManufacturers(mfgData || []);
        } catch (err) {
            console.error(err);
            toast.error('Gagal memuat data pabrikan.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await (masterDataExtendedApi as any).createItemManufacturer({ item_id: formItemId,
                manufacturer_id: formManufacturerId,
                manufacturer_part_no: manufacturerPartNo
            });
            toast.success('Pabrikan item berhasil ditambahkan.');
            setOpenDialog(false);
            setFormItemId('');
            setFormManufacturerId('');
            setManufacturerPartNo('');
        } catch (err: any) {
            toast.error('Gagal: ' + (err.message || 'Error'));
        }
    };

    return (
        <div className="p-8 max-w-6xl space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Item Manufacturers</h1>
                    <p className="text-sm text-muted-foreground mt-1">Kelola pabrikan resmi dan nomor part pabrikan untuk barang inventaris</p>
                </div>
                <Button onClick={() => setOpenDialog(true)} className="bg-primary text-white flex items-center gap-2">
                    <Plus size={16} /> Tambah Pabrikan Barang
                </Button>
            </div>

            <Card className="overflow-hidden">
                {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
                ) : items.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">Belum ada data barang.</div>
                ) : (
                    <Table>
                        <TableHead>
                            <TableRow className="bg-muted/40">
                                <TableTh>SKU</TableTh>
                                <TableTh>Nama Barang</TableTh>
                                <TableTh>Kategori</TableTh>
                                <TableTh align="center">Status</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {items.map((row: any) => (
                                <TableRow key={row.id}>
                                    <TableTd className="font-mono text-muted-foreground">{row.sku}</TableTd>
                                    <TableTd className="font-semibold text-foreground">{row.name}</TableTd>
                                    <TableTd className="text-muted-foreground">{row.category_name || '-'}</TableTd>
                                    <TableTd align="center">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600">
                                            Aktif
                                        </span>
                                    </TableTd>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Card>

            <Modal isOpen={openDialog} onClose={() => setOpenDialog(false)} title="Hubungkan Pabrikan ke Barang">
                <form onSubmit={handleCreate} className="space-y-4 pt-2">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Pilih Barang</label>
                        <select
                            value={formItemId}
                            onChange={(e) => setFormItemId(e.target.value)}
                            required
                            className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                        >
                            <option value="">-- Pilih Barang --</option>
                            {items.map(i => <option key={i.id} value={i.id}>{i.sku} - {i.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Pilih Pabrikan (Manufacturer)</label>
                        <select
                            value={formManufacturerId}
                            onChange={(e) => setFormManufacturerId(e.target.value)}
                            required
                            className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                        >
                            <option value="">-- Pilih Pabrikan --</option>
                            {manufacturers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Part Number Pabrikan</label>
                        <input
                            type="text"
                            placeholder="Contoh: MPN-998822"
                            value={manufacturerPartNo}
                            onChange={(e) => setManufacturerPartNo(e.target.value)}
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
