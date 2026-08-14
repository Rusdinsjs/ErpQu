import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesPricingDataApi, type PricingRule, type CouponCode } from '../../api/sales-pricing-data';
import { salesSetupDataApi, type ShippingRule } from '../../api/sales-setup-data';
import { Button, Input, Table, TableHead, TableBody, TableRow, TableTh, TableTd, Modal } from '../../components/ui';
import { Tag, Ticket, Percent, Truck, Plus, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SalesPricingView() {
    const queryClient = useQueryClient();
    const [tab, setTab] = useState<'rules' | 'coupons' | 'shipping'>('rules');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [ruleName, setRuleName] = useState('');
    const [discountPercentage, setDiscountPercentage] = useState('10.0');

    const { data: rulesData } = useQuery({
        queryKey: ['sales', 'pricing-rules'],
        queryFn: salesPricingDataApi.listPricingRules,
        enabled: tab === 'rules',
    });

    const { data: couponsData } = useQuery({
        queryKey: ['sales', 'coupon-codes'],
        queryFn: salesPricingDataApi.listCouponCodes,
        enabled: tab === 'coupons',
    });

    const { data: shippingData } = useQuery({
        queryKey: ['sales', 'shipping-rules'],
        queryFn: salesSetupDataApi.listShippingRules,
        enabled: tab === 'shipping',
    });

    const rules: PricingRule[] = Array.isArray(rulesData?.data) ? rulesData.data : Array.isArray(rulesData) ? rulesData : [];
    const coupons: CouponCode[] = Array.isArray(couponsData?.data) ? couponsData.data : Array.isArray(couponsData) ? couponsData : [];
    const shippingRules: ShippingRule[] = Array.isArray(shippingData?.data) ? shippingData.data : Array.isArray(shippingData) ? shippingData : [];

    const createRuleMutation = useMutation({
        mutationFn: salesPricingDataApi.createPricingRule,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales', 'pricing-rules'] });
            setIsModalOpen(false);
            setRuleName('');
            toast.success('Aturan Diskon & Harga berhasil disimpan.');
        },
        onError: (err: any) => toast.error('Gagal: ' + err.message)
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (tab === 'rules') {
            if (!ruleName.trim()) return toast.error('Nama aturan harga wajib diisi.');
            createRuleMutation.mutate({
                title: ruleName,
                discount_percentage: parseFloat(discountPercentage) || 0,
                apply_on: 'Item Code',
            });
        }
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
                        <Tag className="text-orange-500" size={32} />
                        Aturan Harga, Diskon & Kupon Promosi
                    </h1>
                    <p className="text-muted-foreground mt-1">Otomatisasi skema diskon bertingkat, voucher kupon, dan kalkulasi ongkos kirim</p>
                </div>
                {tab === 'rules' && (
                    <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-lg shadow-orange-500/20">
                        <Plus size={18} />
                        Buat Aturan Diskon
                    </Button>
                )}
            </div>

            <div className="flex bg-muted p-1 rounded-xl w-fit border border-border">
                <button
                    onClick={() => setTab('rules')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === 'rules' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <Percent size={16} className="text-orange-500" />
                    Pricing Rules (Aturan Diskon)
                </button>
                <button
                    onClick={() => setTab('coupons')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === 'coupons' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <Ticket size={16} className="text-purple-500" />
                    Coupon Codes (Voucher)
                </button>
                <button
                    onClick={() => setTab('shipping')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === 'shipping' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <Truck size={16} className="text-blue-500" />
                    Shipping Rules (Biaya Kirim)
                </button>
            </div>

            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                {tab === 'rules' && (
                    <Table>
                        <TableHead>
                            <TableRow className="bg-muted/40">
                                <TableTh>Judul Aturan Diskon</TableTh>
                                <TableTh>Penerapan</TableTh>
                                <TableTh align="center">Besar Diskon (%)</TableTh>
                                <TableTh align="center">Status</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rules.map((row: PricingRule) => (
                                <TableRow key={row.id} className="hover:bg-muted/30">
                                    <TableTd className="font-semibold text-foreground">{row.title}</TableTd>
                                    <TableTd className="text-muted-foreground">{row.apply_on || 'Item Code'}</TableTd>
                                    <TableTd align="center" className="font-bold text-orange-600">{row.discount_percentage || 0}%</TableTd>
                                    <TableTd align="center">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 inline-flex items-center gap-1">
                                            <CheckCircle2 size={12} /> Aktif
                                        </span>
                                    </TableTd>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}

                {tab === 'coupons' && (
                    <Table>
                        <TableHead>
                            <TableRow className="bg-muted/40">
                                <TableTh>Kode Kupon Promo</TableTh>
                                <TableTh>Nama Kupon</TableTh>
                                <TableTh align="center">Status</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {coupons.map((row: CouponCode) => (
                                <TableRow key={row.id} className="hover:bg-muted/30">
                                    <TableTd className="font-mono font-bold text-purple-600">{row.coupon_code}</TableTd>
                                    <TableTd className="text-muted-foreground">{row.coupon_name || '-'}</TableTd>
                                    <TableTd align="center">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600">Aktif</span>
                                    </TableTd>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}

                {tab === 'shipping' && (
                    <Table>
                        <TableHead>
                            <TableRow className="bg-muted/40">
                                <TableTh>Nama Aturan Ongkir</TableTh>
                                <TableTh>Kalkulasi</TableTh>
                                <TableTh align="center">Status</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {shippingRules.map((row: ShippingRule) => (
                                <TableRow key={row.id} className="hover:bg-muted/30">
                                    <TableTd className="font-semibold text-foreground">{row.name}</TableTd>
                                    <TableTd className="text-muted-foreground">{row.calculate_based_on || 'Fixed'}</TableTd>
                                    <TableTd align="center">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600">Aktif</span>
                                    </TableTd>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Buat Aturan Diskon Penjualan (Pricing Rule)">
                <form onSubmit={handleCreate} className="space-y-4 pt-2">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Judul Aturan Diskon</label>
                        <Input placeholder="Contoh: Diskon Grosir Volume > 100 pcs" value={ruleName} onChange={(e) => setRuleName(e.target.value)} required />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Persentase Diskon (%)</label>
                        <Input type="number" step="0.1" value={discountPercentage} onChange={(e) => setDiscountPercentage(e.target.value)} required />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                        <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white">Simpan Aturan</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
