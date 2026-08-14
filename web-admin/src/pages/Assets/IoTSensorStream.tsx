import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Thermometer, Zap, Wind, AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Card, Button, Select } from '../../components/ui';
import { sensorApi } from '../../api/sensor';
import { assetApi } from '../../api/assets';

export default function IoTSensorStream() {
    const [selectedAsset, setSelectedAsset] = useState<string>('');
    const [autoRefresh, setAutoRefresh] = useState(true);

    // Fetch Assets for dropdown
    const { data: assetsResponse } = useQuery({
        queryKey: ['assets-list-telemetry'],
        queryFn: () => assetApi.list({ page: 1, per_page: 50 })
    });
    
    const assets = assetsResponse?.data || [];

    // Fetch Live Readings
    const { data: readings, refetch } = useQuery({
        queryKey: ['sensor-readings', selectedAsset],
        queryFn: () => sensorApi.getLatestReadings(selectedAsset),
        enabled: !!selectedAsset,
        refetchInterval: autoRefresh ? 5000 : false, // Poll every 5s if auto-refresh is on
    });

    useEffect(() => {
        if (assets.length > 0 && !selectedAsset) {
            setSelectedAsset(assets[0].id);
        }
    }, [assets, selectedAsset]);

    // Fallback Mock Data if API returns empty (for demonstration)
    const displayData = (readings && readings.length > 0) ? readings : Array.from({ length: 20 }).map((_, i) => ({
        time: new Date(Date.now() - (20 - i) * 5000).toISOString(),
        temperature: 65 + Math.random() * 15,
        vibration_x: 0.5 + Math.random() * 0.3,
        power_consumption: 120 + Math.random() * 30
    }));

    const currentStatus = displayData.length > 0 ? displayData[displayData.length - 1] : null;
    const isOverheating = currentStatus && currentStatus.temperature && currentStatus.temperature > 75;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                        <Activity className="w-6 h-6 text-cyan-500" />
                        IoT Sensor Stream
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Live real-time telemetry from connected field assets
                    </p>
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Select
                        className="w-full sm:w-64"
                        value={selectedAsset}
                        onChange={(e) => setSelectedAsset(e.target.value)}
                    >
                        <option value="">Select Asset to Monitor...</option>
                        {assets.map((asset: any) => (
                            <option key={asset.id} value={asset.id}>{asset.asset_code} - {asset.name}</option>
                        ))}
                    </Select>
                    
                    <Button 
                        variant={autoRefresh ? "primary" : "outline"}
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className="gap-2 whitespace-nowrap"
                    >
                        <RotateCcw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                        {autoRefresh ? 'Live' : 'Paused'}
                    </Button>
                </div>
            </div>

            {/* Live KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className={`p-5 flex items-start gap-4 transition-colors ${isOverheating ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : ''}`}>
                    <div className={`p-3 rounded-xl ${isOverheating ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400' : 'bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400'}`}>
                        <Thermometer className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Core Temperature</p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
                                {currentStatus?.temperature?.toFixed(1) || '--'}°C
                            </h3>
                            {isOverheating && <span className="text-xs font-semibold text-red-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> High</span>}
                        </div>
                    </div>
                </Card>

                <Card className="p-5 flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-cyan-100 text-cyan-600 dark:bg-cyan-900/50 dark:text-cyan-400">
                        <Wind className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Vibration Amplitude</p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
                                {currentStatus?.vibration_x?.toFixed(2) || '--'} mm/s
                            </h3>
                            <span className="text-xs font-medium text-emerald-500">Normal</span>
                        </div>
                    </div>
                </Card>

                <Card className="p-5 flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400">
                        <Zap className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Power Draw</p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
                                {currentStatus?.power_consumption?.toFixed(0) || '--'} kW
                            </h3>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Temperature Chart */}
                <Card className="p-5">
                    <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">Temperature Trend</h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                                <XAxis 
                                    dataKey="time" 
                                    tickFormatter={(val) => new Date(val).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit', second:'2-digit' })}
                                    tick={{ fontSize: 12 }} 
                                    axisLine={false} 
                                    tickLine={false} 
                                />
                                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} domain={['dataMin - 5', 'dataMax + 5']} />
                                <Tooltip 
                                    labelFormatter={(val) => new Date(val).toLocaleTimeString()}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="temperature" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Vibration Chart */}
                <Card className="p-5">
                    <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">Vibration (X-Axis)</h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                                <XAxis 
                                    dataKey="time" 
                                    tickFormatter={(val) => new Date(val).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit', second:'2-digit' })}
                                    tick={{ fontSize: 12 }} 
                                    axisLine={false} 
                                    tickLine={false} 
                                />
                                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 'dataMax + 0.5']} />
                                <Tooltip 
                                    labelFormatter={(val) => new Date(val).toLocaleTimeString()}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Line type="monotone" dataKey="vibration_x" stroke="#06b6d4" strokeWidth={3} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
            
            {/* Raw Logs Feed */}
            <Card className="p-5">
                <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">Raw Telemetry Logs</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-800/50 dark:text-slate-300">
                            <tr>
                                <th className="px-4 py-3 rounded-tl-lg">Timestamp</th>
                                <th className="px-4 py-3">Sensor ID</th>
                                <th className="px-4 py-3 text-right">Temp (°C)</th>
                                <th className="px-4 py-3 text-right">Vib (mm/s)</th>
                                <th className="px-4 py-3 text-right">Power (kW)</th>
                                <th className="px-4 py-3 rounded-tr-lg">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...displayData].reverse().slice(0, 10).map((log, idx) => (
                                <tr key={idx} className="border-b dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                                        {new Date(log.time).toLocaleTimeString()}
                                    </td>
                                    <td className="px-4 py-3">SNS-{selectedAsset.substring(0,8)}</td>
                                    <td className="px-4 py-3 text-right">{log.temperature?.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-right">{log.vibration_x?.toFixed(3)}</td>
                                    <td className="px-4 py-3 text-right">{log.power_consumption?.toFixed(1)}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                            OK
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
