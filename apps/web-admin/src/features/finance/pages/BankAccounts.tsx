import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi, type BankAccount, type CreateBankAccountRequest } from'../api/finance';
import { Button, Input, Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableSkeleton, Modal } from'../../../components/ui';
import { Plus, Landmark, CheckCircle2, CreditCard, ArrowRightLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function BankAccounts() {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [accountName, setAccountName] = useState('');
    const [bankName, setBankName] = useState('');
    const [accountNo, setAccountNo] = useState('');
    const [swiftCode, setSwiftCode] = useState('');
    const [isDefault, setIsDefault] = useState(false);

    const { data: bankAccounts, isLoading } = useQuery({
        queryKey: ['finance', 'bank-accounts'],
        queryFn: financeApi.listBankAccounts,
    });

    const createMutation = useMutation({
        mutationFn: financeApi.createBankAccount,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finance', 'bank-accounts'] });
            setIsModalOpen(false);
            setAccountName('');
            setBankName('');
            setAccountNo('');
            setSwiftCode('');
            setIsDefault(false);
            toast.success('Rekening Bank berhasil didaftarkan.');
        },
        onError: (err: any) => {
            toast.error('Gagal menambahkan Rekening: ' + (err.message || 'Terjadi kesalahan'));
        }
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!accountName || !bankName || !accountNo) {
            toast.error('Lengkapi nama akun, bank, dan nomor rekening.');
            return;
        }

        createMutation.mutate({
            account_name: accountName,
            bank_name: bankName,
            bank_account_no: accountNo,
            swift_code: swiftCode || undefined,
            is_default: isDefault,
        });
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
                        <Landmark className="text-blue-500" size={32} />
                        Master Rekening Bank (Bank Accounts)
                    </h1>
                    <p className="text-muted-foreground mt-1">Daftar rekening bank operasional, kas utama, dan akun kliring perusahaan</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20">
                    <Plus size={18} />
                    Tambah Rekening Bank
                </Button>
            </div>

            {/* Grid of Bank Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(bankAccounts || []).map(b => (
                    <div key={b.id} className="p-6 rounded-2xl bg-gradient-to-br from-card to-muted/40 border border-border/60 shadow-sm relative overflow-hidden flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{b.bank_name}</span>
                                <h3 className="text-xl font-bold text-foreground mt-1">{b.account_name}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                <CreditCard size={20} />
                            </div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-border/40 flex justify-between items-end">
                            <div>
                                <span className="text-xs text-muted-foreground block">Nomor Rekening</span>
                                <span className="text-sm font-mono font-bold text-foreground tracking-wider">{b.bank_account_no}</span>
                            </div>
                            {b.is_default && (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600">
                                    Rekening Utama
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                {isLoading ? (
                    <TableSkeleton rows={4} cols={5} />
                ) : (bankAccounts || []).length === 0 ? (
                    <div className="text-center py-16">
                        <Landmark className="mx-auto text-muted-foreground mb-3" size={48} />
                        <h3 className="text-lg font-semibold text-foreground">Belum Ada Rekening Bank Terdaftar</h3>
                        <p className="text-sm text-muted-foreground mt-1">Klik tombol &apos;Tambah Rekening Bank&apos; untuk mendaftarkan akun bank perusahaan.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHead>
                            <TableRow className="bg-muted/40">
                                <TableTh>Nama Rekening</TableTh>
                                <TableTh>Nama Bank</TableTh>
                                <TableTh>Nomor Rekening</TableTh>
                                <TableTh>SWIFT Code</TableTh>
                                <TableTh align="center">Default / Utama</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {(bankAccounts || []).map(row => (
                                <TableRow key={row.id} className="hover:bg-muted/30">
                                    <TableTd className="font-semibold text-foreground">{row.account_name}</TableTd>
                                    <TableTd className="font-medium text-foreground">{row.bank_name}</TableTd>
                                    <TableTd className="font-mono text-muted-foreground">{row.bank_account_no}</TableTd>
                                    <TableTd className="text-muted-foreground">{row.swift_code || '-'}</TableTd>
                                    <TableTd align="center">
                                        {row.is_default ? (
                                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 inline-flex items-center gap-1">
                                                <CheckCircle2 size={12} /> Utama
                                            </span>
                                        ) : '-'}
                                    </TableTd>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Daftarkan Rekening Bank Baru">
                <form onSubmit={handleCreate} className="space-y-4 pt-2">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Nama Pemilik Akun / Rekening</label>
                        <Input placeholder="Contoh: BCA Operasional Utama PT SJS" value={accountName} onChange={(e) => setAccountName(e.target.value)} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Nama Bank</label>
                            <Input placeholder="Contoh: Bank Central Asia (BCA)" value={bankName} onChange={(e) => setBankName(e.target.value)} required />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Nomor Rekening</label>
                            <Input placeholder="123-456-7890" value={accountNo} onChange={(e) => setAccountNo(e.target.value)} required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">SWIFT / BIC Code (Opsional)</label>
                        <Input placeholder="CENAIDJA" value={swiftCode} onChange={(e) => setSwiftCode(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                        <input
                            type="checkbox"
                            id="isDefault"
                            checked={isDefault}
                            onChange={(e) => setIsDefault(e.target.checked)}
                            className="rounded border-border text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="isDefault" className="text-sm font-medium text-foreground cursor-pointer">
                            Jadikan sebagai rekening utama (default)
                        </label>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                        <Button type="submit" disabled={createMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
                            {createMutation.isPending ? 'Menyimpan...' : 'Simpan Rekening'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
