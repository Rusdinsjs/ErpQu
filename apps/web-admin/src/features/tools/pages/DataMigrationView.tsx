import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  FileText,
  Layers,
  ArrowRight,
  Database,
  Users,
  Box,
  Truck,
} from 'lucide-react';
import http from '../../../api/http';

interface DataImportRecord {
  id: string;
  doctype_name: string;
  file_name: string;
  import_type: string;
  status: string;
  total_rows: number;
  successful_rows: number;
  failed_rows?: number;
  created_at: string;
}

export const DataMigrationView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'template' | 'import' | 'history' | 'export'>('template');
  
  // Template tab state
  const [templateDocType, setTemplateDocType] = useState('item');
  const [importMode, setImportMode] = useState('Insert');

  // Import tab state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadDocType, setUploadDocType] = useState('item');
  const [isUploading, setIsUploading] = useState(false);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);

  // History tab state
  const [historyList, setHistoryList] = useState<DataImportRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Fetch import history
  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await http.get('/api/data-imports');
      const data = res.data?.data || res.data || [];
      setHistoryList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch data imports:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  // Handle template download
  const handleDownloadTemplate = async () => {
    try {
      const response = await http.post(
        '/api/data-imports/template',
        {
          doctype_name: templateDocType,
          import_type: importMode,
        },
        { responseType: 'blob' }
      );

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `template_${templateDocType}_${importMode.toLowerCase()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error('Download template error:', err);
      alert('Gagal mengunduh template CSV');
    }
  };

  // Handle active data export
  const handleExportData = async (docType: string) => {
    try {
      const response = await http.get(`/api/data-imports/export/${docType}`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `export_${docType}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error('Export data error:', err);
      alert('Gagal mengekspor data master');
    }
  };

  // Handle file select and parse preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setValidationErrors([]);
    setImportSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const lines = content.split('\n').filter((l) => l.trim().length > 0);
      if (lines.length <= 1) {
        setValidationErrors(['File CSV kosong atau hanya memiliki baris header.']);
        return;
      }
      const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
      const rows = lines.slice(1, 6).map((line) => {
        const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
        const obj: Record<string, string> = {};
        headers.forEach((h, idx) => {
          obj[h] = values[idx] || '';
        });
        return obj;
      });
      setPreviewRows(rows);
    };
    reader.readAsText(file);
  };

  // Handle start import
  const handleStartImport = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setImportSuccessMsg(null);
    setValidationErrors([]);

    try {
      // Read all lines
      const content = await selectedFile.text();
      const lines = content.split('\n').filter((l) => l.trim().length > 0);
      if (lines.length <= 1) {
        setValidationErrors(['File CSV tidak memiliki data baris untuk diimpor.']);
        setIsUploading(false);
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
      const rows = lines.slice(1).map((line) => {
        const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
        const obj: Record<string, string> = {};
        headers.forEach((h, idx) => {
          obj[h] = values[idx] || '';
        });
        return obj;
      });

      const payload = {
        doctype_name: uploadDocType,
        import_type: 'Insert',
        file_name: selectedFile.name,
        rows,
      };

      const res = await http.post('/api/data-imports/upload', payload);
      setImportSuccessMsg(`Berhasil mengunggah ${rows.length} baris data ke staging log!`);
      setSelectedFile(null);
      setPreviewRows([]);
    } catch (err: any) {
      console.error('Import upload error:', err);
      setValidationErrors([err?.response?.data?.message || 'Gagal memproses data impor']);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UploadCloud className="w-7 h-7 text-indigo-600" />
            Migrasi Data Massal (Import & Export)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Unduh template terstandarisasi, validasi data offline, dan impor ribuan rekaman master data dalam hitungan detik.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('template')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'template'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          1. Unduh Template CSV
        </button>
        <button
          onClick={() => setActiveTab('import')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'import'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          2. Wizard Impor & Validasi
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'history'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          3. Riwayat Sesi Impor
        </button>
        <button
          onClick={() => setActiveTab('export')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'export'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Download className="w-4 h-4" />
          4. Ekspor Data Master Aktif
        </button>
      </div>

      {/* TAB 1: DOWNLOAD TEMPLATE */}
      {activeTab === 'template' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
              Generator Template CSV Resmi
            </h3>
            <p className="text-sm text-slate-600">
              Pilih tipe dokumen master yang ingin Anda migrasikan. Template CSV dilengkapi dengan baris contoh dan penanda kolom wajib (*).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Tipe Dokumen (DocType)
                </label>
                <select
                  value={templateDocType}
                  onChange={(e) => setTemplateDocType(e.target.value)}
                  className="w-full rounded-lg border-slate-300 text-sm focus:ring-indigo-500 focus:border-indigo-500 py-2.5"
                >
                  <option value="item">📦 Master Barang / Sparepart (Inventory Item)</option>
                  <option value="account">🏢 Bagan Akun & Saldo (Chart of Accounts)</option>
                  <option value="customer">👥 Pelanggan B2B/B2C (CRM Leads)</option>
                  <option value="supplier">🚚 Pemasok / Rekanan (Vendor)</option>
                  <option value="asset">🏗️ Master Aset Tetap (Fixed Assets)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Mode Operasi
                </label>
                <select
                  value={importMode}
                  onChange={(e) => setImportMode(e.target.value)}
                  className="w-full rounded-lg border-slate-300 text-sm focus:ring-indigo-500 focus:border-indigo-500 py-2.5"
                >
                  <option value="Insert">Insert (Tambahkan Data Baru)</option>
                  <option value="Update">Update (Perbarui Data yang Sudah Ada)</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Format: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono">.csv</code> (UTF-8 Separator Koma)
              </span>
              <button
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
              >
                <Download className="w-4 h-4" />
                Unduh Template CSV
              </button>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 space-y-4">
            <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Petunjuk Pengisian CSV
            </h4>
            <ul className="text-xs text-slate-600 space-y-2.5 list-disc pl-4">
              <li>Jangan mengubah atau menghapus nama kolom pada baris header pertama.</li>
              <li>Kolom dengan tanda bintang (<code className="text-red-500 font-bold">*</code>) wajib diisi.</li>
              <li>Untuk angka nominal (harga/biaya), gunakan angka murni tanpa titik atau simbol mata uang (contoh: <code className="font-mono bg-white px-1">1500000</code>).</li>
              <li>Simpan file dalam format <strong>CSV (Comma Delimited) UTF-8</strong> dari Microsoft Excel atau Google Sheets.</li>
            </ul>
          </div>
        </div>
      )}

      {/* TAB 2: WIZARD IMPORT & VALIDATION */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-indigo-600" />
              Unggah Berkas CSV Impor
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Target DocType
                </label>
                <select
                  value={uploadDocType}
                  onChange={(e) => setUploadDocType(e.target.value)}
                  className="w-full rounded-lg border-slate-300 text-sm focus:ring-indigo-500 focus:border-indigo-500 py-2.5"
                >
                  <option value="item">📦 Master Barang (Inventory Item)</option>
                  <option value="account">🏢 Bagan Akun (Chart of Accounts)</option>
                  <option value="customer">👥 Pelanggan B2B/B2C (Customer)</option>
                  <option value="supplier">🚚 Pemasok (Vendor)</option>
                  <option value="asset">🏗️ Master Aset Tetap (Fixed Assets)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Pilih Berkas CSV
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>
            </div>

            {/* Error alerts */}
            {validationErrors.length > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-red-800">
                  <AlertCircle className="w-4 h-4" /> Ditemukan Kesalahan Validasi:
                </div>
                {validationErrors.map((err, i) => (
                  <p key={i}>• {err}</p>
                ))}
              </div>
            )}

            {/* Success alerts */}
            {importSuccessMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {importSuccessMsg}
              </div>
            )}

            {/* Preview table */}
            {previewRows.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Pratinjau 5 Baris Pertama (Dry-Run Preview)
                  </h4>
                  <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                    ✓ Format Terbaca
                  </span>
                </div>
                <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-60">
                  <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        {Object.keys(previewRows[0] || {}).map((col) => (
                          <th key={col} className="px-3 py-2 font-semibold">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {previewRows.map((r, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          {Object.values(r).map((val: any, cidx) => (
                            <td key={cidx} className="px-3 py-2 whitespace-nowrap text-slate-700">
                              {val}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Action buttons */}
            {selectedFile && (
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  disabled={isUploading}
                  onClick={handleStartImport}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Sedang Mengimpor Data...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4" />
                      Mulai Impor ke Database
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: IMPORT HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              Riwayat Sesi Impor Data
            </h3>
            <button
              onClick={fetchHistory}
              className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Segarkan
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold">
                <tr>
                  <th className="px-4 py-3">Nama Berkas</th>
                  <th className="px-4 py-3">DocType</th>
                  <th className="px-4 py-3">Mode</th>
                  <th className="px-4 py-3">Total Baris</th>
                  <th className="px-4 py-3">Sukses</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {isLoadingHistory ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      Memuat riwayat impor data...
                    </td>
                  </tr>
                ) : historyList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      Belum ada riwayat sesi impor data.
                    </td>
                  </tr>
                ) : (
                  historyList.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{rec.file_name}</td>
                      <td className="px-4 py-3 capitalize text-slate-700">{rec.doctype_name}</td>
                      <td className="px-4 py-3 text-slate-600">{rec.import_type}</td>
                      <td className="px-4 py-3 font-mono">{rec.total_rows}</td>
                      <td className="px-4 py-3 font-mono text-emerald-600">{rec.successful_rows}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            rec.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(rec.created_at).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: BULK EXPORT ACTIVE DATA */}
      {activeTab === 'export' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Items */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Box className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Master Barang Gudang</h4>
              <p className="text-xs text-slate-500">
                Unduh seluruh katalog suku cadang, saldo kuantitas stok, dan harga pokok penjualan.
              </p>
            </div>
            <button
              onClick={() => handleExportData('item')}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Ekspor ke CSV
            </button>
          </div>

          {/* Card 2: Accounts */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Database className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Bagan Akun (COA)</h4>
              <p className="text-xs text-slate-500">
                Unduh struktur kode akun, klasifikasi PSAK, dan saldo normal pembukuan.
              </p>
            </div>
            <button
              onClick={() => handleExportData('account')}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Ekspor ke CSV
            </button>
          </div>

          {/* Card 3: Customers */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Pelanggan & Prospek CRM</h4>
              <p className="text-xs text-slate-500">
                Unduh direktori kontak klien, nama organisasi, email, nomor HP, dan status deal.
              </p>
            </div>
            <button
              onClick={() => handleExportData('customer')}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Ekspor ke CSV
            </button>
          </div>

          {/* Card 4: Assets */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <Truck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Master Aset Tetap</h4>
              <p className="text-xs text-slate-500">
                Unduh daftar aset perusahaan, nomor inventaris, kelas aset, dan status operasional.
              </p>
            </div>
            <button
              onClick={() => handleExportData('asset')}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Ekspor ke CSV
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataMigrationView;
