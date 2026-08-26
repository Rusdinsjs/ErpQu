import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GraduationCap, Award, Plus, Search, Calendar, CheckCircle2, AlertTriangle, ShieldCheck, Clock } from 'lucide-react';
import dayjs from 'dayjs';
import { hrRecruitmentTrainingDisciplineApi, type HrTrainingEvent, type HrEmployeeCertification } from'../../api/hr-recruitment-training-discipline';
import { employeeApi } from'../../api/employee';
import {
    Button, Card, Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableEmpty,
    Badge, Modal, Input, Select, ActionIcon, useToast, LoadingOverlay
} from'../../../../components/ui';

export default function TrainingCertificationsView() {
    const qc = useQueryClient();
    const { success, error: showError } = useToast();
    const [activeTab, setActiveTab] = useState<'events' | 'certifications'>('events');
    const [search, setSearch] = useState('');

    // Modals
    const [createEventModal, setCreateEventModal] = useState(false);
    const [createCertModal, setCreateCertModal] = useState(false);

    const [eventForm, setEventForm] = useState({
        program_id: '50000000-0000-0000-0000-000000000001',
        title: '',
        start_date: dayjs().add(7, 'day').format('YYYY-MM-DD'),
        end_date: dayjs().add(9, 'day').format('YYYY-MM-DD'),
        location: 'Ruang Training Kantor Pusat / Onsite',
        trainer_name: '',
        total_cost: 5000000,
    });

    const [certForm, setCertForm] = useState({
        employee_id: '',
        certificate_name: '',
        certificate_no: '',
        issuing_body: 'BNSP / Kemnaker RI',
        issue_date: dayjs().format('YYYY-MM-DD'),
        expiry_date: dayjs().add(3, 'year').format('YYYY-MM-DD'),
        document_url: '',
    });

    // Queries
    const { data: events = [], isLoading: loadingEvents } = useQuery({
        queryKey: ['hr-training-events'],
        queryFn: hrRecruitmentTrainingDisciplineApi.listTrainingEvents,
    });

    const { data: programs = [] } = useQuery({
        queryKey: ['hr-training-programs'],
        queryFn: hrRecruitmentTrainingDisciplineApi.listTrainingPrograms,
    });

    const { data: certs = [], isLoading: loadingCerts } = useQuery({
        queryKey: ['hr-employee-certifications'],
        queryFn: () => hrRecruitmentTrainingDisciplineApi.listEmployeeCertifications(),
    });

    const { data: employees = [] } = useQuery({
        queryKey: ['employees'],
        queryFn: () => employeeApi.list(),
    });

    // Mutations
    const createEventMutation = useMutation({
        mutationFn: hrRecruitmentTrainingDisciplineApi.createTrainingEvent,
        onSuccess: () => {
            success('Jadwal event pelatihan berhasil dibuat');
            qc.invalidateQueries({ queryKey: ['hr-training-events'] });
            setCreateEventModal(false);
        },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal membuat event'),
    });

    const createCertMutation = useMutation({
        mutationFn: hrRecruitmentTrainingDisciplineApi.createEmployeeCertification,
        onSuccess: () => {
            success('Sertifikat & lisensi karyawan berhasil dicatat');
            qc.invalidateQueries({ queryKey: ['hr-employee-certifications'] });
            setCreateCertModal(false);
        },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal menyimpan sertifikat'),
    });

    const handleCreateEvent = () => {
        if (!eventForm.title || !eventForm.trainer_name) {
            showError('Lengkapi judul event dan instruktur');
            return;
        }
        createEventMutation.mutate(eventForm);
    };

    const handleCreateCert = () => {
        if (!certForm.employee_id || !certForm.certificate_name || !certForm.certificate_no) {
            showError('Lengkapi data karyawan, nama sertifikat, dan nomor sertifikat');
            return;
        }
        createCertMutation.mutate(certForm);
    };

    const formatRp = (num: number) => `Rp ${Number(num || 0).toLocaleString('id-ID')}`;

    const employeeOptions = [
        { value: '', label: 'Pilih Karyawan...' },
        ...(Array.isArray(employees) ? employees : []).map(e => ({
            value: e.id,
            label: `${e.nik} - ${e.name} (${e.department_name || 'Umum'})`,
        })),
    ];

    const programOptions = [
        ...programs.map(p => ({
            value: p.id,
            label: `${p.code} - ${p.title} (${p.duration_hours} Jam)`,
        })),
    ];

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <GraduationCap className="h-6 w-6 text-purple-400" />
                        Pelatihan & Manajemen Sertifikasi Karyawan
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Pengembangan kompetensi teknis, jadwal training K3, dan pemantauan masa berlaku lisensi SIO</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setCreateEventModal(true)} leftIcon={<Calendar className="h-4 w-4" />} variant="outline">
                        + Jadwalkan Pelatihan
                    </Button>
                    <Button onClick={() => setCreateCertModal(true)} leftIcon={<Plus className="h-4 w-4" />} variant="filled" color="purple">
                        + Catat Sertifikat / Lisensi
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-white/10 pb-3">
                <Button
                    variant={activeTab === 'events' ? 'filled' : 'ghost'}
                    color={activeTab === 'events' ? 'purple' : 'gray'}
                    onClick={() => setActiveTab('events')}
                >
                    📅 Jadwal Event Pelatihan ({events.length})
                </Button>
                <Button
                    variant={activeTab === 'certifications' ? 'filled' : 'ghost'}
                    color={activeTab === 'certifications' ? 'purple' : 'gray'}
                    onClick={() => setActiveTab('certifications')}
                >
                    📜 Sertifikasi & Lisensi Karyawan ({certs.length})
                </Button>
            </div>

            <Card>
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <Input
                        placeholder="Cari event training atau sertifikat karyawan..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        leftIcon={<Search className="h-4 w-4" />}
                        className="max-w-md"
                    />
                    <Badge color="purple">
                        {activeTab === 'events' ? `${events.length} Event` : `${certs.length} Sertifikat Terdata`}
                    </Badge>
                </div>

                {activeTab === 'events' ? (
                    <div className="relative">
                        {loadingEvents && <LoadingOverlay />}
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableTh>Judul Pelatihan</TableTh>
                                    <TableTh>Program Utama</TableTh>
                                    <TableTh>Jadwal Pelaksanaan</TableTh>
                                    <TableTh>Instruktur / Trainer</TableTh>
                                    <TableTh>Lokasi</TableTh>
                                    <TableTh>Peserta Terdaftar</TableTh>
                                    <TableTh>Status</TableTh>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {events.length === 0 ? (
                                    <TableEmpty colSpan={7} message="Belum ada event pelatihan terjadwal" />
                                ) : events.map(e => (
                                    <TableRow key={e.id}>
                                        <TableTd className="font-bold text-white text-base">{e.title}</TableTd>
                                        <TableTd className="text-purple-300 font-medium">{e.program_title}</TableTd>
                                        <TableTd className="text-xs text-gray-300 font-mono">
                                            {dayjs(e.start_date).format('DD MMM YYYY')} - {dayjs(e.end_date).format('DD MMM YYYY')}
                                        </TableTd>
                                        <TableTd className="text-xs text-gray-200">{e.trainer_name}</TableTd>
                                        <TableTd className="text-xs text-gray-400">{e.location}</TableTd>
                                        <TableTd>
                                            <Badge color="cyan">{e.participant_count || 0} Karyawan</Badge>
                                        </TableTd>
                                        <TableTd>
                                            <Badge color={e.status === 'completed' ? 'green' : e.status === 'scheduled' ? 'blue' : 'amber'}>
                                                {e.status === 'completed' ? 'Selesai' : e.status === 'scheduled' ? 'Terjadwal' : e.status}
                                            </Badge>
                                        </TableTd>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="relative">
                        {loadingCerts && <LoadingOverlay />}
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableTh>Karyawan</TableTh>
                                    <TableTh>Nama Sertifikasi / Lisensi</TableTh>
                                    <TableTh>Nomor Sertifikat</TableTh>
                                    <TableTh>Lembaga Penerbit</TableTh>
                                    <TableTh>Masa Berlaku</TableTh>
                                    <TableTh>Status</TableTh>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {certs.length === 0 ? (
                                    <TableEmpty colSpan={6} message="Belum ada data sertifikasi karyawan" />
                                ) : certs.map(c => (
                                    <TableRow key={c.id}>
                                        <TableTd>
                                            <div className="font-bold text-white">{c.employee_name}</div>
                                            <div className="text-xs text-gray-400 font-mono">{c.employee_nik}</div>
                                        </TableTd>
                                        <TableTd className="font-bold text-purple-300">{c.certificate_name}</TableTd>
                                        <TableTd className="font-mono text-xs text-gray-300">{c.certificate_no}</TableTd>
                                        <TableTd className="text-xs text-gray-400">{c.issuing_body}</TableTd>
                                        <TableTd className="text-xs text-gray-300 font-mono">
                                            {dayjs(c.issue_date).format('DD/MM/YYYY')} s/d {dayjs(c.expiry_date).format('DD/MM/YYYY')}
                                        </TableTd>
                                        <TableTd>
                                            <Badge color={dayjs(c.expiry_date).isBefore(dayjs()) ? 'red' : 'green'}>
                                                {dayjs(c.expiry_date).isBefore(dayjs()) ? 'Kadaluarsa' : 'Aktif Berlaku'}
                                            </Badge>
                                        </TableTd>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </Card>

            {/* Modal Buat Event */}
            <Modal isOpen={createEventModal} opened={createEventModal} onClose={() => setCreateEventModal(false)} title="Jadwalkan Event Pelatihan Baru" size="md">
                <div className="space-y-4">
                    <Select
                        label="Program Pelatihan *"
                        value={eventForm.program_id}
                        onChange={v => setEventForm(p => ({ ...p, program_id: v }))}
                        options={programOptions}
                    />

                    <Input
                        label="Judul Event Pelatihan *"
                        value={eventForm.title}
                        onChange={e => setEventForm(p => ({ ...p, title: e.target.value }))}
                        placeholder="cth. Pelatihan K3 & Safety Operation Batch IV"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            type="date"
                            label="Tanggal Mulai *"
                            value={eventForm.start_date}
                            onChange={e => setEventForm(p => ({ ...p, start_date: e.target.value }))}
                        />
                        <Input
                            type="date"
                            label="Tanggal Selesai *"
                            value={eventForm.end_date}
                            onChange={e => setEventForm(p => ({ ...p, end_date: e.target.value }))}
                        />
                    </div>

                    <Input
                        label="Nama Instruktur / Trainer *"
                        value={eventForm.trainer_name}
                        onChange={e => setEventForm(p => ({ ...p, trainer_name: e.target.value }))}
                    />

                    <Input
                        label="Lokasi Training"
                        value={eventForm.location}
                        onChange={e => setEventForm(p => ({ ...p, location: e.target.value }))}
                    />

                    <div className="flex gap-3 pt-3 border-t border-white/10">
                        <Button variant="filled" color="purple" onClick={handleCreateEvent} loading={createEventMutation.isPending} className="flex-1">
                            Simpan Jadwal Pelatihan
                        </Button>
                        <Button variant="outline" onClick={() => setCreateEventModal(false)}>Batal</Button>
                    </div>
                </div>
            </Modal>

            {/* Modal Catat Sertifikat */}
            <Modal isOpen={createCertModal} opened={createCertModal} onClose={() => setCreateCertModal(false)} title="Pencatatan Sertifikasi & Lisensi SIO Karyawan" size="md">
                <div className="space-y-4">
                    <Select
                        label="Karyawan Pemilik Lisensi *"
                        value={certForm.employee_id}
                        onChange={v => setCertForm(p => ({ ...p, employee_id: v }))}
                        options={employeeOptions}
                    />

                    <Input
                        label="Nama Sertifikasi / Lisensi *"
                        value={certForm.certificate_name}
                        onChange={e => setCertForm(p => ({ ...p, certificate_name: e.target.value }))}
                        placeholder="cth. Surat Izin Operator (SIO) Crane Kelas 1"
                    />

                    <Input
                        label="Nomor Sertifikat / Lisensi *"
                        value={certForm.certificate_no}
                        onChange={e => setCertForm(p => ({ ...p, certificate_no: e.target.value }))}
                    />

                    <Input
                        label="Lembaga Penerbit *"
                        value={certForm.issuing_body}
                        onChange={e => setCertForm(p => ({ ...p, issuing_body: e.target.value }))}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            type="date"
                            label="Tanggal Terbit *"
                            value={certForm.issue_date}
                            onChange={e => setCertForm(p => ({ ...p, issue_date: e.target.value }))}
                        />
                        <Input
                            type="date"
                            label="Tanggal Kadaluarsa *"
                            value={certForm.expiry_date}
                            onChange={e => setCertForm(p => ({ ...p, expiry_date: e.target.value }))}
                        />
                    </div>

                    <div className="flex gap-3 pt-3 border-t border-white/10">
                        <Button variant="filled" color="purple" onClick={handleCreateCert} loading={createCertMutation.isPending} className="flex-1">
                            Simpan Data Sertifikat
                        </Button>
                        <Button variant="outline" onClick={() => setCreateCertModal(false)}>Batal</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
