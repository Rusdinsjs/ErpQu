import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Search, Calendar, UserCheck, AlertTriangle, Download, MapPin } from 'lucide-react';
import dayjs from 'dayjs';
import { hrAttendanceLogsApi, type HrAttendanceDetail } from'../api/hr-shift-overtime';
import {
    Button, Card, CardHeader, CardTitle, CardContent, Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableEmpty,
    Badge, Input, Select, LoadingOverlay, Tabs, TabsList, TabsTrigger, TabsContent, DateInput, PageHeader,
} from '../../../components/ui';
import { formatCurrencyIDR } from '../../../utils/decimal';

export default function AttendanceLogsView() {
    const [startDate, setStartDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
    const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [search, setSearch] = useState('');

    const { data: logs = [], isLoading: loadingLogs } = useQuery({
        queryKey: ['hr-attendance-logs', startDate, endDate],
        queryFn: () => hrAttendanceLogsApi.listLogs({ start_date: startDate, end_date: endDate }),
    });

    const { data: recap = [], isLoading: loadingRecap } = useQuery({
        queryKey: ['hr-attendance-recap', startDate, endDate],
        queryFn: () => hrAttendanceLogsApi.getRecap({ start_date: startDate, end_date: endDate }),
    });

    const logsList = Array.isArray(logs) ? logs : [];
    const recapList = Array.isArray(recap) ? recap : [];

    const filteredLogs = logsList.filter(l =>
        (l.employee_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.employee_nik || '').toLowerCase().includes(search.toLowerCase())
    );

    const filteredRecap = recapList.filter(r =>
        (r.employee_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.employee_nik || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <PageHeader
                title="Log Kehadiran & Rekapitulasi"
                description="Live feed log check-in/out GPS, foto biometrik, telat, dan rekapitulasi jam lembur"
                badge={`${filteredLogs.length} Log Hari Ini`}
            />

            <Card>
                <div className="p-4 border-b border-white/10 flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center gap-3">
                        <DateInput label="Dari" value={startDate} onChange={v => setStartDate(v)} />
                        <DateInput label="Sampai" value={endDate} onChange={v => setEndDate(v)} />
                    </div>
                    <Input
                        placeholder="Cari karyawan / NIK..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        leftIcon={<Search className="h-4 w-4" />}
                        className="max-w-xs"
                    />
                </div>

                <Tabs defaultValue="feed">
                    <div className="p-4 pb-0">
                        <TabsList className="grid grid-cols-2 max-w-xs">
                            <TabsTrigger value="feed"><Activity className="h-4 w-4 mr-2" />Live Feed Log</TabsTrigger>
                            <TabsTrigger value="recap"><UserCheck className="h-4 w-4 mr-2" />Rekapitulasi</TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Live Feed */}
                    <TabsContent value="feed">
                        <div className="relative">
                            {loadingLogs && <LoadingOverlay />}
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableTh>Karyawan</TableTh>
                                        <TableTh>Shift</TableTh>
                                        <TableTh>Check-In</TableTh>
                                        <TableTh>Check-Out</TableTh>
                                        <TableTh>Keterlambatan</TableTh>
                                        <TableTh>Jam Kerja</TableTh>
                                        <TableTh>Status</TableTh>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredLogs.length === 0 ? (
                                        <TableEmpty colSpan={7} message="Tidak ada catatan log kehadiran pada rentang tanggal ini" />
                                    ) : filteredLogs.map(l => (
                                        <TableRow key={l.id}>
                                            <TableTd>
                                                <div className="font-medium text-white">{l.employee_name || '-'}</div>
                                                <div className="text-xs text-gray-400">{l.employee_nik}</div>
                                            </TableTd>
                                            <TableTd>
                                                <Badge color="blue">{l.shift_name || 'Normal'}</Badge>
                                            </TableTd>
                                            <TableTd className="text-xs">
                                                {l.check_in_time ? (
                                                    <div>
                                                        <div className="font-mono text-emerald-400 font-semibold">{dayjs(l.check_in_time).format('HH:mm:ss')}</div>
                                                        <div className="text-gray-500">{dayjs(l.check_in_time).format('DD MMM YYYY')}</div>
                                                    </div>
                                                ) : <span className="text-gray-500">-</span>}
                                            </TableTd>
                                            <TableTd className="text-xs">
                                                {l.check_out_time ? (
                                                    <div>
                                                        <div className="font-mono text-blue-400 font-semibold">{dayjs(l.check_out_time).format('HH:mm:ss')}</div>
                                                        <div className="text-gray-500">{dayjs(l.check_out_time).format('DD MMM YYYY')}</div>
                                                    </div>
                                                ) : <span className="text-gray-500">-</span>}
                                            </TableTd>
                                            <TableTd>
                                                {(l.late_minutes || 0) > 0 ? (
                                                    <span className="text-orange-400 font-semibold text-xs flex items-center gap-1">
                                                        <AlertTriangle className="h-3 w-3" /> +{l.late_minutes} Menit
                                                    </span>
                                                ) : <span className="text-emerald-400 text-xs font-medium">Tepat Waktu</span>}
                                            </TableTd>
                                            <TableTd className="font-mono text-xs text-gray-300">
                                                {l.work_hours ? `${l.work_hours} Jam` : '-'}
                                            </TableTd>
                                            <TableTd>
                                                <Badge color={l.attendance_status === 'late' ? 'orange' : 'green'}>
                                                    {l.attendance_status || 'Hadir'}
                                                </Badge>
                                            </TableTd>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    {/* Recap */}
                    <TabsContent value="recap">
                        <div className="relative">
                            {loadingRecap && <LoadingOverlay />}
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableTh>Karyawan</TableTh>
                                        <TableTh>Departemen</TableTh>
                                        <TableTh className="text-center">Hadir (Hari)</TableTh>
                                        <TableTh className="text-center">Total Telat</TableTh>
                                        <TableTh className="text-center">Total Jam Kerja</TableTh>
                                        <TableTh className="text-center">Lembur</TableTh>
                                        <TableTh className="text-right">Estimasi Upah Lembur</TableTh>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredRecap.length === 0 ? (
                                        <TableEmpty colSpan={7} message="Tidak ada data rekapitulasi" />
                                    ) : filteredRecap.map(r => (
                                        <TableRow key={r.employee_id}>
                                            <TableTd>
                                                <div className="font-medium text-white">{r.employee_name}</div>
                                                <div className="text-xs text-gray-400">{r.employee_nik}</div>
                                            </TableTd>
                                            <TableTd className="text-xs text-gray-300">{r.department_name || '-'}</TableTd>
                                            <TableTd className="text-center font-bold text-emerald-400">{r.total_present}</TableTd>
                                            <TableTd className="text-center">
                                                {r.total_late > 0 ? (
                                                    <Badge color="orange">{r.total_late}x ({r.total_late_minutes}m)</Badge>
                                                ) : <Badge color="green">0</Badge>}
                                            </TableTd>
                                            <TableTd className="text-center font-mono text-sm">{r.total_work_hours} Jam</TableTd>
                                            <TableTd className="text-center font-mono text-sm text-purple-400 font-bold">{r.total_overtime_hours} Jam</TableTd>
                                            <TableTd className="text-right font-mono font-bold text-white">
                                                {formatCurrencyIDR(r.total_overtime_pay)}
                                            </TableTd>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>
                </Tabs>
            </Card>
        </div>
    );
}
