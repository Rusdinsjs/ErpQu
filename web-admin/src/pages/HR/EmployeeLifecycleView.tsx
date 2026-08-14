import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, History, AlertTriangle, TrendingUp, UserX, RefreshCw } from 'lucide-react';
import dayjs from 'dayjs';
import {
    hrLifecycleApi, hrDesignationApi, LIFECYCLE_EVENT_LABELS, LIFECYCLE_EVENT_COLORS,
    type HrEmployeeLifecycle, type LifecycleEventType,
} from '../../api/hr-lifecycle';
import { employeeApi } from '../../api/employee';
import {
    Button, Card, Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableEmpty,
    Badge, Modal, Input, Select, useToast, LoadingOverlay, DateInput,
} from '../../components/ui';

const EVENT_TYPE_OPTIONS = [
    { value: 'onboarding', label: '🟢 Bergabung' },
    { value: 'promotion', label: '🔺 Promosi' },
    { value: 'transfer', label: '🔄 Mutasi' },
    { value: 'demotion', label: '🔻 Demosi' },
    { value: 'warning_sp1', label: '⚠️ Surat Peringatan 1 (SP-1)' },
    { value: 'warning_sp2', label: '🟠 Surat Peringatan 2 (SP-2)' },
    { value: 'warning_sp3', label: '🔴 Surat Peringatan 3 (SP-3)' },
    { value: 'resignation', label: '🚪 Resign' },
    { value: 'termination', label: '❌ PHK' },
    { value: 'retirement', label: '🏁 Pensiun' },
    { value: 'contract_renewal', label: '📋 Perpanjang Kontrak' },
    { value: 'confirmation', label: '✅ Pengangkatan Karyawan Tetap' },
];

const initialForm = {
    employee_id: '',
    event_type: 'promotion' as LifecycleEventType,
    effective_date: dayjs().format('YYYY-MM-DD'),
    notes: '',
    from_designation_id: '',
    to_designation_id: '',
    from_position: '',
    to_position: '',
    from_salary: '',
    to_salary: '',
    warning_level: '',
    warning_expiry_date: '',
    warning_reason: '',
    last_working_date: '',
    exit_reason: '',
    document_url: '',
    document_number: '',
};

export default function EmployeeLifecycleView() {
    const qc = useQueryClient();
    const { success, error: showError } = useToast();
    const [modalOpen, setModalOpen] = useState(false);
    const [filterEmployee, setFilterEmployee] = useState('');
    const [form, setForm] = useState(initialForm);

    const { data: events = [], isLoading } = useQuery({
        queryKey: ['hr-lifecycle', filterEmployee],
        queryFn: () => hrLifecycleApi.list(filterEmployee || undefined),
    });

    const { data: employees = [] } = useQuery({
        queryKey: ['employees'],
        queryFn: () => employeeApi.list(),
    });

    const { data: designations = [] } = useQuery({
        queryKey: ['hr-designations'],
        queryFn: hrDesignationApi.list,
    });

    const createMutation = useMutation({
        mutationFn: hrLifecycleApi.create,
        onSuccess: () => {
            success('Kejadian karir berhasil dicatat');
            qc.invalidateQueries({ queryKey: ['hr-lifecycle'] });
            setModalOpen(false);
            setForm(initialForm);
        },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal mencatat kejadian'),
    });

    const handleSubmit = () => {
        if (!form.employee_id) { showError('Pilih karyawan'); return; }
        if (!form.effective_date) { showError('Tanggal efektif wajib diisi'); return; }
        const payload: Record<string, unknown> = {
            ...form,
            from_salary: form.from_salary ? parseFloat(form.from_salary) : undefined,
            to_salary: form.to_salary ? parseFloat(form.to_salary) : undefined,
            from_designation_id: form.from_designation_id || undefined,
            to_designation_id: form.to_designation_id || undefined,
            warning_expiry_date: form.warning_expiry_date || undefined,
            last_working_date: form.last_working_date || undefined,
        };
        createMutation.mutate(payload as Partial<HrEmployeeLifecycle>);
    };

    const isWarning = (et: string) => et.startsWith('warning_');
    const isExit = (et: string) => ['resignation', 'termination', 'retirement'].includes(et);
    const isSalaryChange = (et: string) => ['promotion', 'demotion'].includes(et);

    const employeeOptions = [{ value: '', label: 'Semua Karyawan' }, ...employees.map(e => ({ value: e.id, label: `${e.nik} - ${e.name}` }))];
    const designationOptions = [{ value: '', label: 'Pilih Jabatan' }, ...(Array.isArray(designations) ? designations : []).map(d => ({ value: d.id, label: d.name }))];

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <History className="h-6 w-6 text-blue-400" />
                        Riwayat Karir Karyawan
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Pencatatan promosi, mutasi, SP, dan perubahan status kepegawaian</p>
                </div>
                <Button onClick={() => setModalOpen(true)} leftIcon={<Plus className="h-4 w-4" />} variant="filled" color="blue">
                    Catat Kejadian
                </Button>
            </div>

            <Card>
                <div className="p-4 border-b border-white/10">
                    <Select
                        value={filterEmployee}
                        onChange={v => setFilterEmployee(v)}
                        options={employeeOptions}
                        placeholder="Filter per Karyawan"
                        className="max-w-sm"
                    />
                </div>

                <div className="relative">
                    {isLoading && <LoadingOverlay />}
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableTh>Tanggal Efektif</TableTh>
                                <TableTh>Karyawan</TableTh>
                                <TableTh>Kejadian</TableTh>
                                <TableTh>Dari</TableTh>
                                <TableTh>Ke</TableTh>
                                <TableTh>No. SK</TableTh>
                                <TableTh>Catatan</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {events.length === 0 ? (
                                <TableEmpty colSpan={7} message="Belum ada riwayat karir" />
                            ) : events.map(ev => (
                                <TableRow key={ev.id}>
                                    <TableTd className="font-mono text-sm">{dayjs(ev.effective_date).format('DD MMM YYYY')}</TableTd>
                                    <TableTd>
                                        <div>
                                            <div className="font-medium text-white">{ev.employee_name || '-'}</div>
                                            <div className="text-xs text-gray-400">{ev.employee_nik}</div>
                                        </div>
                                    </TableTd>
                                    <TableTd>
                                        <Badge color={LIFECYCLE_EVENT_COLORS[ev.event_type] as any || 'gray'}>
                                            {LIFECYCLE_EVENT_LABELS[ev.event_type] || ev.event_type}
                                        </Badge>
                                        {ev.warning_level && (
                                            <div className="mt-1 text-xs text-orange-400 flex items-center gap-1">
                                                <AlertTriangle className="h-3 w-3" /> {ev.warning_level}
                                            </div>
                                        )}
                                    </TableTd>
                                    <TableTd className="text-sm text-gray-300">
                                        {ev.from_designation_name || ev.from_position || '-'}
                                    </TableTd>
                                    <TableTd className="text-sm text-gray-300">
                                        {ev.to_designation_name || ev.to_position || '-'}
                                    </TableTd>
                                    <TableTd className="font-mono text-xs text-gray-400">{ev.document_number || '-'}</TableTd>
                                    <TableTd className="text-sm text-gray-400 max-w-xs truncate">{ev.notes || '-'}</TableTd>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            <Modal opened={modalOpen} onClose={() => { setModalOpen(false); setForm(initialForm); }} title="Catat Kejadian Karir" size="lg">
                <div className="space-y-4">
                    <Select label="Karyawan *" value={form.employee_id} onChange={v => setForm(p => ({ ...p, employee_id: v }))} options={employeeOptions} placeholder="Pilih Karyawan" />
                    <div className="grid grid-cols-2 gap-4">
                        <Select label="Jenis Kejadian *" value={form.event_type} onChange={v => setForm(p => ({ ...p, event_type: v as LifecycleEventType }))} options={EVENT_TYPE_OPTIONS} />
                        <DateInput label="Tanggal Efektif *" value={form.effective_date} onChange={v => setForm(p => ({ ...p, effective_date: v }))} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Select label="Jabatan Sebelumnya" value={form.from_designation_id} onChange={v => setForm(p => ({ ...p, from_designation_id: v }))} options={designationOptions} />
                        <Select label="Jabatan Baru" value={form.to_designation_id} onChange={v => setForm(p => ({ ...p, to_designation_id: v }))} options={designationOptions} />
                    </div>

                    {isSalaryChange(form.event_type) && (
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Gaji Sebelumnya" value={form.from_salary} onChange={e => setForm(p => ({ ...p, from_salary: e.target.value }))} type="number" placeholder="0" />
                            <Input label="Gaji Baru" value={form.to_salary} onChange={e => setForm(p => ({ ...p, to_salary: e.target.value }))} type="number" placeholder="0" />
                        </div>
                    )}

                    {isWarning(form.event_type) && (
                        <div className="space-y-3 p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                            <p className="text-orange-400 text-sm font-medium flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Detail Surat Peringatan</p>
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Alasan SP" value={form.warning_reason} onChange={e => setForm(p => ({ ...p, warning_reason: e.target.value }))} />
                                <DateInput label="Tanggal Kedaluarsa SP" value={form.warning_expiry_date} onChange={v => setForm(p => ({ ...p, warning_expiry_date: v }))} />
                            </div>
                        </div>
                    )}

                    {isExit(form.event_type) && (
                        <div className="space-y-3 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                            <p className="text-red-400 text-sm font-medium flex items-center gap-1"><UserX className="h-4 w-4" /> Detail Pemutusan Hubungan Kerja</p>
                            <div className="grid grid-cols-2 gap-4">
                                <DateInput label="Hari Kerja Terakhir" value={form.last_working_date} onChange={v => setForm(p => ({ ...p, last_working_date: v }))} />
                                <Input label="Alasan" value={form.exit_reason} onChange={e => setForm(p => ({ ...p, exit_reason: e.target.value }))} />
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Nomor SK/Dokumen" value={form.document_number} onChange={e => setForm(p => ({ ...p, document_number: e.target.value }))} placeholder="cth. SK-2024-001" />
                        <Input label="URL Dokumen" value={form.document_url} onChange={e => setForm(p => ({ ...p, document_url: e.target.value }))} placeholder="https://..." />
                    </div>
                    <Input label="Catatan Tambahan" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Catatan atau keterangan tambahan..." />

                    <div className="flex gap-3 pt-2">
                        <Button variant="filled" color="blue" onClick={handleSubmit} loading={createMutation.isPending} className="flex-1">Simpan Kejadian</Button>
                        <Button variant="outline" onClick={() => { setModalOpen(false); setForm(initialForm); }}>Batal</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
