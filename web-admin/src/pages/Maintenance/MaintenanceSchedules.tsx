
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { maintenanceApi, type MaintenanceSchedule, type CreateMaintenanceScheduleRequest } from '../../api/maintenance';
import { assetApi } from '../../api/assets';
import { Plus, Calendar, Gauge, Wrench, Clock, CheckCircle, Play, Eye, Filter, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import {
    Card,
    Button,
    Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableEmpty,
    Modal,
    StatusBadge,
    ActionIcon,
    TableSkeleton,
    SearchInput,
    Select,
} from '../../components/ui';
import { showToast } from '../../components/ui/Toast';

const MaintenanceSchedules: React.FC = () => {
    const queryClient = useQueryClient();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState<MaintenanceSchedule | null>(null);

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortField, setSortField] = useState<'title' | 'asset_name' | 'next_run_date' | 'is_active'>('next_run_date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Form state
    const [formData, setFormData] = useState<CreateMaintenanceScheduleRequest>({
        asset_id: '',
        title: '',
        description: '',
        interval_type: 'time',
        interval_value: 1,
        interval_unit: 'months',
        start_date: ''
    });

    // Queries
    const { data: schedules = [], isLoading } = useQuery({
        queryKey: ['maintenance-schedules'],
        queryFn: maintenanceApi.listSchedules
    });

    const { data: assetsData } = useQuery({
        queryKey: ['assets'],
        queryFn: () => assetApi.list({ page: 1, per_page: 100 })
    });

    const assets = assetsData?.data || [];

    // Mutations
    const createMutation = useMutation({
        mutationFn: maintenanceApi.createSchedule,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maintenance-schedules'] });
            setIsCreateModalOpen(false);
            setFormData({
                asset_id: '', title: '', description: '',
                interval_type: 'time', interval_value: 1, interval_unit: 'months', start_date: ''
            });
            showToast('Maintenance schedule created successfully', 'success');
        },
        onError: (err: any) => {
            showToast(err.message || 'Failed to create schedule', 'error');
        }
    });

    const runMutation = useMutation({
        mutationFn: maintenanceApi.runSchedule,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maintenance-schedules'] });
            showToast('Maintenance schedule triggered successfully', 'success');
        },
        onError: (err: any) => {
            showToast(err.message || 'Failed to trigger schedule', 'error');
        }
    });

    const handleRunSchedule = (id: string, title: string) => {
        if (confirm(`Run schedule "${title}" now? This will create a new maintenance task.`)) {
            runMutation.mutate(id);
        }
    };

    const handleSort = (field: 'title' | 'asset_name' | 'next_run_date' | 'is_active') => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    const filteredSchedules = useMemo(() => {
        return (schedules as MaintenanceSchedule[]).filter((s: MaintenanceSchedule) => {
            if (search.trim()) {
                const query = search.toLowerCase().trim();
                const matches = (s.title || '').toLowerCase().includes(query) ||
                    (s.asset_name || '').toLowerCase().includes(query) ||
                    (s.description || '').toLowerCase().includes(query);
                if (!matches) return false;
            }

            if (statusFilter === 'active' && !s.is_active) return false;
            if (statusFilter === 'inactive' && s.is_active) return false;

            return true;
        }).sort((a: MaintenanceSchedule, b: MaintenanceSchedule) => {
            let valA: any = a[sortField] ?? '';
            let valB: any = b[sortField] ?? '';
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [schedules, search, statusFilter, sortField, sortDirection]);

    // Stats
    const totalSchedules = schedules.length;
    const activeSchedules = schedules.filter((s: MaintenanceSchedule) => s.is_active).length;
    const dueSoon = schedules.filter((s: MaintenanceSchedule) => {
        if (!s.next_run_date) return false;
        const next = new Date(s.next_run_date);
        const now = new Date();
        const diffDays = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7;
    }).length;

    return (
        <div className="p-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
            <div className="relative mb-8">
                {/* Decorative background element */}
                <div className="absolute -top-10 -left-10 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />

                <div className="flex justify-between items-end relative z-10">
                    <div>
                        <h1 className="text-4xl font-black text-foreground tracking-tight uppercase">
                            Maintenance <span className="text-primary">Schedules</span>
                        </h1>
                        <p className="text-muted-foreground mt-2 flex items-center gap-2 font-medium">
                            <span className="w-8 h-[1px] bg-primary/50"></span>
                            Manage automated preventive maintenance tasks
                        </p>
                    </div>
                    <Button
                        variant="primary"
                        leftIcon={<Plus size={20} />}
                        onClick={() => setIsCreateModalOpen(true)}
                        className="rounded-xl shadow-lg shadow-blue-500/20 font-bold tracking-wider"
                    >
                        Create Schedule
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 relative z-10">
                <Card className="relative overflow-hidden group p-6 border-border bg-card/60 backdrop-blur-xl shadow-lg">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-8 -mt-8 transition-transform duration-700 group-hover:scale-150 group-hover:bg-blue-500/20" />
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Total Schedules</p>
                            <h3 className="text-4xl font-black text-foreground mt-2 font-mono group-hover:text-blue-500 transition-colors">{totalSchedules}</h3>
                        </div>
                        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
                            <Wrench className="text-blue-500 group-hover:text-white" size={24} />
                        </div>
                    </div>
                </Card>

                <Card className="relative overflow-hidden group p-6 border-border bg-card/60 backdrop-blur-xl shadow-lg">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/100/10 rounded-full -mr-8 -mt-8 transition-transform duration-700 group-hover:scale-150 group-hover:bg-emerald-500/100/20" />
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Active</p>
                            <h3 className="text-4xl font-black text-foreground mt-2 font-mono group-hover:text-emerald-500 transition-colors">{activeSchedules}</h3>
                        </div>
                        <div className="p-4 bg-emerald-500/100/10 border border-emerald-500/20 rounded-2xl group-hover:bg-emerald-500/100 group-hover:text-white transition-colors duration-300">
                            <CheckCircle className="text-emerald-500 group-hover:text-white" size={24} />
                        </div>
                    </div>
                </Card>

                <Card className="relative overflow-hidden group p-6 border-border bg-card/60 backdrop-blur-xl shadow-lg">
                    <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-8 -mt-8 transition-transform duration-700 group-hover:scale-150 ${dueSoon > 0 ? 'bg-amber-500/100/10 group-hover:bg-amber-500/100/20' : 'bg-muted/10 group-hover:bg-muted/20'}`} />
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Due Soon (7 Days)</p>
                            <h3 className={`text-4xl font-black mt-2 font-mono transition-colors ${dueSoon > 0 ? 'text-amber-500 group-hover:text-amber-400' : 'text-foreground group-hover:text-muted-foreground'}`}>
                                {dueSoon}
                            </h3>
                        </div>
                        <div className={`p-4 border rounded-2xl transition-colors duration-300 ${dueSoon > 0 ? 'bg-amber-500/100/10 border-amber-500/20 group-hover:bg-amber-500/100 group-hover:text-white' : 'bg-muted/10 border-muted/20 group-hover:bg-muted group-hover:text-foreground'}`}>
                            <Clock className={dueSoon > 0 ? 'text-amber-500 group-hover:text-white' : 'text-muted-foreground group-hover:text-foreground'} size={24} />
                        </div>
                    </div>
                </Card>
            </div>

            {/* List Card */}
            <Card className="overflow-hidden p-6 border-border bg-card/60 backdrop-blur-xl shadow-2xl rounded-3xl space-y-4">
                {/* Search & Filter Toolbar */}
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                    <div className="relative max-w-md flex-1">
                        <SearchInput
                            value={search}
                            onChange={setSearch}
                            placeholder="Search schedule title, description or asset..."
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter size={14} className="text-primary" />
                        <Select
                            value={statusFilter}
                            onChange={setStatusFilter}
                            options={[
                                { value: 'all', label: 'All Status' },
                                { value: 'active', label: 'Active Only' },
                                { value: 'inactive', label: 'Inactive Only' },
                            ]}
                            className="w-40 text-xs"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-border">
                    {isLoading ? (
                        <div className="p-6"><TableSkeleton rows={5} cols={7} /></div>
                    ) : (
                        <Table className="border-none text-sm w-full text-left text-foreground">
                            <TableHead className="bg-muted/30 border-b border-border">
                                <TableRow>
                                    <TableTh onClick={() => handleSort('title')} className="px-6 py-4 cursor-pointer hover:text-white transition-colors">
                                        <div className="flex items-center gap-1.5">
                                            <span>Title</span>
                                            {sortField === 'title' ? (
                                                sortDirection === 'asc' ? <ArrowUp size={12} className="text-primary" /> : <ArrowDown size={12} className="text-primary" />
                                            ) : (
                                                <ArrowUpDown size={12} className="opacity-40" />
                                            )}
                                        </div>
                                    </TableTh>
                                    <TableTh onClick={() => handleSort('asset_name')} className="px-6 py-4 cursor-pointer hover:text-white transition-colors">
                                        <div className="flex items-center gap-1.5">
                                            <span>Asset</span>
                                            {sortField === 'asset_name' ? (
                                                sortDirection === 'asc' ? <ArrowUp size={12} className="text-primary" /> : <ArrowDown size={12} className="text-primary" />
                                            ) : (
                                                <ArrowUpDown size={12} className="opacity-40" />
                                            )}
                                        </div>
                                    </TableTh>
                                    <TableTh className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Frequency</TableTh>
                                    <TableTh className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Last Run</TableTh>
                                    <TableTh onClick={() => handleSort('next_run_date')} className="px-6 py-4 cursor-pointer hover:text-white transition-colors">
                                        <div className="flex items-center gap-1.5">
                                            <span>Next Due</span>
                                            {sortField === 'next_run_date' ? (
                                                sortDirection === 'asc' ? <ArrowUp size={12} className="text-primary" /> : <ArrowDown size={12} className="text-primary" />
                                            ) : (
                                                <ArrowUpDown size={12} className="opacity-40" />
                                            )}
                                        </div>
                                    </TableTh>
                                    <TableTh onClick={() => handleSort('is_active')} className="px-6 py-4 cursor-pointer hover:text-white transition-colors">
                                        <div className="flex items-center gap-1.5">
                                            <span>Status</span>
                                            {sortField === 'is_active' ? (
                                                sortDirection === 'asc' ? <ArrowUp size={12} className="text-primary" /> : <ArrowDown size={12} className="text-primary" />
                                            ) : (
                                                <ArrowUpDown size={12} className="opacity-40" />
                                            )}
                                        </div>
                                    </TableTh>
                                    <TableTh align="center" className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Actions</TableTh>
                                </TableRow>
                            </TableHead>
                            <TableBody className="divide-y divide-border/50">
                                {filteredSchedules.map((schedule: MaintenanceSchedule) => (
                                    <TableRow key={schedule.id} className="hover:bg-muted/20 transition-colors group">
                                        <TableTd className="px-6 py-4">
                                            <div className="font-bold text-foreground">{schedule.title}</div>
                                            {schedule.description && <div className="text-[11px] font-medium text-muted-foreground mt-0.5 line-clamp-1">{schedule.description}</div>}
                                        </TableTd>
                                        <TableTd className="px-6 py-4">
                                            <span className="text-primary bg-primary/10 px-2 py-1 rounded-md text-xs font-bold border border-primary/20">
                                                {schedule.asset_name || 'Unknown'}
                                            </span>
                                        </TableTd>
                                        <TableTd className="px-6 py-4">
                                            <div className="flex items-center text-muted-foreground font-medium text-[11px] uppercase tracking-wider">
                                                {schedule.interval_type === 'time' ? <Calendar size={14} className="mr-2 text-indigo-500" /> : <Gauge size={14} className="mr-2 text-amber-500" />}
                                                <span>Every {schedule.interval_value} {schedule.interval_unit}</span>
                                            </div>
                                        </TableTd>
                                        <TableTd className="px-6 py-4">
                                            <span className="text-muted-foreground font-mono text-[11px]">{schedule.last_run_date || 'Never'}</span>
                                        </TableTd>
                                        <TableTd className="px-6 py-4">
                                            {schedule.next_run_date ? (
                                                <span className={`font-mono text-[11px] font-bold ${new Date(schedule.next_run_date) <= new Date()
                                                    ? 'text-red-500'
                                                    : 'text-foreground'
                                                    }`}>
                                                    {schedule.next_run_date}
                                                </span>
                                            ) : <span className="text-muted-foreground text-[11px] font-mono italic">Pending</span>}
                                        </TableTd>
                                        <TableTd className="px-6 py-4">
                                            <StatusBadge status={schedule.is_active ? 'active' : 'inactive'} className="px-3 py-1 shadow-sm text-[10px] uppercase font-black tracking-widest" />
                                        </TableTd>
                                        <TableTd align="center" className="px-6 py-4 text-center">
                                            <div className="flex justify-center items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                                <ActionIcon
                                                    variant="success"
                                                    title="Run Now"
                                                    onClick={() => handleRunSchedule(schedule.id, schedule.title)}
                                                    disabled={runMutation.isPending}
                                                    className="w-8 h-8 bg-emerald-500/100/10 hover:bg-emerald-500/100 text-emerald-500 hover:text-white"
                                                >
                                                    <Play size={14} />
                                                </ActionIcon>
                                                <ActionIcon
                                                    onClick={() => { setSelectedSchedule(schedule); setViewModalOpen(true); }}
                                                    title="View Details"
                                                    className="w-8 h-8 bg-muted hover:bg-cyan-500 text-muted-foreground hover:text-white"
                                                >
                                                    <Eye size={14} />
                                                </ActionIcon>
                                                <ActionIcon variant="default" title="Edit Schedule" className="w-8 h-8 bg-muted hover:bg-primary text-muted-foreground hover:text-white">
                                                    <Wrench size={14} />
                                                </ActionIcon>
                                            </div>
                                        </TableTd>
                                    </TableRow>
                                ))}
                                {filteredSchedules.length === 0 && (
                                    <TableRow>
                                        <TableTd colSpan={7}>
                                            <TableEmpty message="No maintenance schedules found matching your criteria." colSpan={7} />
                                        </TableTd>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </Card>

            {/* View Schedule Modal */}
            <Modal
                isOpen={viewModalOpen}
                onClose={() => setViewModalOpen(false)}
                title="Maintenance Schedule Details"
            >
                {selectedSchedule && (
                    <div className="p-6 space-y-4 text-sm">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold">Schedule Title</p>
                            <p className="text-lg font-bold text-white mt-1">{selectedSchedule.title}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-bold">Target Asset</p>
                                <span className="text-primary font-semibold mt-1 block">{selectedSchedule.asset_name || 'Unknown'}</span>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-bold">Frequency</p>
                                <span className="text-slate-300 mt-1 block uppercase font-mono">Every {selectedSchedule.interval_value} {selectedSchedule.interval_unit}</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-bold">Last Run Date</p>
                                <span className="font-mono text-slate-300 mt-1 block">{selectedSchedule.last_run_date || 'Never'}</span>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-bold">Next Due Date</p>
                                <span className="font-mono text-cyan-400 font-bold mt-1 block">{selectedSchedule.next_run_date || 'Pending'}</span>
                            </div>
                        </div>
                        {selectedSchedule.description && (
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-bold">Description</p>
                                <p className="text-slate-300 mt-1">{selectedSchedule.description}</p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Create Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="New Maintenance Schedule"
                size="lg"
            >
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Asset Selection */}
                    <div>
                        <label className="block text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">Target Asset</label>
                        <select
                            required
                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/50 outline-none text-foreground appearance-none shadow-sm"
                            value={formData.asset_id}
                            onChange={e => setFormData({ ...formData, asset_id: e.target.value })}
                        >
                            <option value="">Select an Asset...</option>
                            {assets.map((a: any) => (
                                <option key={a.id} value={a.id}>{a.name} ({a.asset_number})</option>
                            ))}
                        </select>
                    </div>

                    {/* Title & Description */}
                    <div>
                        <label className="block text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">Schedule Title</label>
                        <input
                            type="text" required
                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/50 outline-none text-foreground placeholder-muted-foreground shadow-sm"
                            placeholder="e.g. Monthly Oil Change"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">Description</label>
                        <textarea
                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/50 outline-none text-foreground placeholder-muted-foreground shadow-sm"
                            rows={3}
                            value={formData.description || ''}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    {/* Interval Config */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">Trigger Frequency</label>
                            <div className="flex border border-border rounded-xl overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-primary/50">
                                <input
                                    type="number" min="1" required
                                    className="w-20 px-4 py-3 bg-background text-foreground outline-none border-r border-border font-mono font-bold"
                                    value={formData.interval_value}
                                    onChange={e => setFormData({ ...formData, interval_value: parseInt(e.target.value) })}
                                />
                                <select
                                    className="flex-1 bg-muted/20 px-3 py-3 text-foreground font-bold outline-none appearance-none"
                                    value={formData.interval_unit}
                                    onChange={e => setFormData({
                                        ...formData,
                                        interval_unit: e.target.value,
                                        interval_type: ['km', 'hours'].includes(e.target.value) ? 'usage' : 'time'
                                    })}
                                >
                                    <option value="days">Days</option>
                                    <option value="weeks">Weeks</option>
                                    <option value="months">Months</option>
                                    <option value="years">Years</option>
                                    <option value="km">KM</option>
                                    <option value="hours">Hours</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">Start Date</label>
                            <input
                                type="date"
                                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/50 outline-none text-foreground shadow-sm font-mono"
                                value={formData.start_date || ''}
                                onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                            />
                            <p className="text-[10px] text-muted-foreground mt-1.5 font-medium uppercase tracking-wider">Optional. Defaults to today.</p>
                        </div>
                    </div>

                    <div className="pt-6 flex justify-end space-x-3 border-t border-border mt-6">
                        <Button variant="ghost" type="button" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                        <Button
                            type="submit"
                            disabled={createMutation.isPending}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg font-bold tracking-widest uppercase text-xs"
                        >
                            {createMutation.isPending ? 'Saving...' : 'Create Schedule'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default MaintenanceSchedules;

