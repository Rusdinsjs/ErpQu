// WorkOrders Page - Pure Tailwind
// Work Order Management Page
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Edit, Eye, Search, Filter, X, ArrowUpDown, ArrowUp, ArrowDown, AlertTriangle, Wrench, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { workOrderApi } from '../../api/work-order';
import type { WorkOrder } from '../../api/work-order';
import { WorkOrderForm } from '../../components/WorkOrders/WorkOrderForm';
import { PermissionGate } from '../../components/PermissionGate';
import { useWebSocket } from '../../contexts/WebSocketContext';
import {
    Button,
    Card,
    StatusBadge,
    ActionIcon,
    Pagination,
    Modal,
    Tabs,
    TabsList,
    TabsTrigger,
} from '../../components/ui';

export default function WorkOrders() {
    const [page, setPage] = useState(1);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('active');

    // Search, Filter & Sort states
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [sortField, setSortField] = useState<'id' | 'asset_name' | 'wo_type' | 'status' | 'scheduled_date' | 'priority'>('scheduled_date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const queryClient = useQueryClient();
    const navigate = useNavigate();
    // Read URL params for pre-filling form
    const [searchParams] = useSearchParams();
    const assetIdParam = searchParams.get('asset_id');
    const woTypeParam = searchParams.get('wo_type');

    useEffect(() => {
        if (assetIdParam) {
            setDrawerOpen(true);
        }
    }, [assetIdParam]);
    const { lastMessage } = useWebSocket();

    useEffect(() => {
        if (lastMessage && (lastMessage.event_type === 'WORK_ORDER_CREATED' || lastMessage.event_type === 'WORK_ORDER_COMPLETED')) {
            queryClient.invalidateQueries({ queryKey: ['work-orders'] });
        }
    }, [lastMessage, queryClient]);

    // Fetch Work Orders
    const { data: workOrdersData, isLoading } = useQuery({
        queryKey: ['work-orders', page, activeTab],
        queryFn: async () => {
            if (activeTab === 'overdue') {
                return await workOrderApi.listOverdue();
            }
            return await workOrderApi.list({ page, per_page: 50 });
        },
    });

    const records: WorkOrder[] = (workOrdersData as any) || [];
    const totalPages = 1; // TODO: Backend pagination support

    const handleEdit = (id: string) => {
        setSelectedId(id);
        setDrawerOpen(true);
    };

    const handleCreate = () => {
        setSelectedId(null);
        setDrawerOpen(true);
    };

    const handleSort = (field: 'id' | 'asset_name' | 'wo_type' | 'status' | 'scheduled_date' | 'priority') => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'all' || typeFilter !== 'all' || priorityFilter !== 'all';

    const resetFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setTypeFilter('all');
        setPriorityFilter('all');
    };

    // Filter & Sort records
    const filteredRecords = useMemo(() => {
        return records.filter((r: any) => {
            // Search query filter
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase().trim();
                const ticketRef = (r.id || '').toLowerCase();
                const woNumber = (r.wo_number || '').toLowerCase();
                const assetName = (r.asset_name || r.asset?.name || r.asset_id || '').toLowerCase();
                const woType = (r.wo_type || '').toLowerCase();
                const problem = (r.problem_description || '').toLowerCase();
                const assigned = (r.assigned_to || r.assigned_technician || '').toLowerCase();

                const matchesSearch = ticketRef.includes(query) ||
                    woNumber.includes(query) ||
                    assetName.includes(query) ||
                    woType.includes(query) ||
                    problem.includes(query) ||
                    assigned.includes(query);

                if (!matchesSearch) return false;
            }

            // Status filter
            if (statusFilter !== 'all') {
                if (statusFilter === 'overdue') {
                    if (r.status !== 'overdue' && !(new Date(r.scheduled_date || '').getTime() < Date.now() && r.status !== 'completed')) {
                        return false;
                    }
                } else if (r.status !== statusFilter) {
                    return false;
                }
            }

            // Type filter
            if (typeFilter !== 'all' && r.wo_type !== typeFilter) {
                return false;
            }

            // Priority filter
            if (priorityFilter !== 'all' && r.priority !== priorityFilter) {
                return false;
            }

            return true;
        }).sort((a: any, b: any) => {
            let valA = a[sortField] || '';
            let valB = b[sortField] || '';

            if (sortField === 'asset_name') {
                valA = a.asset_name || a.asset?.name || a.asset_id || '';
                valB = b.asset_name || b.asset?.name || b.asset_id || '';
            }

            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [records, searchQuery, statusFilter, typeFilter, priorityFilter, sortField, sortDirection]);

    return (
        <div>
            {/* Header Section */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Work Orders</h1>
                    <p className="text-muted-foreground mt-2">Manage maintenance, repairs, and service schedules</p>
                </div>
                <div className="flex gap-3">
                    <PermissionGate resource="work_order" action="create" fallbackLevel={3}>
                        <Button
                            leftIcon={<Plus size={20} />}
                            onClick={handleCreate}
                            className="rounded-xl shadow-lg shadow-blue-500/20"
                        >
                            New Work Order
                        </Button>
                    </PermissionGate>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="relative overflow-hidden group p-6">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-muted-foreground text-sm font-medium">Active & Planned</p>
                            <h3 className="text-3xl font-bold text-card-foreground mt-1">
                                {records.filter(r => r.status !== 'completed').length}
                            </h3>
                        </div>
                        <div className="p-3 bg-blue-500/20 rounded-xl">
                            <Wrench className="text-blue-400" size={24} />
                        </div>
                    </div>
                </Card>

                <Card className="relative overflow-hidden group p-6">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-muted-foreground text-sm font-medium">Overdue</p>
                            <h3 className="text-3xl font-bold text-card-foreground mt-1">
                                {records.filter(r => r.status === 'overdue').length || (activeTab === 'overdue' ? records.length : 0)}
                            </h3>
                        </div>
                        <div className="p-3 bg-red-500/20 rounded-xl">
                            <AlertCircle className="text-red-400" size={24} />
                        </div>
                    </div>
                </Card>

                <Card className="relative overflow-hidden group p-6">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/100/10 rounded-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-muted-foreground text-sm font-medium">In Progress</p>
                            <h3 className="text-3xl font-bold text-card-foreground mt-1">
                                {records.filter(r => r.status === 'in_progress').length}
                            </h3>
                        </div>
                        <div className="p-3 bg-amber-500/100/20 rounded-xl">
                            <Clock className="text-amber-400" size={24} />
                        </div>
                    </div>
                </Card>

                <Card className="relative overflow-hidden group p-6">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-muted-foreground text-sm font-medium">Completed</p>
                            <h3 className="text-3xl font-bold text-card-foreground mt-1">
                                {records.filter(r => r.status === 'completed').length}
                            </h3>
                        </div>
                        <div className="p-3 bg-green-500/20 rounded-xl">
                            <CheckCircle className="text-green-400" size={24} />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Main Content Area */}
            <Card className="overflow-hidden p-0 border border-border bg-card/60 backdrop-blur-xl shadow-2xl rounded-3xl">
                {/* Tabs Bar */}
                <div className="px-6 py-4 border-b border-border/50 bg-muted/20 flex justify-between items-center backdrop-blur-md">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-0">
                        <TabsList className="bg-muted">
                            <TabsTrigger value="active" className="px-6">Active & Planned</TabsTrigger>
                            <TabsTrigger value="overdue" icon={<AlertTriangle size={14} className="text-red-400" />} className="px-6">
                                Overdue
                            </TabsTrigger>
                            <TabsTrigger value="history" className="px-6">History</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                {/* Kanban Board Area / History Table */}
                <div className="relative bg-background/50 p-6 min-h-[600px] overflow-x-auto custom-scrollbar">
                    {isLoading ? (
                        <div className="flex gap-6 h-[500px]">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="min-w-[320px] bg-card/20 rounded-3xl p-4 border border-border/50">
                                    <div className="h-6 w-24 bg-muted animate-pulse rounded mb-4"></div>
                                    <div className="space-y-4">
                                        {[1, 2, 3].map(j => (
                                            <div key={j} className="h-32 bg-muted animate-pulse rounded-2xl"></div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : records.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                            <div className="p-6 bg-muted/20 rounded-full mb-4">
                                <Wrench size={48} className="opacity-20" />
                            </div>
                            <p className="text-sm font-bold uppercase tracking-widest opacity-50">No work orders found in this view</p>
                            <Button variant="secondary" onClick={handleCreate} className="mt-4 rounded-xl px-8">Create New Ticket</Button>
                        </div>
                    ) : activeTab === 'history' || activeTab === 'overdue' ? (
                        /* History / Overdue Table View with Filter, Search, Sort & Action buttons */
                        <div className="space-y-4">
                            {/* Search and Filter Controls Toolbar */}
                            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-card/40 backdrop-blur-xl border border-border p-4 rounded-2xl">
                                {/* Search Box */}
                                <div className="relative flex-1 min-w-[240px]">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search ticket #, asset, technician..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-8 py-2 bg-background/80 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>

                                {/* Filters & Reset */}
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                                        <Filter size={14} className="text-primary" />
                                        <span>Filter:</span>
                                    </div>

                                    {/* Status Filter */}
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="bg-background/80 border border-border text-foreground text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 font-medium cursor-pointer"
                                    >
                                        <option value="all">All Statuses</option>
                                        <option value="completed">Completed</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="assigned">Assigned</option>
                                        <option value="approved">Approved</option>
                                        <option value="pending">Pending</option>
                                        <option value="overdue">Overdue</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>

                                    {/* Type Filter */}
                                    <select
                                        value={typeFilter}
                                        onChange={(e) => setTypeFilter(e.target.value)}
                                        className="bg-background/80 border border-border text-foreground text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 font-medium cursor-pointer"
                                    >
                                        <option value="all">All Types</option>
                                        <option value="preventive">Preventive</option>
                                        <option value="corrective">Corrective</option>
                                        <option value="maintenance">Maintenance</option>
                                        <option value="repair">Repair</option>
                                    </select>

                                    {/* Priority Filter */}
                                    <select
                                        value={priorityFilter}
                                        onChange={(e) => setPriorityFilter(e.target.value)}
                                        className="bg-background/80 border border-border text-foreground text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 font-medium cursor-pointer"
                                    >
                                        <option value="all">All Priorities</option>
                                        <option value="emergency">Emergency</option>
                                        <option value="high">High</option>
                                        <option value="medium">Medium</option>
                                        <option value="low">Low</option>
                                    </select>

                                    {/* Reset Button */}
                                    {hasActiveFilters && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={resetFilters}
                                            leftIcon={<X size={14} />}
                                            className="text-xs rounded-xl hover:bg-destructive/10 hover:text-destructive"
                                        >
                                            Reset
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Table */}
                            <div className="bg-card/40 backdrop-blur-xl border border-border rounded-3xl overflow-hidden shadow-lg">
                                <table className="w-full text-left text-sm text-foreground/80 border-separate border-spacing-0">
                                    <thead className="bg-card/90 sticky top-0 z-20 backdrop-blur-md">
                                        <tr>
                                            <th
                                                onClick={() => handleSort('id')}
                                                className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border cursor-pointer hover:bg-muted/50 transition-colors select-none"
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    <span>Ticket Ref</span>
                                                    {sortField === 'id' ? (
                                                        sortDirection === 'asc' ? <ArrowUp size={12} className="text-primary" /> : <ArrowDown size={12} className="text-primary" />
                                                    ) : (
                                                        <ArrowUpDown size={12} className="opacity-40" />
                                                    )}
                                                </div>
                                            </th>
                                            <th
                                                onClick={() => handleSort('asset_name')}
                                                className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border cursor-pointer hover:bg-muted/50 transition-colors select-none"
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    <span>Asset Info</span>
                                                    {sortField === 'asset_name' ? (
                                                        sortDirection === 'asc' ? <ArrowUp size={12} className="text-primary" /> : <ArrowDown size={12} className="text-primary" />
                                                    ) : (
                                                        <ArrowUpDown size={12} className="opacity-40" />
                                                    )}
                                                </div>
                                            </th>
                                            <th
                                                onClick={() => handleSort('wo_type')}
                                                className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border cursor-pointer hover:bg-muted/50 transition-colors select-none"
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    <span>Type</span>
                                                    {sortField === 'wo_type' ? (
                                                        sortDirection === 'asc' ? <ArrowUp size={12} className="text-primary" /> : <ArrowDown size={12} className="text-primary" />
                                                    ) : (
                                                        <ArrowUpDown size={12} className="opacity-40" />
                                                    )}
                                                </div>
                                            </th>
                                            <th
                                                onClick={() => handleSort('status')}
                                                className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border cursor-pointer hover:bg-muted/50 transition-colors select-none"
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    <span>Status</span>
                                                    {sortField === 'status' ? (
                                                        sortDirection === 'asc' ? <ArrowUp size={12} className="text-primary" /> : <ArrowDown size={12} className="text-primary" />
                                                    ) : (
                                                        <ArrowUpDown size={12} className="opacity-40" />
                                                    )}
                                                </div>
                                            </th>
                                            <th
                                                onClick={() => handleSort('scheduled_date')}
                                                className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border cursor-pointer hover:bg-muted/50 transition-colors select-none"
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    <span>Scheduled</span>
                                                    {sortField === 'scheduled_date' ? (
                                                        sortDirection === 'asc' ? <ArrowUp size={12} className="text-primary" /> : <ArrowDown size={12} className="text-primary" />
                                                    ) : (
                                                        <ArrowUpDown size={12} className="opacity-40" />
                                                    )}
                                                </div>
                                            </th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border text-center">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredRecords.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                                    <div className="flex flex-col items-center justify-center gap-2">
                                                        <Search size={32} className="opacity-30" />
                                                        <p className="font-semibold text-sm">No work orders match the search or filter criteria</p>
                                                        {hasActiveFilters && (
                                                            <Button variant="ghost" size="sm" onClick={resetFilters} className="mt-2 text-xs">
                                                                Reset Filters
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredRecords.map((record: any) => (
                                                <tr key={record.id} onClick={() => navigate(`/work-orders/${record.id}`)} className="group cursor-pointer hover:bg-muted/30 transition-colors">
                                                    <td className="px-6 py-4 font-mono font-bold text-primary">#{record.wo_number || record.id.slice(0, 8)}</td>
                                                    <td className="px-6 py-4 font-medium">
                                                        <div>
                                                            <span className="font-semibold text-foreground block">{record.asset_name || record.asset?.name || record.asset_id}</span>
                                                            {(record.assigned_to || record.assigned_technician) && (
                                                                <span className="text-[11px] text-muted-foreground">Assigned: {record.assigned_to || record.assigned_technician}</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize bg-muted/50 text-foreground border border-border/50">
                                                            {record.wo_type ? record.wo_type.replace('_', ' ') : 'General'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4"><StatusBadge status={record.status} /></td>
                                                    <td className="px-6 py-4 text-muted-foreground">{record.scheduled_date || '-'}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex justify-center items-center gap-2">
                                                            {/* View Action Button */}
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                leftIcon={<Eye size={14} />}
                                                                onClick={(e) => { e.stopPropagation(); navigate(`/work-orders/${record.id}`); }}
                                                                className="rounded-xl text-xs hover:bg-primary/20 hover:text-primary hover:border-primary/50 transition-all"
                                                            >
                                                                View
                                                            </Button>
                                                            {/* Edit Action Button */}
                                                            <ActionIcon
                                                                onClick={(e) => { e.stopPropagation(); handleEdit(record.id); }}
                                                                variant="default"
                                                                title="Edit Work Order"
                                                                className="rounded-xl hover:bg-amber-500/20 hover:text-amber-400 w-8 h-8 border border-border transition-all"
                                                            >
                                                                <Edit size={14} />
                                                            </ActionIcon>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        /* Kanban Board View for Active & Planned */
                        <div className="flex gap-6 h-full items-start">
                            {[
                                { title: 'Pending Approval', status: 'pending', color: 'slate', icon: AlertTriangle, borderClass: 'border-slate-500/10', bgHeader: 'bg-muted/300/5', borderHeader: 'border-slate-500/20', bgIcon: 'bg-muted/300/20', textIcon: 'text-muted-foreground', bgCount: 'bg-muted/300/20', textCount: 'text-muted-foreground', hoverBorder: 'hover:border-slate-500/50', ribbon: 'bg-muted/300/30 group-hover:bg-muted/300', hoverIconBg: 'hover:bg-muted/300' },
                                { title: 'Assigned / Ready', status: 'approved', color: 'blue', icon: Clock, borderClass: 'border-blue-500/10', bgHeader: 'bg-blue-500/5', borderHeader: 'border-blue-500/20', bgIcon: 'bg-blue-500/20', textIcon: 'text-blue-500', bgCount: 'bg-blue-500/20', textCount: 'text-blue-500', hoverBorder: 'hover:border-blue-500/50', ribbon: 'bg-blue-500/30 group-hover:bg-blue-500', hoverIconBg: 'hover:bg-blue-500' },
                                { title: 'In Progress', status: 'in_progress', color: 'amber', icon: Wrench, borderClass: 'border-amber-500/10', bgHeader: 'bg-amber-500/100/5', borderHeader: 'border-amber-500/20', bgIcon: 'bg-amber-500/100/20', textIcon: 'text-amber-500', bgCount: 'bg-amber-500/100/20', textCount: 'text-amber-500', hoverBorder: 'hover:border-amber-500/50', ribbon: 'bg-amber-500/100/30 group-hover:bg-amber-500/100', hoverIconBg: 'hover:bg-amber-500/100' },
                                { title: 'Review / Done', status: ['completed', 'verified', 'finalized'], color: 'emerald', icon: CheckCircle, borderClass: 'border-emerald-500/10', bgHeader: 'bg-emerald-500/100/5', borderHeader: 'border-emerald-500/20', bgIcon: 'bg-emerald-500/100/20', textIcon: 'text-emerald-500', bgCount: 'bg-emerald-500/100/20', textCount: 'text-emerald-500', hoverBorder: 'hover:border-emerald-500/50', ribbon: 'bg-emerald-500/100/30 group-hover:bg-emerald-500/100', hoverIconBg: 'hover:bg-emerald-500/100' }
                            ].map((col) => {
                                const colRecords = records.filter(r => 
                                    Array.isArray(col.status) ? col.status.includes(r.status) : r.status === col.status
                                );
                                
                                return (
                                    <div key={col.title} className={`flex flex-col min-w-[340px] max-w-[340px] bg-card/40 backdrop-blur-xl rounded-[2rem] border ${col.borderClass} overflow-hidden flex-shrink-0 shadow-xl`}>
                                        {/* Column Header */}
                                        <div className={`p-5 border-b ${col.borderHeader} ${col.bgHeader} flex justify-between items-center sticky top-0 z-10 backdrop-blur-md`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-xl ${col.bgIcon} ${col.textIcon}`}>
                                                    <col.icon size={18} />
                                                </div>
                                                <h3 className="font-bold text-foreground text-sm uppercase tracking-widest">{col.title}</h3>
                                            </div>
                                            <span className={`${col.bgCount} ${col.textCount} font-black px-3 py-1 rounded-full text-xs`}>
                                                {colRecords.length}
                                            </span>
                                        </div>
                                        
                                        {/* Column Body */}
                                        <div className="p-4 space-y-4 overflow-y-auto max-h-[650px] custom-scrollbar">
                                            {colRecords.length === 0 ? (
                                                <div className="py-12 flex flex-col items-center justify-center text-muted-foreground/40 border-2 border-dashed border-border/50 rounded-3xl">
                                                    <div className="text-[10px] uppercase tracking-widest font-bold">Drop Zone Empty</div>
                                                </div>
                                            ) : (
                                                colRecords.map((wo: any) => (
                                                    <div 
                                                        key={wo.id} 
                                                        onClick={() => navigate(`/work-orders/${wo.id}`)}
                                                        className={`group cursor-pointer bg-card/80 hover:bg-muted/80 backdrop-blur-xl border border-border ${col.hoverBorder} rounded-3xl p-5 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 relative overflow-hidden`}
                                                    >
                                                        {/* Top Ribbon */}
                                                        <div className={`absolute top-0 left-0 w-full h-1.5 ${col.ribbon} transition-colors duration-500`} />
                                                        
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1">Ticket #{wo.id.slice(0, 8)}</span>
                                                                <span className="text-foreground font-bold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                                                                    {wo.asset_name || wo.asset?.name || `Asset ${wo.asset_id.slice(0, 4)}`}
                                                                </span>
                                                            </div>
                                                            <ActionIcon 
                                                                onClick={(e) => { e.stopPropagation(); handleEdit(wo.id); }} 
                                                                className={`opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl ${col.hoverIconBg} hover:text-white w-8 h-8 shrink-0 border border-border shadow-md`}
                                                            >
                                                                <Edit size={14} />
                                                            </ActionIcon>
                                                        </div>
                                                        
                                                        <div className="space-y-3">
                                                            <div className="flex items-center gap-2 bg-background p-2.5 rounded-xl border border-border/50">
                                                                <Wrench size={14} className="text-muted-foreground shrink-0" />
                                                                <span className="text-[11px] font-bold uppercase tracking-widest text-foreground truncate">{wo.wo_type.replace('_', ' ')}</span>
                                                            </div>
                                                            
                                                            <div className="flex justify-between items-center pt-2 border-t border-border/50">
                                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                                    <Clock size={12} className={new Date(wo.scheduled_date || '').getTime() < Date.now() && wo.status !== 'completed' ? 'text-destructive' : ''} />
                                                                    <span className={`text-[10px] font-bold uppercase ${new Date(wo.scheduled_date || '').getTime() < Date.now() && wo.status !== 'completed' ? 'text-destructive' : ''}`}>
                                                                        {wo.scheduled_date}
                                                                    </span>
                                                                </div>
                                                                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center border border-border/50 shrink-0" title="Assigned To">
                                                                    <span className="text-[8px] font-black">{wo.assigned_to ? wo.assigned_to.slice(0,2).toUpperCase() : '??'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {activeTab !== 'overdue' && totalPages > 1 && (
                    <div className="flex justify-center p-4 border-t border-border bg-muted/20">
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            onPageChange={setPage}
                        />
                    </div>
                )}
            </Card>

            {/* Work Order Form Modal */}
            <Modal
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                title={selectedId ? "Edit Work Order" : "New Work Order"}
                size="3xl"
            >
                {drawerOpen && (
                    <WorkOrderForm
                        maintenanceId={selectedId}
                        initialAssetId={assetIdParam}
                        initialType={woTypeParam}
                        onClose={() => setDrawerOpen(false)}
                        onSuccess={() => {
                            setDrawerOpen(false);
                            queryClient.invalidateQueries({ queryKey: ['work-orders'] });
                        }}
                    />
                )}
            </Modal>
        </div>
    );
}
