import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, CreditCard, Search, UserCheck } from 'lucide-react';
import { hrPayrollApi, type HrSalaryAssignment } from '../../../api/hr-payroll';
import { employeeApi } from '../../../api/employee';
import {
    Button, Card, Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableEmpty,
    Badge, Modal, Input, Select, useToast, LoadingOverlay
} from '../../../components/ui';

export default function SalaryAssignmentsView() {
    const qc = useQueryClient();
    const { success, error: showError } = useToast();
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);

    const [form, setForm] = useState({
        employee_id: '',
        salary_structure_id: '10000000-0000-0000-0000-000000000001',
        from_date: '2026-01-01',
        base_salary: 7000000,
        tunjangan_jabatan: 500000,
        tunjangan_transport: 500000,
        tunjangan_makan: 500000,
        ptkp_status: 'TK/0',
        npwp_number: '',
        bank_name: 'Bank Mandiri',
        bank_account: '',
        bank_account_holder: '',
    });

    const { data: assignments = [], isLoading } = useQuery({
        queryKey: ['hr-salary-assignments'],
        queryFn: hrPayrollApi.listAssignments,
    });

    const { data: employees = [] } = useQuery({
        queryKey: ['employees'],
        queryFn: () => employeeApi.list(),
    });

    const { data: structures = [] } = useQuery({
        queryKey: ['hr-salary-structures'],
        queryFn: hrPayrollApi.listStructures,
    });

    const createMutation = useMutation({
        mutationFn: hrPayrollApi.createAssignment,
        onSuccess: () => {
            success('Penetapan gaji karyawan berhasil disimpan');
            qc.invalidateQueries({ queryKey: ['hr-salary-assignments'] });
            setModalOpen(false);
        },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal menyimpan penetapan gaji'),
    });

    const handleCreate = () => {
        if (!form.employee_id || !form.base_salary) {
            showError('Pilih karyawan dan tentukan gaji pokok');
            return;
        }
        createMutation.mutate(form);
    };

    const formatRp = (num: number) => `Rp ${Number(num || 0).toLocaleString('id-ID')}`;

    const filtered = assignments.filter(a =>
        (a.employee_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.employee_nik || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.department_name || '').toLowerCase().includes(search.toLowerCase())
    );

    const employeeOptions = [
        { value: '', label: 'Pilih Karyawan...' },
        ...(Array.isArray(employees) ? employees : []).map(e => ({
            value: e.id,
            label: `${e.nik} - ${e.name} (${e.department_name || 'Umum'})`,
        })),
    ];

    const structureOptions = [
        ...(Array.isArray(structures) ? structures : []).map(s => ({
            value: s.id,
            label: s.name,
        })),
    ];

    const ptkpOptions = [
        { value: 'TK/0', label: 'TK/0 - Tidak Kawin Tanpa Tanggungan (TER A)' },
        { value: 'TK/1', label: 'TK/1 - Tidak Kawin 1 Tanggungan (TER A)' },
        { value: 'TK/2', label: 'TK/2 - Tidak Kawin 2 Tanggungan (TER B)' },
        { value: 'TK/3', label: 'TK/3 - Tidak Kawin 3 Tanggungan (TER B)' },
        { value: 'K/0', label: 'K/0 - Kawin Tanpa Tanggungan (TER A)' },
        { value: 'K/1', label: 'K/1 - Kawin 1 Tanggungan (TER B)' },
        { value: 'K/2', label: 'K/2 - Kawin 2 Tanggungan (TER B)' },
        { value: 'K/3', label: 'K/3 - Kawin 3 Tanggungan (TER C)' },
    ];

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <CreditCard className="h-6 w-6 text-purple-400" />
                        Penetapan Gaji Karyawan (Salary Assignments)
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Konfigurasi gaji pokok, tunjangan rutin, status PTKP TER, dan rekening bank</p>
                </div>
                <Button onClick={() => setModalOpen(true)} leftIcon={<Plus className="h-4 w-4" />} variant="filled" color="purple">
                    Tetapkan Gaji Karyawan
                </Button>
            </div>

            <Card>
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <Input
                        placeholder="Cari karyawan atau NIK..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        leftIcon={<Search className="h-4 w-4" />}
                        className="max-w-md"
                    />
                    <Badge color="purple">{assignments.length} Karyawan Terdaftar</Badge>
                </div>

                <div className="relative">
                    {isLoading && <LoadingOverlay />}
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableTh>Karyawan</TableTh>
                                <TableTh>Struktur Gaji</TableTh>
                                <TableTh>Gaji Pokok</TableTh>
                                <TableTh>Total Tunjangan</TableTh>
                                <TableTh>Status PTKP</TableTh>
                                <TableTh>Rekening Bank</TableTh>
                                <TableTh>Status</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableEmpty colSpan={7} message="Belum ada data penetapan gaji" />
                            ) : filtered.map(a => {
                                const totalTunj = Number(a.tunjangan_jabatan) + Number(a.tunjangan_transport) + Number(a.tunjangan_makan);
                                return (
                                    <TableRow key={a.id}>
                                        <TableTd>
                                            <div className="font-bold text-white">{a.employee_name}</div>
                                            <div className="text-xs text-gray-400 font-mono">{a.employee_nik} • {a.department_name || 'Umum'}</div>
                                        </TableTd>
                                        <TableTd className="text-sm text-purple-300 font-medium">{a.salary_structure_name}</TableTd>
                                        <TableTd className="font-bold text-white">{formatRp(a.base_salary)}</TableTd>
                                        <TableTd className="font-semibold text-emerald-400">{formatRp(totalTunj)}</TableTd>
                                        <TableTd><Badge color="blue">{a.ptkp_status}</Badge></TableTd>
                                        <TableTd className="text-xs text-gray-300">
                                            <div>{a.bank_name || 'Bank'}</div>
                                            <div className="font-mono text-gray-400">{a.bank_account || '-'}</div>
                                        </TableTd>
                                        <TableTd><Badge color="green">Aktif</Badge></TableTd>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Modal Form Penetapan Gaji */}
            <Modal isOpen={modalOpen} opened={modalOpen} onClose={() => setModalOpen(false)} title="Form Penetapan Gaji Karyawan" size="lg">
                <div className="space-y-4">
                    <Select
                        label="Pilih Karyawan *"
                        value={form.employee_id}
                        onChange={v => setForm(p => ({ ...p, employee_id: v }))}
                        options={employeeOptions}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            label="Struktur Gaji *"
                            value={form.salary_structure_id}
                            onChange={v => setForm(p => ({ ...p, salary_structure_id: v }))}
                            options={structureOptions}
                        />
                        <Select
                            label="Status PTKP (Kategori TER) *"
                            value={form.ptkp_status}
                            onChange={v => setForm(p => ({ ...p, ptkp_status: v }))}
                            options={ptkpOptions}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            type="number"
                            label="Gaji Pokok (Base Salary) *"
                            value={form.base_salary}
                            onChange={e => setForm(p => ({ ...p, base_salary: parseFloat(e.target.value) || 0 }))}
                        />
                        <Input
                            type="number"
                            label="Tunjangan Jabatan"
                            value={form.tunjangan_jabatan}
                            onChange={e => setForm(p => ({ ...p, tunjangan_jabatan: parseFloat(e.target.value) || 0 }))}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            type="number"
                            label="Tunjangan Transportasi"
                            value={form.tunjangan_transport}
                            onChange={e => setForm(p => ({ ...p, tunjangan_transport: parseFloat(e.target.value) || 0 }))}
                        />
                        <Input
                            type="number"
                            label="Tunjangan Uang Makan"
                            value={form.tunjangan_makan}
                            onChange={e => setForm(p => ({ ...p, tunjangan_makan: parseFloat(e.target.value) || 0 }))}
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/10">
                        <Input
                            label="Nama Bank"
                            value={form.bank_name}
                            onChange={e => setForm(p => ({ ...p, bank_name: e.target.value }))}
                        />
                        <Input
                            label="Nomor Rekening"
                            value={form.bank_account}
                            onChange={e => setForm(p => ({ ...p, bank_account: e.target.value }))}
                        />
                        <Input
                            label="Atas Nama (A/N)"
                            value={form.bank_account_holder}
                            onChange={e => setForm(p => ({ ...p, bank_account_holder: e.target.value }))}
                        />
                    </div>

                    <div className="flex gap-3 pt-3 border-t border-white/10">
                        <Button variant="filled" color="purple" onClick={handleCreate} loading={createMutation.isPending} className="flex-1">
                            Simpan Penetapan Gaji
                        </Button>
                        <Button variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
