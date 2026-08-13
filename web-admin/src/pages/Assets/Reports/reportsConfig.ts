export interface ReportColumn {
    key: string;
    label: string;
    format?: 'currency' | 'date' | 'status' | 'number' | 'percent' | 'badge';
    align?: 'left' | 'center' | 'right';
}

export interface ReportKPI {
    label: string;
    value: string | number;
    subtext?: string;
    color?: string;
}

export interface ReportDefinition {
    id: string;
    title: string;
    category: 'Key Reports' | 'Other Reports';
    description: string;
    kpis: (data: any[]) => ReportKPI[];
    columns: ReportColumn[];
    sampleData: any[];
}

export const ASSET_REPORTS_CONFIG: Record<string, ReportDefinition> = {
    'depreciation-ledger': {
        id: 'depreciation-ledger',
        title: 'Asset Depreciation Ledger',
        category: 'Key Reports',
        description: 'Laporan rincian akumulasi penyusutan dan nilai buku (Net Book Value) aset tetap per kategori.',
        kpis: (data) => {
            const totalPurchase = data.reduce((acc, i) => acc + (i.purchase_price || 0), 0);
            const totalDep = data.reduce((acc, i) => acc + (i.accumulated_depreciation || 0), 0);
            const totalBookValue = totalPurchase - totalDep;
            return [
                { label: 'Total Nilai Perolehan (CAPEX)', value: `Rp ${(totalPurchase / 1_000_000_000).toFixed(2)} M`, subtext: `${data.length} Total Aset`, color: 'text-cyan-500 bg-cyan-500/10' },
                { label: 'Akumulasi Penyusutan', value: `Rp ${(totalDep / 1_000_000_000).toFixed(2)} M`, subtext: 'Penyusutan s.d. periode ini', color: 'text-amber-500 bg-amber-500/10' },
                { label: 'Nilai Buku (Net Book Value)', value: `Rp ${(totalBookValue / 1_000_000_000).toFixed(2)} M`, subtext: `${((totalBookValue / (totalPurchase || 1)) * 100).toFixed(1)}% dari CAPEX`, color: 'text-emerald-500 bg-emerald-500/10' },
            ];
        },
        columns: [
            { key: 'code', label: 'Kode Aset' },
            { key: 'name', label: 'Nama Aset' },
            { key: 'category', label: 'Kategori' },
            { key: 'purchase_date', label: 'Tgl Perolehan', format: 'date' },
            { key: 'purchase_price', label: 'Harga Beli (Rp)', format: 'currency', align: 'right' },
            { key: 'method', label: 'Metode Depresiasi' },
            { key: 'useful_life', label: 'Umur Econ', align: 'center' },
            { key: 'accumulated_depreciation', label: 'Akumulasi Penyusutan', format: 'currency', align: 'right' },
            { key: 'book_value', label: 'Nilai Buku (Rp)', format: 'currency', align: 'right' },
        ],
        sampleData: [
            { id: '1', code: 'AST-BGN-2022-00001', name: 'Gedung Kantor Pusat Suvarna', category: 'Bangunan & Infrastruktur', purchase_date: '2022-01-15', purchase_price: 1500000000, method: 'Garis Lurus', useful_life: '20 Thn', accumulated_depreciation: 343750000, book_value: 1156250000 },
            { id: '2', code: 'AST-MSN-2023-00004', name: 'Mesin Batching Plant 120m3/h', category: 'Mesin & Peralatan Pabrik', purchase_date: '2023-03-10', purchase_price: 850000000, method: 'Garis Lurus', useful_life: '10 Thn', accumulated_depreciation: 290416667, book_value: 559583333 },
            { id: '3', code: 'AST-ALT-2024-00012', name: 'Excavator Caterpillar 320 GC', category: 'Alat Berat & Excavator', purchase_date: '2024-05-20', purchase_price: 1250000000, method: 'Saldo Menurun', useful_life: '8 Thn', accumulated_depreciation: 351562500, book_value: 898437500 },
            { id: '4', code: 'AST-KND-2023-00008', name: 'Dump Truck Hino 500 FM 260', category: 'Kendaraan Operasional', purchase_date: '2023-11-01', purchase_price: 620000000, method: 'Garis Lurus', useful_life: '5 Thn', accumulated_depreciation: 341000000, book_value: 279000000 },
            { id: '5', code: 'AST-IT-2025-00021', name: 'Server Rack Dell PowerEdge R750', category: 'Perangkat Komputer & IT', purchase_date: '2025-02-14', purchase_price: 145000000, method: 'Jumlah Angka Tahun', useful_life: '3 Thn', accumulated_depreciation: 72500000, book_value: 72500000 },
        ]
    },

    'roi-trends': {
        id: 'roi-trends',
        title: 'Asset ROI & Cost Trends',
        category: 'Key Reports',
        description: 'Analisis imbal hasil investasi (ROI %) dan perbandingan pendapatan sewa vs total biaya pemeliharaan.',
        kpis: (data) => {
            const totalInv = data.reduce((acc, i) => acc + (i.investment || 0), 0);
            const totalRev = data.reduce((acc, i) => acc + (i.total_revenue || 0), 0);
            const totalCost = data.reduce((acc, i) => acc + (i.total_maint_cost || 0), 0);
            const netProfit = totalRev - totalCost;
            const avgRoi = ((netProfit / (totalInv || 1)) * 100).toFixed(1);
            return [
                { label: 'Total Rental Revenue', value: `Rp ${(totalRev / 1_000_000).toFixed(0)} Jt`, subtext: 'Pendapatan sewa kumulatif', color: 'text-emerald-500 bg-emerald-500/10' },
                { label: 'Total Maintenance Cost', value: `Rp ${(totalCost / 1_000_000).toFixed(0)} Jt`, subtext: 'Biaya perawatan kumulatif', color: 'text-rose-500 bg-rose-500/10' },
                { label: 'Rata-Rata ROI Investasi', value: `${avgRoi}%`, subtext: 'Net profit / Nilai investasi', color: 'text-purple-500 bg-purple-500/10' },
            ];
        },
        columns: [
            { key: 'code', label: 'Kode Aset' },
            { key: 'name', label: 'Nama Aset' },
            { key: 'category', label: 'Kategori' },
            { key: 'investment', label: 'Investasi Awal (Rp)', format: 'currency', align: 'right' },
            { key: 'total_revenue', label: 'Pendapatan Sewa (Rp)', format: 'currency', align: 'right' },
            { key: 'total_maint_cost', label: 'Biaya Perawatan (Rp)', format: 'currency', align: 'right' },
            { key: 'net_profit', label: 'Net Profit (Rp)', format: 'currency', align: 'right' },
            { key: 'roi_percent', label: 'ROI (%)', align: 'center', format: 'percent' },
            { key: 'status', label: 'Performa', format: 'status' },
        ],
        sampleData: [
            { id: '1', code: 'AST-ALT-2024-00012', name: 'Excavator Caterpillar 320 GC', category: 'Alat Berat', investment: 1250000000, total_revenue: 680000000, total_maint_cost: 85000000, net_profit: 595000000, roi_percent: 47.6, status: 'Sangat Tinggi' },
            { id: '2', code: 'AST-KND-2023-00008', name: 'Dump Truck Hino 500 FM', category: 'Kendaraan', investment: 620000000, total_revenue: 340000000, total_maint_cost: 62000000, net_profit: 278000000, roi_percent: 44.8, status: 'Tinggi' },
            { id: '3', code: 'AST-MSN-2023-00004', name: 'Mesin Batching Plant 120m3', category: 'Mesin Pabrik', investment: 850000000, total_revenue: 410000000, total_maint_cost: 110000000, net_profit: 300000000, roi_percent: 35.3, status: 'Moderat' },
            { id: '4', code: 'AST-ALT-2022-00002', name: 'Wheel Loader Komatsu WA380', category: 'Alat Berat', investment: 980000000, total_revenue: 520000000, total_maint_cost: 240000000, net_profit: 280000000, roi_percent: 28.5, status: 'Perlu Evaluasi' },
        ]
    },

    'condition-distribution': {
        id: 'condition-distribution',
        title: 'Asset Condition Distribution',
        category: 'Key Reports',
        description: 'Pemetaan sebaran kondisi fisik, kesehatan teknis, dan kesiapan operasional seluruh aset.',
        kpis: (data) => {
            const total = data.length;
            const good = data.filter(i => i.condition === 'Sangat Baik' || i.condition === 'Baik').length;
            const repair = data.filter(i => i.condition === 'Rusak Ringan' || i.condition === 'Dalam Perbaikan').length;
            const bad = data.filter(i => i.condition === 'Rusak Berat' || i.condition === 'Scrap').length;
            return [
                { label: 'Siap Operasional (Baik)', value: `${good} Aset`, subtext: `${((good / (total || 1)) * 100).toFixed(0)}% dari total armada`, color: 'text-emerald-500 bg-emerald-500/10' },
                { label: 'Perlu Maintenance/Perbaikan', value: `${repair} Aset`, subtext: `${((repair / (total || 1)) * 100).toFixed(0)}% butuh servis`, color: 'text-amber-500 bg-amber-500/10' },
                { label: 'Kondisi Kritis / Afkir', value: `${bad} Aset`, subtext: `${((bad / (total || 1)) * 100).toFixed(0)}% perlu replacement`, color: 'text-rose-500 bg-rose-500/10' },
            ];
        },
        columns: [
            { key: 'code', label: 'Kode Aset' },
            { key: 'name', label: 'Nama Aset' },
            { key: 'category', label: 'Kategori' },
            { key: 'location', label: 'Lokasi Operasional' },
            { key: 'condition', label: 'Kondisi Fisik', format: 'status' },
            { key: 'operating_hours', label: 'Jam Kerja / KM' },
            { key: 'last_inspected', label: 'Inspeksi Terakhir', format: 'date' },
            { key: 'remarks', label: 'Catatan Kesiapan' },
        ],
        sampleData: [
            { id: '1', code: 'AST-ALT-2024-00012', name: 'Excavator Caterpillar 320 GC', category: 'Alat Berat', location: 'Site Tambang A - Morowali', condition: 'Sangat Baik', operating_hours: '1.420 Jam', last_inspected: '2026-08-01', remarks: 'Performa hidrolik optimal, siap kerja berat' },
            { id: '2', code: 'AST-KND-2023-00008', name: 'Dump Truck Hino 500 FM', category: 'Kendaraan', location: 'Pool Utama Jakarta', condition: 'Baik', operating_hours: '42.500 KM', last_inspected: '2026-07-28', remarks: 'Ban depan aus 30%, oli baru diganti' },
            { id: '3', code: 'AST-MSN-2023-00004', name: 'Mesin Batching Plant 120m3', category: 'Mesin Pabrik', location: 'Pabrik Kebon Jeruk', condition: 'Dalam Perbaikan', operating_hours: '3.100 Jam', last_inspected: '2026-08-10', remarks: 'Perbaikan sensor timbangan semen' },
            { id: '4', code: 'AST-ALT-2021-00001', name: 'Bulldozer Shantui SD22', category: 'Alat Berat', location: 'Site Kendari', condition: 'Rusak Ringan', operating_hours: '6.800 Jam', last_inspected: '2026-08-05', remarks: 'Track shoe perlu dikencangkan & oli transmisi bocor halus' },
            { id: '5', code: 'AST-IT-2020-00002', name: 'PC Workstation HP Z440', category: 'IT', location: 'Kantor Pusat - Lt 3', condition: 'Rusak Berat', operating_hours: '24.000 Jam', last_inspected: '2026-06-12', remarks: 'Motherboard konslet, direkomendasikan scrap' },
        ]
    },

    'workorder-summary': {
        id: 'workorder-summary',
        title: 'Work Order Maintenance Summary',
        category: 'Key Reports',
        description: 'Rekapitulasi status eksekusi Perintah Kerja Pemeliharaan (Preventif vs Korektif) dan realisasi biaya.',
        kpis: (data) => {
            const totalWo = data.length;
            const completed = data.filter(i => i.status === 'Completed' || i.status === 'Selesai').length;
            const totalCost = data.reduce((acc, i) => acc + (i.total_cost || 0), 0);
            return [
                { label: 'Total Work Orders', value: `${totalWo} WO`, subtext: 'Periode berjalan', color: 'text-blue-500 bg-blue-500/10' },
                { label: 'WO Selesai (Completion Rate)', value: `${completed} / ${totalWo}`, subtext: `${((completed / (totalWo || 1)) * 100).toFixed(0)}% diselesaikan tepat waktu`, color: 'text-emerald-500 bg-emerald-500/10' },
                { label: 'Total Biaya WO (Sparepart+Jasa)', value: `Rp ${(totalCost / 1_000_000).toFixed(1)} Jt`, subtext: 'Realisasi biaya perawatan', color: 'text-purple-500 bg-purple-500/10' },
            ];
        },
        columns: [
            { key: 'wo_number', label: 'No. Work Order' },
            { key: 'wo_type', label: 'Tipe WO' },
            { key: 'asset_name', label: 'Aset / Unit' },
            { key: 'team_name', label: 'Tim Teknisi' },
            { key: 'scheduled_date', label: 'Tgl Jadwal', format: 'date' },
            { key: 'completed_date', label: 'Tgl Selesai', format: 'date' },
            { key: 'parts_cost', label: 'Biaya Part (Rp)', format: 'currency', align: 'right' },
            { key: 'labor_cost', label: 'Biaya Jasa (Rp)', format: 'currency', align: 'right' },
            { key: 'total_cost', label: 'Total Biaya (Rp)', format: 'currency', align: 'right' },
            { key: 'status', label: 'Status', format: 'status' },
        ],
        sampleData: [
            { id: '1', wo_number: 'WO-2026-08-001', wo_type: 'PM (Preventif)', asset_name: 'Excavator Caterpillar 320 GC', team_name: 'Tim Mechanical Heavy Equipment', scheduled_date: '2026-08-05', completed_date: '2026-08-05', parts_cost: 4500000, labor_cost: 1500000, total_cost: 6000000, status: 'Completed' },
            { id: '2', wo_number: 'WO-2026-08-002', wo_type: 'CM (Korektif)', asset_name: 'Dump Truck Hino 500 FM', team_name: 'Tim Fleet Automotive', scheduled_date: '2026-08-08', completed_date: '2026-08-09', parts_cost: 12500000, labor_cost: 3000000, total_cost: 15500000, status: 'Completed' },
            { id: '3', wo_number: 'WO-2026-08-003', wo_type: 'PM (Preventif)', asset_name: 'Mesin Batching Plant 120m3', team_name: 'Tim Electrical & Automation', scheduled_date: '2026-08-12', completed_date: null, parts_cost: 2000000, labor_cost: 1000000, total_cost: 3000000, status: 'In Progress' },
            { id: '4', wo_number: 'WO-2026-08-004', wo_type: 'Inspeksi', asset_name: 'Server Rack Dell PowerEdge', team_name: 'Tim IT Infrastructure', scheduled_date: '2026-08-15', completed_date: null, parts_cost: 0, labor_cost: 500000, total_cost: 500000, status: 'Planned' },
        ]
    },

    'fuel-consumption': {
        id: 'fuel-consumption',
        title: 'Fuel Consumption Report',
        category: 'Key Reports',
        description: 'Pemantauan konsumsi bahan bakar minyak (BBM), total biaya, dan rasio efisiensi KM/Liter atau Jam/Liter.',
        kpis: (data) => {
            const totalLiters = data.reduce((acc, i) => acc + (i.total_liters || 0), 0);
            const totalCost = data.reduce((acc, i) => acc + (i.total_cost || 0), 0);
            const avgEfficiency = (data.reduce((acc, i) => acc + (i.efficiency_ratio || 0), 0) / (data.length || 1)).toFixed(2);
            return [
                { label: 'Total Konsumsi BBM', value: `${totalLiters.toLocaleString()} Liter`, subtext: 'BBM solar & bensin', color: 'text-amber-500 bg-amber-500/10' },
                { label: 'Total Biaya BBM', value: `Rp ${(totalCost / 1_000_000).toFixed(1)} Jt`, subtext: 'Pengeluaran BBM kumulatif', color: 'text-rose-500 bg-rose-500/10' },
                { label: 'Rata-Rata Efisiensi Fleet', value: `${avgEfficiency} KM/L`, subtext: 'Indikator efisiensi bahan bakar', color: 'text-emerald-500 bg-emerald-500/10' },
            ];
        },
        columns: [
            { key: 'code', label: 'Kode Armada' },
            { key: 'name', label: 'Nama Unit / Armada' },
            { key: 'fuel_type', label: 'Jenis BBM' },
            { key: 'total_liters', label: 'Volume (Liter)', align: 'right' },
            { key: 'total_cost', label: 'Total Biaya (Rp)', format: 'currency', align: 'right' },
            { key: 'distance_run', label: 'Jarak / Jam Kerja', align: 'right' },
            { key: 'efficiency_ratio', label: 'Rasio (KM/L)', align: 'center' },
            { key: 'status', label: 'Status Efisiensi', format: 'status' },
        ],
        sampleData: [
            { id: '1', code: 'AST-KND-2023-00008', name: 'Dump Truck Hino 500 FM', fuel_type: 'Solar B35', total_liters: 1450, total_cost: 21750000, distance_run: '5.220 KM', efficiency_ratio: 3.6, status: 'Normal' },
            { id: '2', code: 'AST-ALT-2024-00012', name: 'Excavator Caterpillar 320 GC', fuel_type: 'Solar B35 Industrial', total_liters: 2800, total_cost: 44800000, distance_run: '280 Jam', efficiency_ratio: 0.1, status: 'Normal' },
            { id: '3', code: 'AST-KND-2022-00003', name: 'Toyota Hilux Double Cab', fuel_type: 'Dexlite', total_liters: 620, total_cost: 9300000, distance_run: '4.960 KM', efficiency_ratio: 8.0, status: 'Sangat Hemat' },
            { id: '4', code: 'AST-KND-2021-00001', name: 'Dump Truck Nissan CWT', fuel_type: 'Solar B35', total_liters: 1890, total_cost: 28350000, distance_run: '4.150 KM', efficiency_ratio: 2.2, status: 'Boros (Perlu Servis)' },
        ]
    },

    'custody-history': {
        id: 'custody-history',
        title: 'Asset Custody & Transfer History',
        category: 'Other Reports',
        description: 'Rekam jejak mutasi penanggungjawab fisik (Custodianship) dan perpindahan lokasi aset.',
        kpis: (data) => {
            return [
                { label: 'Total Mutasi Aset', value: `${data.length} Rekam`, subtext: 'Histori penanggungjawab', color: 'text-cyan-500 bg-cyan-500/10' },
                { label: 'Mutasi Bulan Ini', value: '3 Transfer', subtext: 'Proses serah terima selesai', color: 'text-purple-500 bg-purple-500/10' },
                { label: 'Penanggungjawab Aktif', value: '42 Pegawai', subtext: 'Pemegang fisik aset', color: 'text-emerald-500 bg-emerald-500/10' },
            ];
        },
        columns: [
            { key: 'transfer_no', label: 'No. Mutasi' },
            { key: 'asset_code', label: 'Kode Aset' },
            { key: 'asset_name', label: 'Nama Aset' },
            { key: 'from_custodian', label: 'Penanggungjawab Lama' },
            { key: 'to_custodian', label: 'Penanggungjawab Baru' },
            { key: 'from_location', label: 'Lokasi Asal' },
            { key: 'to_location', label: 'Lokasi Tujuan' },
            { key: 'transfer_date', label: 'Tgl Mutasi', format: 'date' },
            { key: 'status', label: 'Status Serah Terima', format: 'status' },
        ],
        sampleData: [
            { id: '1', transfer_no: 'TRF-2026-08-01', asset_code: 'AST-IT-2025-00021', asset_name: 'Laptop Lenovo ThinkPad P16', from_custodian: 'Budi Santoso (IT Support)', to_custodian: 'Rina Permata (Senior Accountant)', from_location: 'Gudang IT Center', to_location: 'Kantor Pusat Lt 2', transfer_date: '2026-08-02', status: 'Selesai (BAST OK)' },
            { id: '2', transfer_no: 'TRF-2026-07-15', asset_code: 'AST-KND-2023-00008', asset_name: 'Dump Truck Hino 500 FM', from_custodian: 'Ahmad Subagyo (Fleet Ops)', to_custodian: 'Joko Widodo (Site Manager)', from_location: 'Pool Jakarta', to_location: 'Site Tambang Morowali', transfer_date: '2026-07-15', status: 'Selesai (BAST OK)' },
            { id: '3', transfer_no: 'TRF-2026-08-10', asset_code: 'AST-ALT-2024-00012', asset_name: 'Excavator Caterpillar 320 GC', from_custodian: 'Joko Widodo (Site Manager)', to_custodian: 'Hendra Setiawan (Project Admin)', from_location: 'Site Morowali', to_location: 'Site Halmahera', transfer_date: '2026-08-10', status: 'Dalam Pengiriman' },
        ]
    },

    'team-performance': {
        id: 'team-performance',
        title: 'Maintenance Team Performance',
        category: 'Other Reports',
        description: 'Evaluasi produktivitas, kecepatan perbaikan (MTTR), dan efisiensi tim teknisi pemeliharaan.',
        kpis: (data) => {
            const totalWo = data.reduce((acc, i) => acc + (i.wo_completed || 0), 0);
            return [
                { label: 'Total Tim Pemeliharaan', value: `${data.length} Tim`, subtext: 'Mekanik & Teknisi Internal', color: 'text-indigo-500 bg-indigo-500/10' },
                { label: 'WO Diselesaikan', value: `${totalWo} WO`, subtext: 'Produktivitas periode ini', color: 'text-emerald-500 bg-emerald-500/10' },
                { label: 'Rata-Rata MTTR Fleet', value: '4.2 Jam', subtext: 'Mean Time to Repair', color: 'text-cyan-500 bg-cyan-500/10' },
            ];
        },
        columns: [
            { key: 'team_code', label: 'Kode Tim' },
            { key: 'team_name', label: 'Nama Tim Teknisi' },
            { key: 'leader', label: 'Ketua Tim / Lead' },
            { key: 'specialty', label: 'Spesialisasi Utama' },
            { key: 'wo_completed', label: 'WO Selesai', align: 'center' },
            { key: 'avg_repair_hours', label: 'Rata-rata Durasi (Jam)', align: 'center' },
            { key: 'total_cost_managed', label: 'Biaya Dikelola (Rp)', format: 'currency', align: 'right' },
            { key: 'performance_rating', label: 'Rating Performa', format: 'status' },
        ],
        sampleData: [
            { id: '1', team_code: 'TM-MECH-01', team_name: 'Tim Mechanical Heavy Equipment', leader: 'Bambang Trihatmodjo', specialty: 'Alat Berat & Excavator', wo_completed: 18, avg_repair_hours: 5.5, total_cost_managed: 48000000, performance_rating: 'Sangat Baik (96%)' },
            { id: '2', team_code: 'TM-FLEET-02', team_name: 'Tim Fleet Automotive', leader: 'Dedi Kurniawan', specialty: 'Dump Truck & Kendaraan', wo_completed: 24, avg_repair_hours: 3.2, total_cost_managed: 32000000, performance_rating: 'Baik (92%)' },
            { id: '3', team_code: 'TM-ELEC-03', team_name: 'Tim Electrical & Automation', leader: 'Eko Prasetyo', specialty: 'Panel Mesin & Sensor PLC', wo_completed: 12, avg_repair_hours: 2.8, total_cost_managed: 18500000, performance_rating: 'Sangat Baik (98%)' },
            { id: '4', team_code: 'TM-IT-04', team_name: 'Tim IT Infrastructure & Network', leader: 'Fajar Nugraha', specialty: 'Server, Network & PC', wo_completed: 30, avg_repair_hours: 1.5, total_cost_managed: 8500000, performance_rating: 'Sangat Baik (99%)' },
        ]
    },

    'tax-expiry': {
        id: 'tax-expiry',
        title: 'Tax Renewal Expiry Schedule',
        category: 'Other Reports',
        description: 'Jadwal kontrol jatuh tempo dokumen legalitas, pajak tahunan, KIR, sertifikasi K3, dan asuransi.',
        kpis: (data) => {
            const warningCount = data.filter(i => i.days_remaining <= 30 && i.days_remaining >= 0).length;
            const overdueCount = data.filter(i => i.days_remaining < 0).length;
            const totalEstCost = data.reduce((acc, i) => acc + (i.est_cost || 0), 0);
            return [
                { label: 'Jatuh Tempo < 30 Hari', value: `${warningCount} Dokumen`, subtext: 'Perlu perpanjangan segera', color: 'text-amber-500 bg-amber-500/10' },
                { label: 'Dokumen Kadaluarsa (Overdue)', value: `${overdueCount} Dokumen`, subtext: 'Wajib diproses!', color: 'text-rose-500 bg-rose-500/10' },
                { label: 'Estimasi Biaya Pajak & KIR', value: `Rp ${(totalEstCost / 1_000_000).toFixed(1)} Jt`, subtext: 'Anggaran perpanjangan', color: 'text-cyan-500 bg-cyan-500/10' },
            ];
        },
        columns: [
            { key: 'asset_code', label: 'Kode Aset' },
            { key: 'asset_name', label: 'Nama Kendaraan / Aset' },
            { key: 'doc_type', label: 'Jenis Dokumen' },
            { key: 'doc_number', label: 'No. Dokumen' },
            { key: 'expiry_date', label: 'Tgl Expiry', format: 'date' },
            { key: 'days_remaining', label: 'Sisa Hari', align: 'center' },
            { key: 'est_cost', label: 'Est. Biaya (Rp)', format: 'currency', align: 'right' },
            { key: 'status', label: 'Status Kepatuhan', format: 'status' },
        ],
        sampleData: [
            { id: '1', asset_code: 'AST-KND-2023-00008', asset_name: 'Dump Truck Hino 500 FM', doc_type: 'Pajak Tahunan STNK', doc_number: 'B 9482 UDF', expiry_date: '2026-08-25', days_remaining: 12, est_cost: 6500000, status: 'Peringatan (< 30 Hari)' },
            { id: '2', asset_code: 'AST-KND-2023-00008', asset_name: 'Dump Truck Hino 500 FM', doc_type: 'Uji Berkala KIR', doc_number: 'KIR-JKT-88492', expiry_date: '2026-09-10', days_remaining: 28, est_cost: 750000, status: 'Peringatan (< 30 Hari)' },
            { id: '3', asset_code: 'AST-ALT-2024-00012', asset_name: 'Excavator Caterpillar 320 GC', doc_type: 'Sertifikasi K3 Alat Berat', doc_number: 'K3-DISNAKER-492', expiry_date: '2026-11-30', days_remaining: 109, est_cost: 3500000, status: 'Aman (> 60 Hari)' },
            { id: '4', asset_code: 'AST-KND-2021-00001', asset_name: 'Dump Truck Nissan CWT', doc_type: 'Pajak Tahunan STNK', doc_number: 'B 9102 TKR', expiry_date: '2026-08-01', days_remaining: -12, est_cost: 7200000, status: 'Overdue (Kadaluarsa)' },
        ]
    },

    'cost-analysis': {
        id: 'cost-analysis',
        title: 'Asset Maintenance Cost Analysis',
        category: 'Other Reports',
        description: 'Analisis struktur rincian biaya perawatan aset (sparepart vs jasa teknisi) dan rasio terhadap nilai perolehan aset.',
        kpis: (data) => {
            const totalParts = data.reduce((acc, i) => acc + (i.parts_total || 0), 0);
            const totalLabor = data.reduce((acc, i) => acc + (i.labor_total || 0), 0);
            const totalCost = totalParts + totalLabor;
            return [
                { label: 'Total Maintenance Expense', value: `Rp ${(totalCost / 1_000_000).toFixed(1)} Jt`, subtext: 'Sparepart + Jasa Bengkel', color: 'text-purple-500 bg-purple-500/10' },
                { label: 'Pengeluaran Sparepart', value: `Rp ${(totalParts / 1_000_000).toFixed(1)} Jt`, subtext: `${((totalParts / (totalCost || 1)) * 100).toFixed(0)}% dari total biaya`, color: 'text-cyan-500 bg-cyan-500/10' },
                { label: 'Pengeluaran Jasa / Labor', value: `Rp ${(totalLabor / 1_000_000).toFixed(1)} Jt`, subtext: `${((totalLabor / (totalCost || 1)) * 100).toFixed(0)}% dari total biaya`, color: 'text-amber-500 bg-amber-500/10' },
            ];
        },
        columns: [
            { key: 'code', label: 'Kode Aset' },
            { key: 'name', label: 'Nama Aset' },
            { key: 'category', label: 'Kategori' },
            { key: 'asset_value', label: 'Nilai Aset (Rp)', format: 'currency', align: 'right' },
            { key: 'parts_total', label: 'Total Sparepart (Rp)', format: 'currency', align: 'right' },
            { key: 'labor_total', label: 'Total Jasa (Rp)', format: 'currency', align: 'right' },
            { key: 'total_maint_cost', label: 'Total Pemeliharaan (Rp)', format: 'currency', align: 'right' },
            { key: 'cost_ratio', label: 'Rasio Biaya vs Nilai (%)', format: 'percent', align: 'center' },
            { key: 'status', label: 'Evaluasi Efisiensi', format: 'status' },
        ],
        sampleData: [
            { id: '1', code: 'AST-ALT-2024-00012', name: 'Excavator Caterpillar 320 GC', category: 'Alat Berat', asset_value: 1250000000, parts_total: 62000000, labor_total: 23000000, total_maint_cost: 85000000, cost_ratio: 6.8, status: 'Efisien (< 10%)' },
            { id: '2', code: 'AST-KND-2023-00008', name: 'Dump Truck Hino 500 FM', category: 'Kendaraan', asset_value: 620000000, parts_total: 45000000, labor_total: 17000000, total_maint_cost: 62000000, cost_ratio: 10.0, status: 'Normal (10%)' },
            { id: '3', code: 'AST-MSN-2023-00004', name: 'Mesin Batching Plant 120m3', category: 'Mesin Pabrik', asset_value: 850000000, parts_total: 82000000, labor_total: 28000000, total_maint_cost: 110000000, cost_ratio: 12.9, status: 'Tinggi (> 12%)' },
            { id: '4', code: 'AST-ALT-2022-00002', name: 'Wheel Loader Komatsu WA380', category: 'Alat Berat', asset_value: 980000000, parts_total: 180000000, labor_total: 60000000, total_maint_cost: 240000000, cost_ratio: 24.5, status: 'Perlu Replacement (> 20%)' },
        ]
    }
};
