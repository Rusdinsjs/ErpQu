import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BellRing, ShieldAlert, CheckCircle, Clock, Settings, Search, Filter } from 'lucide-react';
import { Card, Button, Input, StatusBadge } from'../../../components/ui';
import { sensorApi } from'../api/sensor';
import { showToast } from'../../../components/ui/Toast';

export default function ThresholdAlerts() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'alerts' | 'rules'>('alerts');

    // Fetch Active Alerts
    const { data: alerts = [], isLoading } = useQuery({
        queryKey: ['sensor-alerts'],
        queryFn: () => sensorApi.listActiveAlerts()
    });

    // Acknowledge Alert Mutation
    const acknowledgeMutation = useMutation({
        mutationFn: (id: string) => sensorApi.acknowledgeAlert(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sensor-alerts'] });
            showToast('Alert acknowledged successfully', 'success');
        },
        onError: () => {
            showToast('Failed to acknowledge alert', 'error');
        }
    });

    const filteredAlerts = alerts.filter(alert => 
        alert.alert_type?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        alert.severity?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Fallback Mock Data if API returns empty (for UI demonstration purposes)
    const displayAlerts = filteredAlerts.length > 0 ? filteredAlerts : (
        searchTerm ? [] : [
            { id: '1', asset_id: 'A-001', alert_type: 'Temperature Threshold Exceeded', severity: 'critical', sensor_value: 95.5, threshold_value: 90.0, status: 'active', created_at: new Date().toISOString() },
            { id: '2', asset_id: 'A-042', alert_type: 'Vibration Anomaly Detected', severity: 'warning', sensor_value: 1.2, threshold_value: 0.8, status: 'active', created_at: new Date(Date.now() - 3600000).toISOString() }
        ]
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                        <BellRing className="w-6 h-6 text-amber-500" />
                        Threshold Alerts
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Monitor active sensor alerts and manage anomaly detection rules
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200 dark:border-slate-800">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('alerts')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === 'alerts'
                                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                        }`}
                    >
                        Active Alerts
                        {displayAlerts.length > 0 && (
                            <span className="ml-2 bg-rose-100 text-rose-600 py-0.5 px-2.5 rounded-full text-xs dark:bg-rose-900/30 dark:text-rose-400">
                                {displayAlerts.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('rules')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === 'rules'
                                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                        }`}
                    >
                        Threshold Rules
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'alerts' ? (
                <Card className="p-0 overflow-hidden">
                    <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/20">
                        <div className="relative w-full sm:max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input 
                                placeholder="Search alerts..." 
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" className="gap-2"><Filter className="w-4 h-4" /> Filter</Button>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50 dark:text-slate-400">
                                <tr>
                                    <th className="px-6 py-4">Severity</th>
                                    <th className="px-6 py-4">Alert Details</th>
                                    <th className="px-6 py-4">Current vs Limit</th>
                                    <th className="px-6 py-4">Time Triggered</th>
                                    <th className="px-6 py-4">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {isLoading ? (
                                    <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading alerts...</td></tr>
                                ) : displayAlerts.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                            <CheckCircle className="w-12 h-12 mx-auto text-emerald-400 mb-3" />
                                            <p className="text-lg font-medium text-slate-700 dark:text-slate-300">All Clear</p>
                                            <p className="text-sm mt-1">No active threshold alerts found.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    displayAlerts.map((alert: any) => (
                                        <tr key={alert.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                    alert.severity === 'critical' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                                                    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                }`}>
                                                    <ShieldAlert className="w-3.5 h-3.5" />
                                                    {alert.severity?.toUpperCase()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-900 dark:text-white">{alert.alert_type}</div>
                                                <div className="text-xs text-slate-500 mt-0.5">Asset ID: {alert.asset_id}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-900 dark:text-white">{alert.sensor_value}</span>
                                                    <span className="text-slate-400">/</span>
                                                    <span className="text-slate-500">{alert.threshold_value}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-slate-500">
                                                    <Clock className="w-4 h-4" />
                                                    {new Date(alert.created_at).toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Button 
                                                    size="sm" 
                                                    variant="outline" 
                                                    className="w-full sm:w-auto"
                                                    onClick={() => acknowledgeMutation.mutate(alert.id)}
                                                    disabled={acknowledgeMutation.isPending}
                                                >
                                                    Acknowledge
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            ) : (
                <Card className="p-6">
                    <div className="flex flex-col items-center justify-center text-center py-12">
                        <Settings className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Threshold Rules Configuration</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-md mt-2">
                            Define global or asset-specific bounds for telemetry data. When a sensor reports values outside these ranges, an alert is automatically generated.
                        </p>
                        <Button className="mt-6">Create New Rule</Button>
                    </div>
                </Card>
            )}
        </div>
    );
}
