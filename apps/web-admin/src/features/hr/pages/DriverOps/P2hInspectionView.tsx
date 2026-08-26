import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClipboardCheck, Plus, Search, CheckCircle2, AlertTriangle, XCircle, ShieldAlert, Check, X } from 'lucide-react';
import dayjs from 'dayjs';
import { hrDriverP2hSafetyApi, type HrP2hInspection } from'../../api/hr-driver-p2h-safety';
import { employeeApi } from'../../api/employee';
import { assetApi } from'../../../assets/api/assets';
import {
    Button, Card, Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableEmpty,
    Badge, Modal, Input, Select, ActionIcon, useToast, LoadingOverlay
} from'../../../../components/ui';

export default function P2hInspectionView() {
    const qc = useQueryClient();
    const { success, error: showError } = useToast();
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedP2h, setSelectedP2h] = useState<HrP2hInspection | null>(null);

    const [form, setForm] = useState({
        employee_id: '',
        asset_id: '',
        inspection_date: dayjs().format('YYYY-MM-DD'),
        odometer_reading: 12550,
        hour_meter_reading: 1840,
        oil_coolant_ok: true,
        brakes_ok: true,
        tires_ok: true,
        lights_horn_ok: true,
        safety_gear_ok: true,
        notes_defect: '',
        inspector_signature: 'Pemeriksaan Lapangan Mandiri Driver',
    });

    const { data: inspections = [], isLoading } = useQuery({
        queryKey: ['hr-p2h-inspections'],
        queryFn: () => hrDriverP2hSafetyApi.listP2hInspections(),
    });

    const { data: employees = [] } = useQuery({
        queryKey: ['employees'],
        queryFn: () => employeeApi.list(),
    });

    const { data: assets = [] } = useQuery({
        queryKey: ['assets'],
        queryFn: () => assetApi.list({ per_page: 100 } as any).then(r => r.data || []),
    });

    const submitMutation = useMutation({
        mutationFn: hrDriverP2hSafetyApi.submitP2hInspection,
        onSuccess: () => {
            success('Checklist inspeksi harian P2H berhasil disimpan');
            qc.invalidateQueries({ queryKey: ['hr-p2h-inspections'] });
            setModalOpen(false);
        },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal menyimpan P2H'),
    });

    const handleSubmit = () => {
        if (!form.employee_id || !form.asset_id) {
            showError('Pilih driver dan unit kendaraan yang diinspeksi');
            return;
        }
        submitMutation.mutate(form);
    };

    const filtered = inspections.filter(p =>
        (p.employee_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.asset_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.asset_code || '').toLowerCase().includes(search.toLowerCase())
    );

    const employeeOptions = [
        { value: '', label: 'Pilih Driver / Pemeriksa P2H *...' },
        ...(Array.isArray(employees) ? employees : []).map(e => ({
            value: e.id,
            label: `${e.nik} - ${e.name} (${e.department_name || 'Operasional'})`,
        })),
    ];

    const assetOptions = [
        { value: '', label: 'Pilih Unit yang Diperiksa *...' },
        ...(Array.isArray(assets) ? assets : []).map(a => ({
            value: a.id,
            label: `${a.code} - ${a.name} (${a.brand || 'Unit'})`,
        })),
    ];

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <ClipboardCheck className="h-6 w-6 text-emerald-400" />
                        Inspeksi Harian Pra-Operasi (P2H Kendaraan / Alat Berat)
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Pemeriksaan visual pra-jalan harian (Rem, Ban, Oli, Lampu, APAR) untuk keselamatan K3 tambang</p>
                </div>
                <Button onClick={() => setModalOpen(true)} leftIcon={<Plus className="h-4 w-4" />} variant="filled" color="emerald">
                    + Input Checklist P2H
                </Button>
            </div>

            <Card>
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <Input
                        placeholder="Cari driver atau unit kendaraan P2H..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        leftIcon={<Search className="h-4 w-4" />}
                        className="max-w-md"
                    />
                    <Badge color="emerald">{inspections.length} Inspeksi Tercatat</Badge>
                </div>

                <div className="relative">
                    {isLoading && <LoadingOverlay />}
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableTh>Tanggal & Jam</TableTh>
                                <TableTh>Unit Kendaraan / Alat</TableTh>
                                <TableTh>Driver / Pemeriksa</TableTh>
                                <TableTh>Checklist Kritis</TableTh>
                                <TableTh>Status Kelayakan</TableTh>
                                <TableTh className="text-right">Aksi</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableEmpty colSpan={6} message="Belum ada rekaman checklist P2H" />
                            ) : filtered.map(p => (
                                <TableRow key={p.id}>
                                    <TableTd className="text-xs text-gray-300 font-mono">{dayjs(p.inspection_date).format('DD MMM YYYY')}</TableTd>
                                    <TableTd>
                                        <div className="font-bold text-white">{p.asset_name}</div>
                                        <div className="text-xs text-gray-400 font-mono">{p.asset_code}</div>
                                    </TableTd>
                                    <TableTd>
                                        <div className="font-bold text-emerald-300">{p.employee_name}</div>
                                        <div className="text-xs text-gray-400 font-mono">{p.employee_nik}</div>
                                    </TableTd>
                                    <TableTd className="text-xs">
                                        <div className="flex gap-1.5">
                                            <span title="Rem" className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${p.brakes_ok ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>Rem {p.brakes_ok ? '✓' : '✗'}</span>
                                            <span title="Ban" className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${p.tires_ok ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>Ban {p.tires_ok ? '✓' : '✗'}</span>
                                            <span title="Oli" className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${p.oil_coolant_ok ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>Oli {p.oil_coolant_ok ? '✓' : '✗'}</span>
                                            <span title="Lampu" className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${p.lights_horn_ok ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>Lampu {p.lights_horn_ok ? '✓' : '✗'}</span>
                                        </div>
                                    </TableTd>
                                    <TableTd>
                                        <Badge color={
                                            p.overall_status === 'fit_to_operate' ? 'green' :
                                            p.overall_status === 'needs_minor_repair' ? 'amber' : 'red'
                                        }>
                                            {p.overall_status === 'fit_to_operate' ? 'Laik Jalan (Fit)' :
                                             p.overall_status === 'needs_minor_repair' ? 'Perlu Perbaikan Ringan' : 'Dilarang Operasi (Grounded)'}
                                        </Badge>
                                    </TableTd>
                                    <TableTd className="text-right">
                                        <Button size="sm" variant="outline" onClick={() => { setSelectedP2h(p); setDetailModalOpen(true); }}>
                                            Lihat Lembar P2H
                                        </Button>
                                    </TableTd>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Modal Input Checklist P2H */}
            <Modal isOpen={modalOpen} opened={modalOpen} onClose={() => setModalOpen(false)} title="Lembar Pemeriksaan Harian Kendaraan (P2H)" size="lg">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            label="Driver / Pemeriksa *"
                            value={form.employee_id}
                            onChange={v => setForm(p => ({ ...p, employee_id: v }))}
                            options={employeeOptions}
                        />
                        <Select
                            label="Unit Kendaraan / Alat Berat *"
                            value={form.asset_id}
                            onChange={v => setForm(p => ({ ...p, asset_id: v }))}
                            options={assetOptions}
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <Input
                            type="date"
                            label="Tanggal Pemeriksaan *"
                            value={form.inspection_date}
                            onChange={e => setForm(p => ({ ...p, inspection_date: e.target.value }))}
                        />
                        <Input
                            type="number"
                            label="Odometer (KM)"
                            value={form.odometer_reading}
                            onChange={e => setForm(p => ({ ...p, odometer_reading: parseFloat(e.target.value) || 0 }))}
                        />
                        <Input
                            type="number"
                            label="Hour Meter (HM)"
                            value={form.hour_meter_reading}
                            onChange={e => setForm(p => ({ ...p, hour_meter_reading: parseFloat(e.target.value) || 0 }))}
                        />
                    </div>

                    <div className="p-4 bg-slate-900/60 border border-white/10 rounded-xl space-y-3">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Checklist Item K3 & Keselamatan Operasi</h4>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <label className="flex items-center gap-2 text-gray-200 cursor-pointer">
                                <input type="checkbox" checked={form.brakes_ok} onChange={e => setForm(p => ({ ...p, brakes_ok: e.target.checked }))} className="rounded text-emerald-500" />
                                <span>🛑 Sistem Rem (Service & Parking Brake) Normal</span>
                            </label>
                            <label className="flex items-center gap-2 text-gray-200 cursor-pointer">
                                <input type="checkbox" checked={form.tires_ok} onChange={e => setForm(p => ({ ...p, tires_ok: e.target.checked }))} className="rounded text-emerald-500" />
                                <span>🛞 Tekanan Angin & Baut Roda/Track Aman</span>
                            </label>
                            <label className="flex items-center gap-2 text-gray-200 cursor-pointer">
                                <input type="checkbox" checked={form.oil_coolant_ok} onChange={e => setForm(p => ({ ...p, oil_coolant_ok: e.target.checked }))} className="rounded text-emerald-500" />
                                <span>💧 Oli Mesin & Air Radiator Cukup (Tidak Bocor)</span>
                            </label>
                            <label className="flex items-center gap-2 text-gray-200 cursor-pointer">
                                <input type="checkbox" checked={form.lights_horn_ok} onChange={e => setForm(p => ({ ...p, lights_horn_ok: e.target.checked }))} className="rounded text-emerald-500" />
                                <span>💡 Lampu Utama, Rotary Strobe & Alarm Mundur Aktif</span>
                            </label>
                            <label className="flex items-center gap-2 text-gray-200 cursor-pointer col-span-2">
                                <input type="checkbox" checked={form.safety_gear_ok} onChange={e => setForm(p => ({ ...p, safety_gear_ok: e.target.checked }))} className="rounded text-emerald-500" />
                                <span>🦺 Sabuk Pengaman (Seatbelt), APAR & Radio Komunikasi Lengkap</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">Catatan Kerusakan / Temuan Defect Lapangan</label>
                        <textarea
                            value={form.notes_defect}
                            onChange={e => setForm(p => ({ ...p, notes_defect: e.target.value }))}
                            rows={2}
                            placeholder="cth. Lampu sein kiri belakang redup, perlu penggantian bohlam..."
                            className="w-full bg-slate-900/60 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                        />
                    </div>

                    <div className="flex gap-3 pt-3 border-t border-white/10">
                        <Button variant="filled" color="emerald" onClick={handleSubmit} loading={submitMutation.isPending} className="flex-1">
                            Simpan Hasil Inspeksi P2H
                        </Button>
                        <Button variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
                    </div>
                </div>
            </Modal>

            {/* Modal Detail P2H */}
            <Modal isOpen={detailModalOpen} opened={detailModalOpen} onClose={() => setDetailModalOpen(false)} title="Detail Lembar Pemeriksaan Harian (P2H)" size="md">
                {selectedP2h && (
                    <div className="space-y-4 text-white text-sm">
                        <div className="p-4 bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-white text-base">{selectedP2h.asset_name}</h3>
                                <div className="text-xs text-gray-300 font-mono">{selectedP2h.asset_code}</div>
                            </div>
                            <Badge color={selectedP2h.overall_status === 'fit_to_operate' ? 'green' : 'red'}>
                                {selectedP2h.overall_status === 'fit_to_operate' ? 'Laik Jalan' : 'Grounded'}
                            </Badge>
                        </div>

                        <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2 text-xs">
                            <div className="flex justify-between border-b border-white/10 pb-2">
                                <span className="text-gray-400">Driver / Pemeriksa:</span>
                                <span className="font-bold">{selectedP2h.employee_name}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/10 pb-2">
                                <span className="text-gray-400">Tanggal & Odometer:</span>
                                <span className="font-mono">{dayjs(selectedP2h.inspection_date).format('DD MMM YYYY')} ({Number(selectedP2h.odometer_reading || 0).toLocaleString()} KM)</span>
                            </div>
                            <div>
                                <span className="text-gray-400 block mb-1">Catatan Defect / Rekomendasi:</span>
                                <p className="text-gray-200">{selectedP2h.notes_defect || 'Semua komponen diperiksa dalam kondisi prima dan aman beroperasi.'}</p>
                            </div>
                        </div>

                        <div className="flex justify-end pt-3 border-t border-white/10">
                            <Button variant="outline" onClick={() => setDetailModalOpen(false)}>Tutup</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
