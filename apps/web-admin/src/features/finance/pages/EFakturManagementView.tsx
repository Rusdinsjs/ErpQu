import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Plus,
  Search,
  Calendar,
  AlertCircle,
  CheckCircle,
  Building2,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import http from '../../../api/http';

interface TaxInvoice {
  id: string;
  company_id: string;
  sales_invoice_id: string | null;
  tax_invoice_number: string;
  npwp_buyer: string;
  name_buyer: string;
  tax_base: number;
  vat_amount: number;
  vat_rate: number;
  effective_date: string;
  status: string;
  created_at: string;
}

export const EFakturManagementView: React.FC = () => {
  const [invoices, setInvoices] = useState<TaxInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    tax_invoice_number: '',
    npwp_buyer: '',
    name_buyer: '',
    tax_base: '',
    vat_rate: '11',
    effective_date: new Date().toISOString().split('T')[0],
  });

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await http.get('/tax/e-faktur', { params });
      if (res.data && res.data.data) {
        setInvoices(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch tax invoices', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [startDate, endDate]);

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const params: any = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await http.get('/tax/e-faktur/export', {
        params,
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `eFaktur_DJP_Export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export CSV', err);
      alert('Gagal mengekspor CSV e-Faktur DJP. Pastikan data faktur pajak tersedia.');
    } finally {
      setExporting(false);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await http.post('/tax/e-faktur', {
        tax_invoice_number: formData.tax_invoice_number,
        npwp_buyer: formData.npwp_buyer,
        name_buyer: formData.name_buyer,
        tax_base: parseFloat(formData.tax_base) || 0,
        vat_rate: parseFloat(formData.vat_rate) || 11,
        effective_date: formData.effective_date,
      });
      setShowModal(false);
      setFormData({
        tax_invoice_number: '',
        npwp_buyer: '',
        name_buyer: '',
        tax_base: '',
        vat_rate: '11',
        effective_date: new Date().toISOString().split('T')[0],
      });
      fetchInvoices();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Gagal menerbitkan faktur pajak.');
    }
  };

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.tax_invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.name_buyer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.npwp_buyer.includes(searchTerm)
  );

  const totalDpp = invoices.reduce((acc, inv) => acc + Number(inv.tax_base || 0), 0);
  const totalVat = invoices.reduce((acc, inv) => acc + Number(inv.vat_amount || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-indigo-600" />
            e-Faktur DJP Online (Pajak Pertambahan Nilai)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Pengelolaan Faktur Pajak Keluaran (PPN 11%) dan generator ekspor CSV resmi standar DJP e-Faktur 3.0/4.0.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            disabled={exporting || invoices.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Mengekspor CSV...' : 'Export CSV e-Faktur DJP'}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Terbitkan Faktur Pajak
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Faktur Pajak</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{invoices.length} Faktur</p>
          </div>
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Dasar Pengenaan Pajak (DPP)</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              Rp {totalDpp.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total PPN Terutang (11%)</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              Rp {totalVat.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari NSFP, nama lawan transaksi, atau NPWP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-gray-400 text-xs">s/d</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={fetchInvoices}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tax Invoices Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-semibold">Nomor Seri Faktur Pajak (NSFP)</th>
                <th className="px-6 py-3 font-semibold">Lawan Transaksi</th>
                <th className="px-6 py-3 font-semibold">NPWP Pembeli</th>
                <th className="px-6 py-3 font-semibold text-right">DPP (Rp)</th>
                <th className="px-6 py-3 font-semibold text-right">PPN 11% (Rp)</th>
                <th className="px-6 py-3 font-semibold">Tanggal Terbit</th>
                <th className="px-6 py-3 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Memuat data faktur pajak...
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Tidak ada faktur pajak yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-indigo-600">
                      {inv.tax_invoice_number}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{inv.name_buyer}</td>
                    <td className="px-6 py-4 font-mono text-gray-600">{inv.npwp_buyer}</td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                      {Number(inv.tax_base).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-600">
                      {Number(inv.vat_amount).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{inv.effective_date}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Terbitkan Faktur Pajak */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Terbitkan Faktur Pajak Keluaran
            </h3>
            <p className="text-xs text-gray-500">
              Pastikan Nomor Seri Faktur Pajak (NSFP) berasal dari alokasi resmi e-Nofa DJP.
            </p>

            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nomor Seri Faktur Pajak (NSFP)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 010.000-26.00000001"
                  value={formData.tax_invoice_number}
                  onChange={(e) => setFormData({ ...formData, tax_invoice_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nama Lawan Transaksi (Pembeli)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nama PT atau Pelanggan"
                  value={formData.name_buyer}
                  onChange={(e) => setFormData({ ...formData, name_buyer: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  NPWP Pembeli (15 atau 16 Digit)
                </label>
                <input
                  type="text"
                  required
                  placeholder="01.234.567.8-012.000"
                  value={formData.npwp_buyer}
                  onChange={(e) => setFormData({ ...formData, npwp_buyer: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Nilai DPP (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="100000000"
                    value={formData.tax_base}
                    onChange={(e) => setFormData({ ...formData, tax_base: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Tarif PPN (%)
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.vat_rate}
                    onChange={(e) => setFormData({ ...formData, vat_rate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Tanggal Faktur
                </label>
                <input
                  type="date"
                  required
                  value={formData.effective_date}
                  onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {formData.tax_base && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between font-medium text-emerald-800">
                    <span>Estimasi PPN 11%:</span>
                    <span>
                      Rp {((parseFloat(formData.tax_base) * 11) / 100).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm"
                >
                  Simpan & Terbitkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
