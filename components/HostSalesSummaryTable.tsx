
import React, { useState } from 'react';
import { Sale, PenguranganJamKerja } from '../types';

interface HostSummaryData {
  hostId: string;
  hostName: string;
  totalSessions: number;
  totalNetTurnover: number;
  averageTurnover: number;
  totalJamKerja: number;
  totalJamWajib: number;
  totalLembur: number;
}

interface HostSalesSummaryTableProps {
  summaryData: HostSummaryData[];
  salesData: Sale[];
  penguranganData: PenguranganJamKerja[];
}

const HostSalesSummaryTable: React.FC<HostSalesSummaryTableProps> = ({ summaryData, salesData, penguranganData }) => {
  const [expandedHostId, setExpandedHostId] = useState<string | null>(null);
  
  if (summaryData.length === 0) {
    return null;
  }

  const handleToggleExpand = (hostId: string) => {
    setExpandedHostId(currentId => (currentId === hostId ? null : hostId));
  };

  const formatHours = (hours: number) => {
    return `${hours.toFixed(2)} jam`;
  };

  return (
    <div className="mt-8">
      <h3 className="text-lg font-medium leading-6 text-white mb-4">Ringkasan Penjualan & Kinerja per Host</h3>
      <div className="flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="shadow overflow-hidden border-b border-slate-700 sm:rounded-lg">
              <table className="min-w-full divide-y divide-slate-700">
                <thead className="bg-slate-800">
                  <tr>
                    <th scope="col" className="w-10 px-6 py-3"></th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Nama Host</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Total Omset Bersih</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Total Jam Kerja</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Total Jam Wajib</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Total Lembur (Jam)</th>
                  </tr>
                </thead>
                <tbody className="bg-slate-800/50 divide-y divide-slate-700">
                  {summaryData.map((host) => {
                    const isExpanded = expandedHostId === host.hostId;
                    const hostSales = salesData.filter(sale => sale.hostId === host.hostId);
                    const hostSalesDates = new Set(hostSales.map(s => new Date(s.saleDate.seconds * 1000).toISOString().split('T')[0]));
                    const relevantPengurangan = penguranganData.filter(p => p.hostId === host.hostId && hostSalesDates.has(new Date(p.tanggal.seconds * 1000).toISOString().split('T')[0]));

                    return (
                        <React.Fragment key={host.hostId}>
                            <tr onClick={() => handleToggleExpand(host.hostId)} className="hover:bg-slate-700/50 cursor-pointer">
                                <td className="px-6 py-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{host.hostName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">Rp {host.totalNetTurnover.toLocaleString('id-ID')}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{formatHours(host.totalJamKerja)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{formatHours(host.totalJamWajib)}</td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${host.totalLembur > 0 ? 'text-green-400' : 'text-slate-300'}`}>{formatHours(host.totalLembur)}</td>
                            </tr>
                            {isExpanded && (
                                <tr className="bg-slate-900/70">
                                    <td colSpan={6} className="p-0">
                                        <div className="p-4 mx-4 my-2 border-l-2 border-indigo-500 space-y-4">
                                            <div>
                                                <h4 className="font-semibold text-sm text-slate-200 mb-2">Detail Penjualan</h4>
                                                {hostSales.length > 0 ? (
                                                    <table className="min-w-full">
                                                        <thead className="border-b border-slate-600">
                                                            <tr>
                                                                <th className="py-2 px-3 text-left text-xs font-medium text-slate-400 uppercase">Tanggal</th>
                                                                <th className="py-2 px-3 text-left text-xs font-medium text-slate-400 uppercase">Akun</th>
                                                                <th className="py-2 px-3 text-left text-xs font-medium text-slate-400 uppercase">Sesi</th>
                                                                <th className="py-2 px-3 text-left text-xs font-medium text-slate-400 uppercase">Durasi</th>
                                                                <th className="py-2 px-3 text-left text-xs font-medium text-slate-400 uppercase">Omset Bersih</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {hostSales.map(sale => (
                                                                <tr key={sale.id}>
                                                                    <td className="py-2 px-3 text-sm text-slate-300">{new Date(sale.saleDate.seconds * 1000).toLocaleDateString('id-ID')}</td>
                                                                    <td className="py-2 px-3 text-sm text-slate-300">{sale.akunName}</td>
                                                                    <td className="py-2 px-3 text-sm text-slate-300">{sale.sesi}</td>
                                                                    <td className="py-2 px-3 text-sm text-slate-300">{sale.durasi} menit</td>
                                                                    <td className="py-2 px-3 text-sm text-slate-300">Rp {(sale.omsetAkhir - sale.omsetAwal).toLocaleString('id-ID')}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                ) : <p className="text-center text-slate-400 py-4">Tidak ada detail penjualan untuk ditampilkan.</p>}
                                            </div>

                                            <div>
                                                <h4 className="font-semibold text-sm text-slate-200 mb-2">Detail Pengurangan Jam Kerja</h4>
                                                {relevantPengurangan.length > 0 ? (
                                                    <table className="min-w-full">
                                                        <thead className="border-b border-slate-600">
                                                            <tr>
                                                                <th className="py-2 px-3 text-left text-xs font-medium text-slate-400 uppercase">Tanggal</th>
                                                                <th className="py-2 px-3 text-left text-xs font-medium text-slate-400 uppercase">Jumlah (Jam)</th>
                                                                <th className="py-2 px-3 text-left text-xs font-medium text-slate-400 uppercase">Keterangan</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {relevantPengurangan.map(p => (
                                                                <tr key={p.id}>
                                                                    <td className="py-2 px-3 text-sm text-slate-300">{new Date(p.tanggal.seconds * 1000).toLocaleDateString('id-ID')}</td>
                                                                    <td className="py-2 px-3 text-sm text-slate-300">{p.jumlahJam} jam</td>
                                                                    <td className="py-2 px-3 text-sm text-slate-300">{p.keterangan}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                ) : <p className="text-sm text-slate-400 py-2">Tidak ada pengurangan jam kerja pada periode ini.</p>}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostSalesSummaryTable;