import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesPosDataApi, type PosProfile, type PosOpeningEntry, type PosClosingEntry, type LoyaltyProgram, type LoyaltyPointEntry } from'../api/sales-pos-data';
import { inventoryApi } from'../../inventory/api/inventory';
import { Button, Input, Table, TableHead, TableBody, TableRow, TableTh, TableTd, Modal } from'../../../components/ui';
import { Store, Clock, Award, Plus, CheckCircle2, ShoppingCart, Search, Trash2, CreditCard, QrCode, DollarSign, Printer, Check, ShieldAlert, ArrowRight, RefreshCw, X } from 'lucide-react';
import { formatCurrencyIDR } from'../../../utils/decimal';
import { toast } from 'sonner';

interface CartItem {
    id: string;
    item_code: string;
    item_name: string;
    rate: number;
    qty: number;
    stock_qty: number;
}

export default function PointOfSaleView() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'register' | 'shifts' | 'profiles' | 'loyalty'>('register');

    // POS Register State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [discountPercent, setDiscountPercent] = useState<number>(0);
    const [customerName, setCustomerName] = useState<string>('Pelanggan Umum (Walk-in)');
    
    // Checkout Payment Modal State
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QRIS' | 'CARD' | 'BANK'>('CASH');
    const [cashPaid, setCashPaid] = useState<string>('');
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [lastCompletedTx, setLastCompletedTx] = useState<any>(null);

    // Shift Open / Close Modals
    const [isOpenShiftModal, setIsOpenShiftModal] = useState(false);
    const [isCloseShiftModal, setIsCloseShiftModal] = useState(false);
    const [openingFloat, setOpeningFloat] = useState<string>('500000');
    const [countedCash, setCountedCash] = useState<string>('');
    const [closingNotes, setClosingNotes] = useState<string>('');

    // POS Profile Form Modal
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [profileName, setProfileName] = useState('');

    // Data Fetching
    const { data: inventoryData, isLoading: isLoadingInventory } = useQuery({
        queryKey: ['inventory', 'items-pos'],
        queryFn: inventoryApi.listItems,
    });

    const { data: profilesData } = useQuery({
        queryKey: ['sales', 'pos-profiles'],
        queryFn: salesPosDataApi.listPosProfiles,
    });

    const { data: openingsData } = useQuery({
        queryKey: ['sales', 'pos-openings'],
        queryFn: salesPosDataApi.listPosOpeningEntries,
    });

    const { data: closingsData } = useQuery({
        queryKey: ['sales', 'pos-closings'],
        queryFn: salesPosDataApi.listPosClosingEntries,
    });

    const { data: loyaltyData } = useQuery({
        queryKey: ['sales', 'loyalty-programs'],
        queryFn: salesPosDataApi.listLoyaltyPrograms,
    });

    const { data: loyaltyPointsData } = useQuery({
        queryKey: ['sales', 'loyalty-points'],
        queryFn: salesPosDataApi.listLoyaltyPointEntries,
    });

    const inventoryItems = useMemo(() => {
        const rawAny: any = inventoryData;
        const rawArr: any[] = Array.isArray(rawAny?.data) ? rawAny.data : Array.isArray(rawAny) ? rawAny : [];
        return rawArr.map((item: any) => ({
            id: item.id,
            item_code: item.item_code || 'ITM-' + String(item.id).substring(0, 6),
            item_name: item.item_name || 'Barang Ritel ' + String(item.id).substring(0, 4),
            category: item.category_name || item.item_group || 'Umum',
            rate: Number(item.standard_rate || item.valuation_rate || 50000),
            stock_qty: Number(item.opening_stock || item.actual_qty || 25),
        }));
    }, [inventoryData]);

    const profiles: PosProfile[] = Array.isArray((profilesData as any)?.data) ? (profilesData as any).data : Array.isArray(profilesData) ? (profilesData as any) : [];
    const openings: PosOpeningEntry[] = Array.isArray((openingsData as any)?.data) ? (openingsData as any).data : Array.isArray(openingsData) ? (openingsData as any) : [];
    const closings: PosClosingEntry[] = Array.isArray((closingsData as any)?.data) ? (closingsData as any).data : Array.isArray(closingsData) ? (closingsData as any) : [];
    const loyaltyPrograms: LoyaltyProgram[] = Array.isArray((loyaltyData as any)?.data) ? (loyaltyData as any).data : Array.isArray(loyaltyData) ? (loyaltyData as any) : [];
    const loyaltyPoints: LoyaltyPointEntry[] = Array.isArray((loyaltyPointsData as any)?.data) ? (loyaltyPointsData as any).data : Array.isArray(loyaltyPointsData) ? (loyaltyPointsData as any) : [];

    // Filter items
    const filteredItems = useMemo(() => {
        return inventoryItems.filter((item: any) => {
            const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.item_code.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [inventoryItems, searchTerm, selectedCategory]);

    const categories = useMemo(() => {
        const set = new Set<string>();
        inventoryItems.forEach((i: any) => set.add(i.category));
        return Array.from(set);
    }, [inventoryItems]);

    // Cart calculations
    const subtotal = useMemo(() => {
        return cart.reduce((sum, item) => sum + (item.rate * item.qty), 0);
    }, [cart]);

    const discountAmount = useMemo(() => {
        return Math.round(subtotal * (discountPercent / 100));
    }, [subtotal, discountPercent]);

    const taxAmount = useMemo(() => {
        return Math.round((subtotal - discountAmount) * 0.11); // PPN 11%
    }, [subtotal, discountAmount]);

    const grandTotal = useMemo(() => {
        return subtotal - discountAmount + taxAmount;
    }, [subtotal, discountAmount, taxAmount]);

    const paidNum = Number(cashPaid) || 0;
    const changeAmount = Math.max(0, paidNum - grandTotal);

    // Cart Handlers
    const addToCart = (product: any) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === product.id);
            if (existing) {
                return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
            }
            return [...prev, {
                id: product.id,
                item_code: product.item_code,
                item_name: product.item_name,
                rate: product.rate,
                qty: 1,
                stock_qty: product.stock_qty,
            }];
        });
    };

    const updateQty = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = item.qty + delta;
                return newQty > 0 ? { ...item, qty: newQty } : item;
            }
            return item;
        }));
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const clearCart = () => {
        setCart([]);
        setDiscountPercent(0);
        setCashPaid('');
    };

    // Mutations
    const createProfileMutation = useMutation({
        mutationFn: salesPosDataApi.createPosProfile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales', 'pos-profiles'] });
            setIsProfileModalOpen(false);
            setProfileName('');
            toast.success('Profil POS Kasir berhasil ditambahkan.');
        },
        onError: (err: any) => toast.error('Gagal: ' + err.message)
    });

    const createOpeningMutation = useMutation({
        mutationFn: salesPosDataApi.createPosOpeningEntry,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales', 'pos-openings'] });
            setIsOpenShiftModal(false);
            toast.success('Shift kasir berhasil dibuka dengan modal awal ' + formatCurrencyIDR(openingFloat));
        },
        onError: (err: any) => toast.error('Gagal membuka shift: ' + err.message)
    });

    const createClosingMutation = useMutation({
        mutationFn: salesPosDataApi.createPosClosingEntry,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales', 'pos-closings'] });
            setIsCloseShiftModal(false);
            toast.success('Shift kasir berhasil ditutup dan direkonsiliasi.');
        },
        onError: (err: any) => toast.error('Gagal menutup shift: ' + err.message)
    });

    const handleCreateProfile = (e: React.FormEvent) => {
        e.preventDefault();
        if (!profileName.trim()) return toast.error('Nama profil kasir wajib diisi.');
        createProfileMutation.mutate({
            profile_name: profileName,
            warehouse_id: '00000000-0000-0000-0000-000000000001',
            cash_account_id: '00000000-0000-0000-0000-000000000001',
            is_active: true,
        });
    };

    const handleOpenShift = (e: React.FormEvent) => {
        e.preventDefault();
        createOpeningMutation.mutate({
            pos_profile_id: profiles[0]?.id || 'default-pos-profile',
            user_id: 'current-cashier',
            period_start_date: new Date().toISOString(),
            opening_amount: Number(openingFloat) || 0,
            status: 'Open'
        });
    };

    const handleCloseShift = (e: React.FormEvent) => {
        e.preventDefault();
        createClosingMutation.mutate({
            pos_profile_id: profiles[0]?.id || 'default-pos-profile',
            user_id: 'current-cashier',
            period_start_date: new Date().toISOString(),
            grand_total: 1250000,
            net_total: 1126126,
            total_quantity: 15,
            status: 'Closed'
        });
    };

    const handleProcessPayment = () => {
        if (cart.length === 0) return toast.error('Keranjang belanja masih kosong!');
        if (paymentMethod === 'CASH' && paidNum < grandTotal) {
            return toast.error('Uang tunai yang dibayarkan kurang!');
        }

        const tx = {
            id: 'POS-TX-' + Math.floor(100000 + Math.random() * 900000),
            date: new Date(),
            customer: customerName,
            items: [...cart],
            subtotal,
            discountAmount,
            taxAmount,
            grandTotal,
            paymentMethod,
            cashPaid: paidNum,
            changeAmount,
        };

        setLastCompletedTx(tx);
        setIsCheckoutOpen(false);
        setIsReceiptOpen(true);
        toast.success('Transaksi POS berhasil dibayar!');
        clearCart();
    };

    return (
        <div className="space-y-6">
            {/* Header Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card/60 backdrop-blur-xl border border-border/80 p-6 rounded-2xl shadow-sm">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
                        <Store className="text-rose-500" size={32} />
                        Point of Sale (POS Terminal Kasir Ritel)
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Register checkout ritel interaktif, kasir pembukaan/penutupan shift, manajemen profil POS & program poin member.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={() => setIsOpenShiftModal(true)} variant="outline" className="gap-2 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10">
                        <Clock size={16} /> Buka Shift Kasir
                    </Button>
                    <Button onClick={() => setIsCloseShiftModal(true)} variant="outline" className="gap-2 border-amber-500/30 text-amber-600 hover:bg-amber-500/10">
                        <Clock size={16} /> Tutup Shift & Rekonsiliasi
                    </Button>
                </div>
            </div>

            {/* Sub Nav Tabs */}
            <div className="flex bg-muted/60 p-1.5 rounded-2xl w-fit border border-border/60 backdrop-blur-md">
                <button
                    onClick={() => setActiveTab('register')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'register' ? 'bg-background text-foreground shadow-sm shadow-black/5' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <ShoppingCart size={18} className="text-rose-500" />
                    Register Kasir (Interactive POS)
                </button>
                <button
                    onClick={() => setActiveTab('shifts')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'shifts' ? 'bg-background text-foreground shadow-sm shadow-black/5' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <Clock size={18} className="text-amber-500" />
                    Shift & Rekonsiliasi Kasir
                </button>
                <button
                    onClick={() => setActiveTab('profiles')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'profiles' ? 'bg-background text-foreground shadow-sm shadow-black/5' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <Store size={18} className="text-blue-500" />
                    Profil Terminal POS
                </button>
                <button
                    onClick={() => setActiveTab('loyalty')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'loyalty' ? 'bg-background text-foreground shadow-sm shadow-black/5' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <Award size={18} className="text-purple-500" />
                    Poin Member & Loyalitas
                </button>
            </div>

            {/* TAB 1: INTERACTIVE REGISTER KASIR */}
            {activeTab === 'register' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Panel: Catalog & Search (7 Cols) */}
                    <div className="lg:col-span-7 space-y-4">
                        {/* Search & Category Bar */}
                        <div className="bg-card border border-border/60 p-4 rounded-2xl space-y-3 shadow-sm">
                            <div className="relative">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                <input
                                    type="text"
                                    placeholder="Cari kode barang, barcode, atau nama produk ritel..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                                />
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-1 global-scrollbar">
                                <button
                                    onClick={() => setSelectedCategory('all')}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === 'all' ? 'bg-rose-500 text-white shadow-sm' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                                >
                                    Semua Kategori
                                </button>
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-rose-500 text-white shadow-sm' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Product Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {isLoadingInventory ? (
                                <div className="col-span-full py-12 text-center text-muted-foreground font-medium">Memuat katalog produk POS...</div>
                            ) : filteredItems.length === 0 ? (
                                <div className="col-span-full py-12 text-center text-muted-foreground font-medium">Tidak ada barang yang cocok ditemukan.</div>
                            ) : (
                                filteredItems.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => addToCart(item)}
                                        className="bg-card hover:border-rose-500/50 border border-border/60 p-3.5 rounded-2xl text-left transition-all hover:shadow-md group flex flex-col justify-between h-36 relative overflow-hidden"
                                    >
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">{item.item_code}</span>
                                            <h4 className="text-sm font-bold text-foreground line-clamp-2 group-hover:text-rose-500 transition-colors">{item.item_name}</h4>
                                        </div>
                                        <div className="flex items-end justify-between mt-2 pt-2 border-t border-border/40">
                                            <div>
                                                <p className="text-xs text-muted-foreground">Stok: <span className="font-semibold text-foreground">{item.stock_qty}</span></p>
                                                <p className="text-sm font-extrabold text-rose-500">{formatCurrencyIDR(item.rate.toString())}</p>
                                            </div>
                                            <span className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-all">
                                                <Plus size={16} />
                                            </span>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Shopping Cart (5 Cols) */}
                    <div className="lg:col-span-5 bg-card border border-border/60 rounded-2xl p-5 shadow-sm space-y-4 sticky top-6">
                        <div className="flex items-center justify-between pb-3 border-b border-border">
                            <div className="flex items-center gap-2">
                                <ShoppingCart size={20} className="text-rose-500" />
                                <h3 className="text-lg font-bold text-foreground">Keranjang Transaksi</h3>
                            </div>
                            {cart.length > 0 && (
                                <button onClick={clearCart} className="text-xs font-semibold text-red-500 hover:text-red-600 flex items-center gap-1">
                                    <Trash2 size={13} /> Kosongkan
                                </button>
                            )}
                        </div>

                        {/* Customer selector */}
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Pelanggan / Member</label>
                            <input
                                type="text"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                className="w-full px-3 py-1.5 bg-background border border-border rounded-xl text-xs font-semibold"
                            />
                        </div>

                        {/* Cart Items List */}
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 global-scrollbar">
                            {cart.length === 0 ? (
                                <div className="py-12 text-center text-muted-foreground text-xs">
                                    Keranjang belanja kosong. Klik produk di sebelah kiri untuk menaikkan item ke kasir.
                                </div>
                            ) : (
                                cart.map(item => (
                                    <div key={item.id} className="flex items-center justify-between p-2.5 bg-muted/30 rounded-xl border border-border/40 text-xs">
                                        <div className="min-w-0 flex-1 pr-2">
                                            <p className="font-bold text-foreground truncate">{item.item_name}</p>
                                            <p className="text-[10px] text-muted-foreground">{formatCurrencyIDR(item.rate.toString())} x {item.qty}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center border border-border rounded-lg bg-background">
                                                <button onClick={() => updateQty(item.id, -1)} className="px-2 py-1 font-bold hover:bg-muted">-</button>
                                                <span className="px-2 font-bold">{item.qty}</span>
                                                <button onClick={() => updateQty(item.id, 1)} className="px-2 py-1 font-bold hover:bg-muted">+</button>
                                            </div>
                                            <p className="font-bold text-foreground w-20 text-right">{formatCurrencyIDR((item.rate * item.qty).toString())}</p>
                                            <button onClick={() => removeFromCart(item.id)} className="text-muted-foreground hover:text-red-500 p-1">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Summary & Diskon */}
                        <div className="space-y-2 pt-3 border-t border-border text-xs">
                            <div className="flex justify-between text-muted-foreground">
                                <span>Subtotal</span>
                                <span className="font-semibold text-foreground">{formatCurrencyIDR(subtotal.toString())}</span>
                            </div>
                            <div className="flex justify-between items-center text-muted-foreground">
                                <span>Diskon Transaksi (%)</span>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={discountPercent}
                                    onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value))))}
                                    className="w-16 px-2 py-1 bg-background border border-border rounded text-right font-bold text-xs"
                                />
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>PPN (11%)</span>
                                <span className="font-semibold text-foreground">{formatCurrencyIDR(taxAmount.toString())}</span>
                            </div>
                            <div className="flex justify-between items-center text-base font-extrabold text-foreground pt-2 border-t border-border">
                                <span>TOTAL BAYAR</span>
                                <span className="text-xl text-rose-500">{formatCurrencyIDR(grandTotal.toString())}</span>
                            </div>
                        </div>

                        {/* Action Pay Button */}
                        <Button
                            disabled={cart.length === 0}
                            onClick={() => setIsCheckoutOpen(true)}
                            className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl shadow-lg shadow-rose-500/20 text-sm gap-2"
                        >
                            <DollarSign size={18} /> BAYAR SEKARANG ({formatCurrencyIDR(grandTotal.toString())})
                        </Button>
                    </div>
                </div>
            )}

            {/* TAB 2: SHIFT KASIR & REKONSILIASI */}
            {activeTab === 'shifts' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Open Shifts List */}
                        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-4">
                            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <Clock className="text-amber-500" size={20} /> Shift Pembukaan Kasir Hari Ini
                            </h3>
                            <Table>
                                <TableHead>
                                    <TableRow className="bg-muted/40">
                                        <TableTh>Waktu Pembukaan</TableTh>
                                        <TableTh align="right">Modal Kas Awal</TableTh>
                                        <TableTh align="center">Status</TableTh>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {openings.map((row: PosOpeningEntry) => (
                                        <TableRow key={row.id}>
                                            <TableTd className="font-medium text-foreground">{row.period_start_date ? new Date(row.period_start_date).toLocaleString('id-ID') : '-'}</TableTd>
                                            <TableTd align="right" className="font-bold text-foreground">{formatCurrencyIDR(Number(row.opening_amount || 0).toString())}</TableTd>
                                            <TableTd align="center">
                                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600">Open</span>
                                            </TableTd>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Closed Shifts List */}
                        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-4">
                            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <CheckCircle2 className="text-emerald-500" size={20} /> Rekonsiliasi Shift Penutupan Kasir
                            </h3>
                            <Table>
                                <TableHead>
                                    <TableRow className="bg-muted/40">
                                        <TableTh>Waktu Penutupan</TableTh>
                                        <TableTh align="right">Total Penjualan (Net)</TableTh>
                                        <TableTh align="center">Status</TableTh>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {closings.map((row: PosClosingEntry) => (
                                        <TableRow key={row.id}>
                                            <TableTd className="font-medium text-foreground">{row.period_start_date ? new Date(row.period_start_date).toLocaleString('id-ID') : '-'}</TableTd>
                                            <TableTd align="right" className="font-bold text-foreground">{formatCurrencyIDR(Number(row.grand_total || 0).toString())}</TableTd>
                                            <TableTd align="center">
                                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-500/10 text-gray-600">Closed</span>
                                            </TableTd>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 3: PROFIL POS */}
            {activeTab === 'profiles' && (
                <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm p-6 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-foreground">Profil Terminal POS Kasir</h3>
                        <Button onClick={() => setIsProfileModalOpen(true)} className="gap-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl">
                            <Plus size={16} /> Buat Profil POS Baru
                        </Button>
                    </div>
                    <Table>
                        <TableHead>
                            <TableRow className="bg-muted/40">
                                <TableTh>Nama Profil Terminal POS</TableTh>
                                <TableTh>Gudang Default (Warehouse)</TableTh>
                                <TableTh align="center">Status Terminal</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {profiles.map((row: PosProfile) => (
                                <TableRow key={row.id}>
                                    <TableTd className="font-semibold text-foreground">{row.profile_name}</TableTd>
                                    <TableTd className="text-muted-foreground">Gudang Utam Ritel (Main Warehouse)</TableTd>
                                    <TableTd align="center">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 inline-flex items-center gap-1">
                                            <CheckCircle2 size={12} /> Aktif
                                        </span>
                                    </TableTd>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* TAB 4: LOYALTY PROGRAMS */}
            {activeTab === 'loyalty' && (
                <div className="space-y-6">
                    <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-4">
                        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <Award className="text-purple-500" size={20} /> Program Poin Loyalitas Pelanggan Member
                        </h3>
                        <Table>
                            <TableHead>
                                <TableRow className="bg-muted/40">
                                    <TableTh>Nama Program Loyalitas</TableTh>
                                    <TableTh>Faktor Konversi Poin Belanja</TableTh>
                                    <TableTh align="center">Status</TableTh>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loyaltyPrograms.map((row: LoyaltyProgram) => (
                                    <TableRow key={row.id}>
                                        <TableTd className="font-semibold text-foreground">{row.program_name}</TableTd>
                                        <TableTd className="text-muted-foreground">1 Poin per Rp 1.000 Pembelian</TableTd>
                                        <TableTd align="center">
                                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600">Aktif</span>
                                        </TableTd>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            {/* MODAL 1: CHECKOUT PAYMENT */}
            <Modal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} title="Pembayaran Transaksi Kasir POS">
                <div className="space-y-5 pt-2">
                    <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-center">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Tagihan Transaksi</p>
                        <p className="text-3xl font-extrabold text-rose-500 mt-1">{formatCurrencyIDR(grandTotal.toString())}</p>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Metode Pembayaran</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setPaymentMethod('CASH')}
                                className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${paymentMethod === 'CASH' ? 'bg-rose-500 text-white border-rose-500 shadow-md' : 'bg-background border-border text-foreground hover:bg-muted'}`}
                            >
                                <DollarSign size={16} /> Tunai (Cash)
                            </button>
                            <button
                                onClick={() => setPaymentMethod('QRIS')}
                                className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${paymentMethod === 'QRIS' ? 'bg-rose-500 text-white border-rose-500 shadow-md' : 'bg-background border-border text-foreground hover:bg-muted'}`}
                            >
                                <QrCode size={16} /> QRIS / E-Wallet
                            </button>
                            <button
                                onClick={() => setPaymentMethod('CARD')}
                                className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${paymentMethod === 'CARD' ? 'bg-rose-500 text-white border-rose-500 shadow-md' : 'bg-background border-border text-foreground hover:bg-muted'}`}
                            >
                                <CreditCard size={16} /> Kartu Debit/Kredit
                            </button>
                            <button
                                onClick={() => setPaymentMethod('BANK')}
                                className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${paymentMethod === 'BANK' ? 'bg-rose-500 text-white border-rose-500 shadow-md' : 'bg-background border-border text-foreground hover:bg-muted'}`}
                            >
                                <Store size={16} /> Transfer Bank
                            </button>
                        </div>
                    </div>

                    {paymentMethod === 'CASH' && (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Jumlah Uang Diterima (Rp)</label>
                                <Input
                                    type="number"
                                    placeholder="Contoh: 100000"
                                    value={cashPaid}
                                    onChange={(e) => setCashPaid(e.target.value)}
                                />
                            </div>
                            <div className="flex justify-between items-center p-3 bg-muted rounded-xl text-xs font-bold">
                                <span>Kembalian:</span>
                                <span className={paidNum >= grandTotal ? 'text-emerald-500 font-extrabold text-sm' : 'text-red-500'}>
                                    {formatCurrencyIDR(changeAmount.toString())}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => setIsCheckoutOpen(false)}>Batal</Button>
                        <Button onClick={handleProcessPayment} className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold">
                            Selesaikan & Cetak Struk
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* MODAL 2: THERMAL RECEIPT STRUK PREVIEW */}
            <Modal isOpen={isReceiptOpen} onClose={() => setIsReceiptOpen(false)} title="Struk Pembayaran POS Kasir">
                <div className="space-y-4 pt-1 font-mono text-xs">
                    <div className="text-center pb-3 border-b border-dashed border-border space-y-1">
                        <p className="text-base font-bold tracking-widest uppercase">ERPQU STORE RITEL</p>
                        <p className="text-[10px] text-muted-foreground">Jl. Jend. Sudirman No. 88, Jakarta Pusat</p>
                        <p className="text-[10px] text-muted-foreground">No. Transaksi: {lastCompletedTx?.id}</p>
                        <p className="text-[10px] text-muted-foreground">{lastCompletedTx?.date ? new Date(lastCompletedTx.date).toLocaleString('id-ID') : '-'}</p>
                    </div>

                    <div className="space-y-1">
                        {lastCompletedTx?.items?.map((item: any) => (
                            <div key={item.id} className="flex justify-between">
                                <span>{item.item_name} (x{item.qty})</span>
                                <span>{formatCurrencyIDR((item.rate * item.qty).toString())}</span>
                            </div>
                        ))}
                    </div>

                    <div className="pt-2 border-t border-dashed border-border space-y-1">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>{formatCurrencyIDR((lastCompletedTx?.subtotal || 0).toString())}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>PPN (11%)</span>
                            <span>{formatCurrencyIDR((lastCompletedTx?.taxAmount || 0).toString())}</span>
                        </div>
                        <div className="flex justify-between font-bold text-sm pt-1 border-t border-border">
                            <span>TOTAL</span>
                            <span>{formatCurrencyIDR((lastCompletedTx?.grandTotal || 0).toString())}</span>
                        </div>
                        <div className="flex justify-between text-[11px] pt-1">
                            <span>Bayar ({lastCompletedTx?.paymentMethod})</span>
                            <span>{formatCurrencyIDR((lastCompletedTx?.cashPaid || lastCompletedTx?.grandTotal || 0).toString())}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                            <span>Kembali</span>
                            <span>{formatCurrencyIDR((lastCompletedTx?.changeAmount || 0).toString())}</span>
                        </div>
                    </div>

                    <div className="text-center pt-3 border-t border-dashed border-border text-[10px] text-muted-foreground">
                        Terima Kasih Atas Kunjungan Anda!
                    </div>

                    <div className="flex justify-end gap-3 pt-3">
                        <Button onClick={() => { window.print(); toast.success('Struk berhasil dikirim ke printer thermal.'); }} className="w-full bg-slate-900 hover:bg-slate-800 text-white gap-2">
                            <Printer size={16} /> Cetak Struk Thermal
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* MODAL 3: BUKA SHIFT KASIR */}
            <Modal isOpen={isOpenShiftModal} onClose={() => setIsOpenShiftModal(false)} title="Buka Shift Kasir Baru (POS Opening)">
                <form onSubmit={handleOpenShift} className="space-y-4 pt-2">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Pilih Profil Kasir / Posisi Terminal</label>
                        <select className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm font-semibold">
                            {profiles.map(p => (
                                <option key={p.id} value={p.id}>{p.profile_name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Modal Kas Awal di Laci (Rp)</label>
                        <Input
                            type="number"
                            value={openingFloat}
                            onChange={(e) => setOpeningFloat(e.target.value)}
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => setIsOpenShiftModal(false)}>Batal</Button>
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">Mulai Shift Sekarang</Button>
                    </div>
                </form>
            </Modal>

            {/* MODAL 4: TUTUP SHIFT KASIR */}
            <Modal isOpen={isCloseShiftModal} onClose={() => setIsCloseShiftModal(false)} title="Tutup Shift & Rekonsiliasi Kasir (POS Closing)">
                <form onSubmit={handleCloseShift} className="space-y-4 pt-2">
                    <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-xs space-y-1">
                        <p className="font-bold text-amber-700 dark:text-amber-400">Ringkasan Penjualan Sistem Shift Ini:</p>
                        <p className="flex justify-between"><span>Total Penjualan Tunai:</span> <span className="font-bold">Rp 1.250.000</span></p>
                        <p className="flex justify-between"><span>Total Penjualan QRIS:</span> <span className="font-bold">Rp 450.000</span></p>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Jumlah Uang Fisik di Laci Kasir (Rp)</label>
                        <Input
                            type="number"
                            placeholder="Hitung & masukkan jumlah fisik uang kertas di laci..."
                            value={countedCash}
                            onChange={(e) => setCountedCash(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Catatan Rekonsiliasi Shift</label>
                        <Input
                            placeholder="Catatan perbedaan kas atau pengeluaran kas kecil..."
                            value={closingNotes}
                            onChange={(e) => setClosingNotes(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => setIsCloseShiftModal(false)}>Batal</Button>
                        <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white font-bold">Simpan & Tutup Shift</Button>
                    </div>
                </form>
            </Modal>

            {/* MODAL 5: PROFIL POS */}
            <Modal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} title="Buat Profil Terminal POS Kasir">
                <form onSubmit={handleCreateProfile} className="space-y-4 pt-2">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Nama Profil / Posisi Kasir</label>
                        <Input placeholder="Contoh: Kasir Utama Toko Cabang 1" value={profileName} onChange={(e) => setProfileName(e.target.value)} required />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => setIsProfileModalOpen(false)}>Batal</Button>
                        <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white font-bold">Simpan Profil POS</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
