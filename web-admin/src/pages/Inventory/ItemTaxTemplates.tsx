import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { masterDataExtendedApi } from '../../api/inventory';
import { useToast } from '../../components/ui/toast-context';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../../components/ui/dialog";

export default function ItemTaxTemplates() {
    const { companyId } = useAuthStore();
    const { toast } = useToast();
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    
    // Form state
    const [title, setTitle] = useState('');
    const [taxRate, setTaxRate] = useState<number | ''>('');

    const fetchTemplates = async () => {
        if (!companyId) return;
        setLoading(true);
        try {
            const data = await masterDataExtendedApi.getItemTaxTemplates(companyId);
            setTemplates(data || []);
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'Gagal memuat template pajak.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, [companyId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!companyId) return;

        try {
            await masterDataExtendedApi.createItemTaxTemplate({
                company_id: companyId,
                title,
                tax_rate: taxRate ? Number(taxRate) : 0,
            });
            toast({ title: 'Berhasil', description: 'Template Pajak berhasil ditambahkan.' });
            setOpenDialog(false);
            setTitle('');
            setTaxRate('');
            fetchTemplates();
        } catch (error) {
            toast({ title: 'Gagal', description: 'Gagal menyimpan data.', variant: 'destructive' });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus template ini?')) return;
        try {
            await masterDataExtendedApi.deleteItemTaxTemplate(id);
            toast({ title: 'Terhapus', description: 'Template berhasil dihapus.' });
            fetchTemplates();
        } catch (error) {
            toast({ title: 'Error', description: 'Gagal menghapus.', variant: 'destructive' });
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="p-6 max-w-5xl space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Item Tax Templates</h1>
                    <p className="text-muted-foreground">Kelola persentase template pajak barang (contoh: PPN 11%).</p>
                </div>
                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                    <DialogTrigger asChild>
                        <Button className="flex items-center gap-2">
                            <Plus className="h-4 w-4" /> Tambah Template
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Buat Template Pajak Baru</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Nama Template</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Contoh: PPN 11%"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Persentase Pajak (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={taxRate}
                                    onChange={(e) => setTaxRate(Number(e.target.value))}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="11"
                                />
                            </div>
                            <div className="pt-4 flex justify-end">
                                <Button type="submit">Simpan Template</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Template Pajak</CardTitle>
                </CardHeader>
                <CardContent>
                    {templates.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">Belum ada template pajak.</div>
                    ) : (
                        <div className="rounded-md border">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Nama Template</th>
                                        <th className="px-4 py-3 font-medium">Tarif Pajak (%)</th>
                                        <th className="px-4 py-3 font-medium text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {templates.map((tpl: any) => (
                                        <tr key={tpl.id} className="border-t hover:bg-muted/50">
                                            <td className="px-4 py-3">{tpl.title}</td>
                                            <td className="px-4 py-3 font-mono">{Number(tpl.tax_rate).toFixed(2)}%</td>
                                            <td className="px-4 py-3 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleDelete(tpl.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
