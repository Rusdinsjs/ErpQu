import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, Search, CalendarCheck } from 'lucide-react';
import { hrLeavesApi, type HrLeaveAllocation } from'../../api/hr-leaves';
import { employeeApi } from'../../api/employee';
import {
    Button, Card, Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableEmpty,
    Badge, Modal, Input, Select, useToast, LoadingOverlay,
} from'../../../../components/ui';

export default function LeaveAllocationsView() {
    const qc = useQueryClient();
    const { success, error: showError } = useToast();
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [bulkModalOpen, setBulkModalOpen] = useState(false);

    const [form, setForm] = useState({
        employee_id: '',
        leave_type_id: '',
        from_date: '2026-01-01',
        to_date: '2026-12-31',
        total_leaves_allocated: 12,
        notes: '',
    });

    const { data: allocations = [], isLoading } = useQuery({
        queryKey: ['hr-leave-allocations'],
        queryFn: () => hrLeavesApi.listAllocations(),
    });

    const { data: employees = [] } = useQuery({
        queryKey: ['employees'],
        queryFn: () => employeeApi.list(),
    });

    const { data: leaveTypes = [] } = useQuery({
        queryKey: ['hr-leave-types'],
        queryFn: hrLeavesApi.listTypes,
    });

    const createMutation = useMutation({
        mutationFn: hrLeavesApi.createAllocation,
        onSuccess: () => {
            success('Alokasi cuti berhasil ditambahkan');
            qc.invalidateQueries({ queryKey: ['hr-leave-allocations'] });
            setModalOpen(false);
        },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal menambahkan alokasi cuti'),
    });

    const bulkMutation = useMutation({
        mutationFn: hrLeavesApi.bulkAllocate,
        onSuccess: () => {
            success('Alokasi massal ke seluruh karyawan berhasil');
            qc.invalidateQueries({ queryKey: ['hr-leave-allocations'] });
            setBulkModalOpen(false);
        },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal melakukan alokasi massal'),
    });

    const handleCreate = () => {
        if (!form.employee_id || !form.leave_type_id) {
            showError('Lengkapi data karyawan dan jenis cuti');
            return;
        }
        createMutation.mutate(form);
    };

    const handleBulk = () => {
        if (!form.leave_type_id) {
            showError('Pilih jenis cuti');
            return;
        }
        const empIds = (Array.isArray(employees) ? employees : []).map(e => e.id);
        bulkMutation.mutate({
            employee_ids: empIds,
            leave_type_id: form.leave_type_id,
            from_date: form.from_date,
            to_date: form.to_date,
            total_leaves_allocated: form.total_leaves_allocated,
            notes: 'Alokasi Cuti Tahunan Otomatis',
        });
    };

    const filtered = allocations.filter(a =>
        (a.employee_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.employee_nik || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.leave_type_name || '').toLowerCase().includes(search.toLowerCase())
    );

    const employeeOptions = [
        { value: '', label: 'Pilih Karyawan...' },
        ...(Array.isArray(employees) ? employees : []).map(e => ({
            value: e.id,
            label: `${e.nik} - ${e.name}`,
        })),
    ];

    const leaveTypeOptions = [
        { value: '', label: 'Pilih Jenis Cuti...' },
        ...(Array.isArray(leaveTypes) ? leaveTypes : []).map(lt => ({
            value: lt.id,
            label: `${lt.name} (Default: ${lt.max_days_allowed} hari)`,
        })),
    ];

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <CalendarCheck className="h-6 w-6 text-blue-400" />
                        Alokasi Kuota Cuti
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Pemberian kuota dan saldo cuti tahunan per karyawan atau massal</p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={() => setBulkModalOpen(true)} variant="outline" leftIcon={<Users className="h-4 w-4" />}>
                        Alokasi Massal
                    </Button>
                    <Button onClick={() => setModalOpen(true)} leftIcon={<Plus className="h-4 w-4" />} variant="filled" color="blue">
                        Tambah Alokasi
                    </Button>
                </div>
            </div>

            <Card>
                <div className="p-4 border-b border-white/10">
                    <Input
                        placeholder="Cari karyawan atau jenis cuti..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        leftIcon={<Search className="h-4 w-4" />}
                        className="max-w-md"
                    />
                </div>

                <div className="relative">
                    {isLoading && <LoadingOverlay />}
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableTh>Karyawan</TableTh>
                                <TableTh>Jenis Cuti</TableTh>
                                <TableTh>Periode Berlaku</TableTh>
                                <TableTh>Total Kuota</TableTh>
                                <TableTh>Carry Forward</TableTh>
                                <TableTh>Sisa Saldo</TableTh>
                                <TableTh>Status</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableEmpty colSpan={7} message="Belum ada data alokasi cuti" />
                            ) : filtered.map(a => (
                                <TableRow key={a.id}>
                                    <TableTd>
                                        <div className="font-medium text-white">{a.employee_name}</div>
                                        <div className="text-xs text-gray-400 font-mono">{a.employee_nik}</div>
                                    </TableTd>
                                    <TableTd className="font-semibold text-blue-400">{a.leave_type_name}</TableTd>
                                    <TableTd className="text-sm text-gray-300">{a.from_date} s/d {a.to_date}</TableTd>
                                    <TableTd className="font-bold text-white">{a.total_leaves_allocated} Hari</TableTd>
                                    <TableTd>{a.carry_forwarded_leaves} Hari</TableTd>
                                    <TableTd className="font-bold text-green-400">{a.unused_leaves} Hari</TableTd>
                                    <TableTd><Badge color={a.is_active ? 'green' : 'gray'}>{a.is_active ? 'Aktif' : 'Expired'}</Badge></TableTd>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Modal Alokasi Satuan */}
            <Modal isOpen={modalOpen} opened={modalOpen} onClose={() => setModalOpen(false)} title="Alokasi Kuota Cuti Karyawan" size="md">
                <div className="space-y-4">
                    <Select
                        label="Karyawan *"
                        value={form.employee_id}
                        onChange={v => setForm(p => ({ ...p, employee_id: v }))}
                        options={employeeOptions}
                    />
                    <Select
                        label="Jenis Cuti *"
                        value={form.leave_type_id}
                        onChange={v => setForm(p => ({ ...p, leave_type_id: v }))}
                        options={leaveTypeOptions}
                    />
                    <Input
                        type="number"
                        label="Total Kuota (Hari) *"
                        value={form.total_leaves_allocated}
                        onChange={e => setForm(p => ({ ...p, total_leaves_allocated: parseFloat(e.target.value) || 0 }))}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            type="date"
                            label="Berlaku Mulai *"
                            value={form.from_date}
                            onChange={e => setForm(p => ({ ...p, from_date: e.target.value }))}
                        />
                        <Input
                            type="date"
                            label="Berlaku Sampai *"
                            value={form.to_date}
                            onChange={e => setForm(p => ({ ...p, to_date: e.target.value }))}
                        />
                    </div>
                    <div className="flex gap-3 pt-3 border-t border-white/10">
                        <Button variant="filled" color="blue" onClick={handleCreate} loading={createMutation.isPending} className="flex-1">
                            Simpan Alokasi
                        </Button>
                        <Button variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
                    </div>
                </div>
            </Modal>

            {/* Modal Alokasi Massal */}
            <Modal isOpen={bulkModalOpen} opened={bulkModalOpen} onClose={() => setBulkModalOpen(false)} title="Alokasi Kuota Cuti Massal (Semua Karyawan)" size="md">
                <div className="space-y-4">
                    <p className="text-sm text-gray-300">
                        Aksi ini akan memberikan alokasi kuota cuti sekaligus kepada seluruh <strong>{employees.length} karyawan aktif</strong>.
                    </p>
                    <Select
                        label="Jenis Cuti *"
                        value={form.leave_type_id}
                        onChange={v => setForm(p => ({ ...p, leave_type_id: v }))}
                        options={leaveTypeOptions}
                    />
                    <Input
                        type="number"
                        label="Kuota per Karyawan (Hari) *"
                        value={form.total_leaves_allocated}
                        onChange={e => setForm(p => ({ ...p, total_leaves_allocated: parseFloat(e.target.value) || 0 }))}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            type="date"
                            label="Berlaku Mulai *"
                            value={form.from_date}
                            onChange={e => setForm(p => ({ ...p, from_date: e.target.value }))}
                        />
                        <Input
                            type="date"
                            label="Berlaku Sampai *"
                            value={form.to_date}
                            onChange={e => setForm(p => ({ ...p, to_date: e.target.value }))}
                        />
                    </div>
                    <div className="flex gap-3 pt-3 border-t border-white/10">
                        <Button variant="filled" color="blue" onClick={handleBulk} loading={bulkMutation.isPending} className="flex-1">
                            Jalankan Alokasi Massal
                        </Button>
                        <Button variant="outline" onClick={() => setBulkModalOpen(false)}>Batal</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
