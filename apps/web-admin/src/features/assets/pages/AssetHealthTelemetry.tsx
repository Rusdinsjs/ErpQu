import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HeartPulse, AlertOctagon, TrendingDown, Clock, ShieldCheck, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, Button, Input, StatusBadge } from'../../../components/ui';
import { assetApi } from'../api/assets';

export default function AssetHealthTelemetry() {
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch Assets to show their health status
    const { data: assetsResponse, isLoading } = useQuery({
        queryKey: ['assets-health'],
        queryFn: () => assetApi.list({ per_page: 20 })
    });

    const assets = assetsResponse?.data || [];

    // Mocking Health Scores since the backend API does not natively return a "health score" yet
    // In a real scenario, this might come from `/api/telemetry/health/:asset_id`
    const healthData = assets.map((asset: any, index: number) => {
        // Generate pseudo-random health metrics based on asset ID for consistency during demo
        const seed = asset.id.charCodeAt(0) + asset.id.charCodeAt(asset.id.length - 1);
        const healthScore = 40 + (seed % 60); 
        
        let status = 'Healthy';
        let risk = 'Low';
        let nextFailure = '> 6 Months';

        if (healthScore < 60) {
            status = 'Critical';
            risk = 'High';
            nextFailure = '< 7 Days';
        } else if (healthScore < 80) {
            status = 'Warning';
            risk = 'Medium';
            nextFailure = '1-2 Months';
        }

        return {
            ...asset,
            healthScore,
            status,
            risk,
            nextFailure,
            anomalies: seed % 5
        };
    });

    const filteredData = healthData.filter((item: any) => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.asset_code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const criticalAssets = healthData.filter((a: any) => a.status === 'Critical').length;
    const warningAssets = healthData.filter((a: any) => a.status === 'Warning').length;
    const healthyAssets = healthData.filter((a: any) => a.status === 'Healthy').length;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                        <HeartPulse className="w-6 h-6 text-rose-500" />
                        Asset Health Telemetry
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Predictive maintenance and overall health scoring of fleet and machinery
                    </p>
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Input 
                        placeholder="Search assets..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-64"
                    />
                </div>
            </div>

            {/* KPI Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-5 flex flex-col justify-center">
                    <p className="text-sm font-medium text-slate-500">Fleet Average Health</p>
                    <div className="flex items-end gap-2 mt-2">
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white">78%</h3>
                        <span className="text-sm text-emerald-500 mb-1 flex items-center"><TrendingDown className="w-3 h-3 mr-1"/> -2%</span>
                    </div>
                </Card>
                <Card className="p-5 flex flex-col justify-center border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Healthy Assets</p>
                            <h3 className="text-3xl font-bold text-emerald-700 dark:text-emerald-300 mt-2">{healthyAssets}</h3>
                        </div>
                        <ShieldCheck className="w-8 h-8 text-emerald-500/50" />
                    </div>
                </Card>
                <Card className="p-5 flex flex-col justify-center border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Needs Attention</p>
                            <h3 className="text-3xl font-bold text-amber-700 dark:text-amber-300 mt-2">{warningAssets}</h3>
                        </div>
                        <Activity className="w-8 h-8 text-amber-500/50" />
                    </div>
                </Card>
                <Card className="p-5 flex flex-col justify-center border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/10">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-rose-600 dark:text-rose-400">Critical / Failing</p>
                            <h3 className="text-3xl font-bold text-rose-700 dark:text-rose-300 mt-2">{criticalAssets}</h3>
                        </div>
                        <AlertOctagon className="w-8 h-8 text-rose-500/50" />
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Health Distribution Chart */}
                <Card className="p-5 lg:col-span-1">
                    <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">Health Distribution</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                                { name: 'Critical (0-59)', count: criticalAssets, color: '#ef4444' },
                                { name: 'Warning (60-79)', count: warningAssets, color: '#f59e0b' },
                                { name: 'Healthy (80-100)', count: healthyAssets, color: '#10b981' }
                            ]}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                    {
                                        [0,1,2].map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={['#ef4444', '#f59e0b', '#10b981'][index]} />
                                        ))
                                    }
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Asset Health Table */}
                <Card className="p-0 overflow-hidden lg:col-span-2 flex flex-col">
                    <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Asset Health Tracker</h3>
                        <Button variant="outline" size="sm">Export Report</Button>
                    </div>
                    
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50 dark:text-slate-400">
                                <tr>
                                    <th className="px-6 py-4">Asset</th>
                                    <th className="px-6 py-4">Health Score</th>
                                    <th className="px-6 py-4">Est. Failure</th>
                                    <th className="px-6 py-4 text-center">Anomalies</th>
                                    <th className="px-6 py-4">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {isLoading ? (
                                    <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading health data...</td></tr>
                                ) : filteredData.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No assets found</td></tr>
                                ) : (
                                    filteredData.slice(0, 8).map((asset: any) => (
                                        <tr key={asset.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-900 dark:text-white">{asset.name}</div>
                                                <div className="text-xs text-slate-500">{asset.asset_code}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-full max-w-[100px] bg-slate-200 rounded-full h-2.5 dark:bg-slate-700">
                                                        <div 
                                                            className={`h-2.5 rounded-full ${asset.status === 'Critical' ? 'bg-rose-500' : asset.status === 'Warning' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                            style={{ width: `${asset.healthScore}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="font-semibold w-8">{asset.healthScore}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className={`w-4 h-4 ${asset.status === 'Critical' ? 'text-rose-500' : 'text-slate-400'}`} />
                                                    <span className={asset.status === 'Critical' ? 'text-rose-600 font-medium' : ''}>{asset.nextFailure}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {asset.anomalies > 0 ? (
                                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-100 text-rose-600 text-xs font-bold dark:bg-rose-900/30 dark:text-rose-400">
                                                        {asset.anomalies}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {asset.status === 'Critical' ? (
                                                    <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white border-transparent">Schedule PM</Button>
                                                ) : (
                                                    <Button variant="outline" size="sm">Details</Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
}
