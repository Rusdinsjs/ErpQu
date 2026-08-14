import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, ShieldCheck, Tag } from 'lucide-react';
import { hrLeavesApi, type HrLeaveType } from '../../../api/hr-leaves';
import {
    Button, Card, Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableEmpty,
    Badge, ActionIcon, Modal, Input, useToast, LoadingOverlay,
} from '../../../components/ui';

export default function LeaveTypesView() {
    const qc = useQueryClient();
    const { success, error: showError } = useToast();
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<HrLeaveType | null>(null);

    const [form, setForm] = useState({
        name: '',
        code: '',
        description: '',
        max_days_allowed: 12,
        is_carry_forward: false,
        max_carry_forward_days: 0,
        is_encashable: false,
        is_unpaid: false,
        allow_half_day: true,
        color: '#10B981',
    });

    const { data: types = [], isLoading } = useQuery({
        queryKey: ['hr-leave-types'],
        queryFn: hrLeavesApi.listTypes,
    });

    const createMutation = useMutation({
        mutationFn: hrLeavesApi.createType,
        onSuccess: () => {
            success('Jenis cuti berhasil dibuat');
            qc.invalidateQueries({ queryKey: ['hr-leave-types'] });
            setModalOpen(false);
            resetForm();
        },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal membuat jenis cuti'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => hrLeavesApi.updateType(id, data),
        onSuccess: () => {
            success('Jenis cuti berhasil diperbarui');
            qc.invalidateQueries({ queryKey: ['hr-leave-types'] });
            setModalOpen(false);
            resetForm();
        },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal memperbarui jenis cuti'),
    });

    const deleteMutation = useMutation({
        mutationFn: hrLeavesApi.deleteType,
        onSuccess: () => {
            success('Jenis cuti dinonaktifkan');
            qc.invalidateQueries({ queryKey: ['hr-leave-types'] });
        },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal menonaktifkan'),
    });

    const resetForm = () => {
        setForm({
            name: '',
            code: '',
            description: '',
            max_days_allowed: 12,
            is_carry_forward: false,
            max_carry_forward_days: 0,
            is_encashable: false,
            is_unpaid: false,
            allow_half_day: true,
            color: '#10B981',
        });
        setEditing(null);
    };

    const openEdit = (t: HrLeaveType) => {
        setEditing(t);
        setForm({
            name: t.name,
            code: t.code,
            description: t.description || '',
            max_days_allowed: t.max_days_allowed,
            is_carry_forward: t.is_carry_forward,
            max_carry_forward_days: t.max_carry_forward_days,
            is_encashable: t.is_encashable,
            is_unpaid: t.is_unpaid,
            allow_half_day: t.allow_half_day,
            color: t.color || '#10B981',
        });
        setModalOpen(true);
    };

    const handleSubmit = () => {
        if (!form.name || !form.code) {
            showError('Nama dan kode jenis cuti wajib diisi');
            return;
        }
        if (editing) {
            updateMutation.mutate({ id: editing.id, data: form });
        } else {
            createMutation.mutate(form);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Tag className="h-6 w-6 text-teal-400" />
                        Master Jenis Cuti (Leave Types)
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Kebijakan hak cuti berbayar, cuti khusus, carry-forward, dan encashment</p>
                </div>
                <Button onClick={() => { resetForm(); setModalOpen(true); }} leftIcon={<Plus className="h-4 w-4" />} variant="filled" color="teal">
                    Tambah Jenis Cuti
                </Button>
            </div>

            <Card>
                <div className="relative">
                    {isLoading && <LoadingOverlay />}
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableTh>Nama Jenis Cuti</TableTh>
                                <TableTh>Kode</TableTh>
                                <TableTh>Batas Maksimum</TableTh>
                                <TableTh>Carry Forward</TableTh>
                                <TableTh>Encashment</TableTh>
                                <TableTh>Tipe Upah</TableTh>
                                <TableTh className="text-right">Aksi</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {types.length === 0 ? (
                                <TableEmpty colSpan={7} message="Belum ada master jenis cuti" />
                            ) : types.map(t => (
                                <TableRow key={t.id}>
                                    <TableTd className="font-medium text-white flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color || '#10B981' }} />
                                        {t.name}
                                    </TableTd>
                                    <TableTd><span className="font-mono text-xs bg-white/10 px-2 py-1 rounded">{t.code}</span></TableTd>
                                    <TableTd className="font-semibold text-white">{t.max_days_allowed} Hari / Tahun</TableTd>
                                    <TableTd>
                                        {t.is_carry_forward ? (
                                            <Badge color="green">Maks {t.max_carry_forward_days} Hari</Badge>
                                        ) : (
                                            <Badge color="gray">Tidak</Badge>
                                        )}
                                    </TableTd>
                                    <TableTd>
                                        {t.is_encashable ? <Badge color="blue">Bisa Diuangkan</Badge> : <Badge color="gray">Hangus</Badge>}
                                    </TableTd>
                                    <TableTd>
                                        {t.is_unpaid ? <Badge color="yellow">Tanpa Upah</Badge> : <Badge color="green">Dibayar Penuh</Badge>}
                                    </TableTd>
                                    <TableTd className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <ActionIcon onClick={() => openEdit(t)} title="Edit"><Edit className="h-4 w-4" /></ActionIcon>
                                            <ActionIcon onClick={() => { if (confirm('Nonaktifkan jenis cuti ini?')) deleteMutation.mutate(t.id); }} title="Hapus" color="red"><Trash2 className="h-4 w-4" /></ActionIcon>
                                        </div>
                                    </TableTd>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            <Modal isOpen={modalOpen} opened={modalOpen} onClose={() => { setModalOpen(false); resetForm(); }} title={editing ? 'Edit Jenis Cuti' : 'Tambah Jenis Cuti'} size="md">
                <div className="space-y-4">
                    <Input label="Nama Jenis Cuti *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="cth. Cuti Tahunan" />
                    <Input label="Kode Unik *" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="cth. ANNUAL" disabled={Boolean(editing)} />
                    <Input type="number" label="Batas Maksimum Hari per Tahun *" value={form.max_days_allowed} onChange={e => setForm(p => ({ ...p, max_days_allowed: parseInt(e.target.value) || 0 }))} />
                    <Input label="Warna Label (Hex)" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} placeholder="#10B981" />

                    <div className="space-y-2 pt-2 border-t border-white/10">
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="cf" checked={form.is_carry_forward} onChange={e => setForm(p => ({ ...p, is_carry_forward: e.target.checked }))} className="w-4 h-4 accent-teal-500" />
                            <label htmlFor="cf" className="text-sm text-gray-300">Boleh Akumulasi ke Tahun Berikutnya (Carry Forward)</label>
                        </div>
                        {form.is_carry_forward && (
                            <Input type="number" label="Maksimal Hari Carry Forward" value={form.max_carry_forward_days} onChange={e => setForm(p => ({ ...p, max_carry_forward_days: parseInt(e.target.value) || 0 }))} />
                        )}
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="encash" checked={form.is_encashable} onChange={e => setForm(p => ({ ...p, is_encashable: e.target.checked }))} className="w-4 h-4 accent-teal-500" />
                            <label htmlFor="encash" className="text-sm text-gray-300">Sisa Cuti Dapat Dikompensasi Uang (Encashable)</label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="unpaid" checked={form.is_unpaid} onChange={e => setForm(p => ({ ...p, is_unpaid: e.target.checked }))} className="w-4 h-4 accent-teal-500" />
                            <label htmlFor="unpaid" className="text-sm text-gray-300">Cuti Tanpa Upah (Unpaid Leave / Potong Gaji)</label>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-3 border-t border-white/10">
                        <Button variant="filled" color="teal" onClick={handleSubmit} loading={createMutation.isPending || updateMutation.isPending} className="flex-1">
                            {editing ? 'Simpan Perubahan' : 'Buat Jenis Cuti'}
                        </Button>
                        <Button variant="outline" onClick={() => { setModalOpen(false); resetForm(); }}>Batal</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
