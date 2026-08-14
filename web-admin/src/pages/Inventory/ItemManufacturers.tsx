import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { masterDataExtendedApi } from '../../api/inventory';
import { itemsApi } from '../../api/items';
import { useToast } from '../../components/ui/toast-context';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../../components/ui/dialog";

export default function ItemManufacturers() {
    const { companyId } = useAuthStore();
    const { toast } = useToast();
    
    const [items, setItems] = useState<any[]>([]);
    const [manufacturers, setManufacturers] = useState<any[]>([]);
    
    // State for viewing item specific manufacturers
    const [selectedItemId, setSelectedItemId] = useState<string>('');
    const [itemManufacturers, setItemManufacturers] = useState<any[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    
    // Form state
    const [formItemId, setFormItemId] = useState('');
    const [formManufacturerId, setFormManufacturerId] = useState('');
    const [manufacturerPartNo, setManufacturerPartNo] = useState('');

    const fetchData = async () => {
        if (!companyId) return;
        setLoading(true);
        try {
            const [itemsData, mfgData] = await Promise.all([
                itemsApi.getItems(companyId),
                masterDataExtendedApi.listManufacturers(companyId)
            ]);
            setItems(itemsData || []);
            setManufacturers(mfgData || []);
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'Gagal memuat master data.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [companyId]);

    const fetchItemManufacturers = async (itemId: string) => {
        if (!itemId) {
            setItemManufacturers([]);
            return;
        }
        try {
            const data = await masterDataExtendedApi.getItemManufacturers(itemId);
            // Enrich with manufacturer names
            const enriched = (data || []).map((im: any) => {
                const mfg = manufacturers.find(m => m.id === im.manufacturer_id);
                return { ...im, manufacturer_name: mfg ? mfg.name : 'Unknown' };
            });
            setItemManufacturers(enriched);
        } catch (error) {
            toast({ title: 'Error', description: 'Gagal memuat daftar produsen untuk barang ini.', variant: 'destructive' });
        }
    };

    useEffect(() => {
        if (selectedItemId && manufacturers.length > 0) {
            fetchItemManufacturers(selectedItemId);
        } else {
            setItemManufacturers([]);
        }
    }, [selectedItemId, manufacturers]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await masterDataExtendedApi.createItemManufacturer({
                item_id: formItemId,
                manufacturer_id: formManufacturerId,
                manufacturer_part_no: manufacturerPartNo || null,
            });
            toast({ title: 'Berhasil', description: 'Produsen Barang berhasil ditambahkan.' });
            setOpenDialog(false);
            setFormItemId('');
            setFormManufacturerId('');
            setManufacturerPartNo('');
            
            // Refresh list if the added item matches the currently selected item filter
            if (formItemId === selectedItemId) {
                fetchItemManufacturers(selectedItemId);
            }
        } catch (error) {
            toast({ title: 'Gagal', description: 'Gagal menyimpan data.', variant: 'destructive' });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus relasi ini?')) return;
        try {
            await masterDataExtendedApi.deleteItemManufacturer(id);
            toast({ title: 'Terhapus', description: 'Relasi produsen berhasil dihapus.' });
            if (selectedItemId) {
                fetchItemManufacturers(selectedItemId);
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Gagal menghapus.', variant: 'destructive' });
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="p-6 max-w-5xl space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Item Manufacturers</h1>
                    <p className="text-muted-foreground">Tentukan produsen dan part number spesifik untuk setiap barang.</p>
                </div>
                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                    <DialogTrigger asChild>
                        <Button className="flex items-center gap-2">
                            <Plus className="h-4 w-4" /> Tambah Relasi
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Buat Relasi Barang - Produsen</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Barang</label>
                                <select
                                    required
                                    value={formItemId}
                                    onChange={(e) => setFormItemId(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                >
                                    <option value="" disabled>-- Pilih Barang --</option>
                                    {items.map(item => (
                                        <option key={item.id} value={item.id}>{item.item_code} - {item.item_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Produsen</label>
                                <select
                                    required
                                    value={formManufacturerId}
                                    onChange={(e) => setFormManufacturerId(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                >
                                    <option value="" disabled>-- Pilih Produsen --</option>
                                    {manufacturers.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Manufacturer Part No (Opsional)</label>
                                <input
                                    type="text"
                                    value={manufacturerPartNo}
                                    onChange={(e) => setManufacturerPartNo(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                    placeholder="Contoh: SN-74LS00"
                                />
                            </div>
                            <div className="pt-4 flex justify-end">
                                <Button type="submit">Simpan Relasi</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Filter berdasarkan Barang</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="max-w-md">
                        <select
                            value={selectedItemId}
                            onChange={(e) => setSelectedItemId(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                            <option value="">-- Pilih Barang untuk melihat daftar produsen --</option>
                            {items.map(item => (
                                <option key={item.id} value={item.id}>{item.item_code} - {item.item_name}</option>
                            ))}
                        </select>
                    </div>

                    {selectedItemId && (
                        <div className="mt-6 rounded-md border">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Nama Produsen</th>
                                        <th className="px-4 py-3 font-medium">Part Number</th>
                                        <th className="px-4 py-3 font-medium text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {itemManufacturers.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                                                Tidak ada produsen yang terhubung ke barang ini.
                                            </td>
                                        </tr>
                                    ) : (
                                        itemManufacturers.map((im: any) => (
                                            <tr key={im.id} className="border-t hover:bg-muted/50">
                                                <td className="px-4 py-3 font-medium">{im.manufacturer_name}</td>
                                                <td className="px-4 py-3">{im.manufacturer_part_no || '-'}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleDelete(im.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
