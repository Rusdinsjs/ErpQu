import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldAlert, Plus, Search, AlertTriangle, FileWarning, Gauge, MapPin } from 'lucide-react';
import dayjs from 'dayjs';
import { hrDriverP2hSafetyApi, type HrDriverSafetyIncident } from '../../../api/hr-driver-p2h-safety';
import { employeeApi } from '../../../api/employee';
import { assetApi } from '../../../api/assets';
import {
    Button, Card, Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableEmpty,
    Badge, Modal, Input, Select, ActionIcon, useToast, LoadingOverlay
} from '../../../components/ui';

export default function DriverSafetyIncidentsView() {
    const qc = useQueryClient();
    const { success, error: showError } = useToast();
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState<HrDriverSafetyIncident | null>(null);

    const [form, setForm] = useState({
        employee_id: '',
        asset_id: '',
        incident_date: dayjs().format('YYYY-MM-DD'),
        violation_type: 'overspeeding',
        severity: 'medium',
        location_site: 'Jalur Hauling Km 14',
        speed_kmh: 75,
        damage_cost_estimate: 0,
        description: '',
    });

    const { data: incidents = [], isLoading } = useQuery({
        queryKey: ['hr-driver-safety-incidents'],
        queryFn: () => hrDriverP2hSafetyApi.listDriverSafetyIncidents(),
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
        mutationFn: hrDriverP2hSafetyApi.createDriverSafetyIncident,
        onSuccess: () => {
            success('Log insiden keselamatan / pelanggaran driver berhasil dicatat');
            qc.invalidateQueries({ queryKey: ['hr-driver-safety-incidents'] });
            setModalOpen(false);
        },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal mencatat insiden'),
    });

    const handleSubmit = () => {
        if (!form.employee_id || !form.description) {
            showError('Lengkapi data driver dan uraian insiden');
            return;
        }
        submitMutation.mutate(form);
    };

    const formatViolationType = (type: string) => {
        switch (type) {
            case 'overspeeding': return 'Kecepatan Berlebih (Overspeed)';
            case 'fatigue_sleep': return 'Kelelahan / Microsleep';
            case 'reckless_driving': return 'Mengemudi Ugal-Ugalan';
            case 'collision': return 'Benturan / Tabrakan Unit';
            default: return 'Pelanggaran SOP K3 Tambang';
        }
    };

    const formatRp = (num: number) => `Rp ${Number(num || 0).toLocaleString('id-ID')}`;

    const filtered = incidents.filter(i =>
        (i.employee_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (i.asset_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (i.location_site || '').toLowerCase().includes(search.toLowerCase()) ||
        (i.description || '').toLowerCase().includes(search.toLowerCase())
    );

    const employeeOptions = [
        { value: '', label: 'Pilih Driver Terkait *...' },
        ...(Array.isArray(employees) ? employees : []).map(e => ({
            value: e.id,
            label: `${e.nik} - ${e.name} (${e.department_name || 'Operasional'})`,
        })),
    ];

    const assetOptions = [
        { value: '', label: 'Pilih Unit Terkait (Opsional)...' },
        ...(Array.isArray(assets) ? assets : []).map(a => ({
            value: a.id,
            label: `${a.code} - ${a.name}`,
        })),
    ];

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <ShieldAlert className="h-6 w-6 text-rose-400" />
                        Log Pelanggaran Keselamatan & Insiden Driver
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Pemantauan insiden overspeeding GPS, kelelahan driver, dan investigasi benturan unit</p>
                </div>
                <Button onClick={() => setModalOpen(true)} leftIcon={<Plus className="h-4 w-4" />} variant="filled" color="red">
                    + Catat Pelanggaran / Insiden
                </Button>
            </div>

            <Card>
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <Input
                        placeholder="Cari driver, unit, atau lokasi insiden..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        leftIcon={<Search className="h-4 w-4" />}
                        className="max-w-md"
                    />
                    <Badge color="red">{incidents.length} Insiden Terdata</Badge>
                </div>

                <div className="relative">
                    {isLoading && <LoadingOverlay />}
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableTh>Tanggal Insiden</TableTh>
                                <TableTh>Driver / Operator</TableTh>
                                <TableTh>Unit Terlibat</TableTh>
                                <TableTh>Jenis Pelanggaran</TableTh>
                                <TableTh>Tingkat Bahaya (Severity)</TableTh>
                                <TableTh>Lokasi Site</TableTh>
                                <TableTh className="text-right">Aksi</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableEmpty colSpan={7} message="Belum ada rekaman pelanggaran keselamatan driver" />
                            ) : filtered.map(i => (
                                <TableRow key={i.id}>
                                    <TableTd className="text-xs text-gray-300 font-mono">{dayjs(i.incident_date).format('DD MMM YYYY')}</TableTd>
                                    <TableTd>
                                        <div className="font-bold text-white">{i.employee_name}</div>
                                        <div className="text-xs text-gray-400 font-mono">{i.employee_nik}</div>
                                    </TableTd>
                                    <TableTd className="text-xs text-gray-300 font-medium">{i.asset_name || 'Non-Unit'}</TableTd>
                                    <TableTd className="font-bold text-rose-300 text-xs">
                                        {formatViolationType(i.violation_type)}
                                        {i.speed_kmh && <span className="block text-gray-400 font-normal">Kecepatan: {i.speed_kmh} km/jam</span>}
                                    </TableTd>
                                    <TableTd>
                                        <Badge color={
                                            i.severity === 'critical' ? 'red' :
                                            i.severity === 'high' ? 'orange' :
                                            i.severity === 'medium' ? 'amber' : 'blue'
                                        }>
                                            {i.severity.toUpperCase()}
                                        </Badge>
                                    </TableTd>
                                    <TableTd className="text-xs text-gray-300">{i.location_site}</TableTd>
                                    <TableTd className="text-right">
                                        <Button size="sm" variant="outline" onClick={() => { setSelectedIncident(i); setDetailModalOpen(true); }}>
                                            Rincian Kronologi
                                        </Button>
                                    </TableTd>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Modal Input Insiden */}
            <Modal isOpen={modalOpen} opened={modalOpen} onClose={() => setModalOpen(false)} title="Pencatatan Insiden & Pelanggaran Driver" size="lg">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            label="Driver yang Terlibat *"
                            value={form.employee_id}
                            onChange={v => setForm(p => ({ ...p, employee_id: v }))}
                            options={employeeOptions}
                        />
                        <Select
                            label="Unit Kendaraan Terkait"
                            value={form.asset_id}
                            onChange={v => setForm(p => ({ ...p, asset_id: v }))}
                            options={assetOptions}
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <Select
                            label="Jenis Pelanggaran *"
                            value={form.violation_type}
                            onChange={v => setForm(p => ({ ...p, violation_type: v }))}
                            options={[
                                { value: 'overspeeding', label: 'Kecepatan Berlebih (Overspeed)' },
                                { value: 'fatigue_sleep', label: 'Kelelahan / Microsleep' },
                                { value: 'reckless_driving', label: 'Mengemudi Ugal-Ugalan' },
                                { value: 'collision', label: 'Benturan / Tabrakan Unit' },
                                { value: 'sop_k3_breach', label: 'Pelanggaran SOP K3 Tambang' },
                            ]}
                        />
                        <Select
                            label="Tingkat Severity *"
                            value={form.severity}
                            onChange={v => setForm(p => ({ ...p, severity: v }))}
                            options={[
                                { value: 'low', label: 'Low (Ringan)' },
                                { value: 'medium', label: 'Medium (Sedang)' },
                                { value: 'high', label: 'High (Berat)' },
                                { value: 'critical', label: 'Critical (Fatal/Kritis)' },
                            ]}
                        />
                        <Input
                            type="date"
                            label="Tanggal Kejadian *"
                            value={form.incident_date}
                            onChange={e => setForm(p => ({ ...p, incident_date: e.target.value }))}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Lokasi / Area Site *"
                            value={form.location_site}
                            onChange={e => setForm(p => ({ ...p, location_site: e.target.value }))}
                        />
                        <Input
                            type="number"
                            label="Kecepatan Terdeteksi (km/jam)"
                            value={form.speed_kmh}
                            onChange={e => setForm(p => ({ ...p, speed_kmh: parseFloat(e.target.value) || 0 }))}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">Kronologi & Temuan Investigasi *</label>
                        <textarea
                            value={form.description}
                            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                            rows={3}
                            placeholder="Jelaskan uraian kronologi insiden lapangan..."
                            className="w-full bg-slate-900/60 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                        />
                    </div>

                    <div className="flex gap-3 pt-3 border-t border-white/10">
                        <Button variant="filled" color="red" onClick={handleSubmit} loading={submitMutation.isPending} className="flex-1">
                            Simpan Laporan Insiden
                        </Button>
                        <Button variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
                    </div>
                </div>
            </Modal>

            {/* Modal Detail Insiden */}
            <Modal isOpen={detailModalOpen} opened={detailModalOpen} onClose={() => setDetailModalOpen(false)} title="Laporan Kronologi Insiden Keselamatan" size="md">
                {selectedIncident && (
                    <div className="space-y-4 text-white text-sm">
                        <div className="p-4 bg-gradient-to-r from-rose-950/60 to-slate-900 border border-rose-500/30 rounded-xl space-y-1">
                            <div className="font-bold text-white text-base">{selectedIncident.employee_name} ({selectedIncident.employee_nik})</div>
                            <div className="text-xs text-rose-300 font-semibold">{formatViolationType(selectedIncident.violation_type)}</div>
                            <div className="text-xs text-gray-400">Lokasi: {selectedIncident.location_site}</div>
                        </div>

                        <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2 text-xs">
                            <div>
                                <span className="text-gray-400 block">Kronologi Kejadian:</span>
                                <p className="text-gray-200 mt-0.5">{selectedIncident.description}</p>
                            </div>
                            <div className="pt-2 border-t border-white/10 flex justify-between text-gray-400">
                                <span>Tanggal: {dayjs(selectedIncident.incident_date).format('DD MMM YYYY')}</span>
                                <span>Severity: <strong className="text-rose-400">{selectedIncident.severity.toUpperCase()}</strong></span>
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
