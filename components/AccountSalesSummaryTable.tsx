import React from 'react';

interface AccountSummaryData {
  akunId: string;
  akunName: string;
  totalSessions: number;
  totalNetTurnover: number;
  totalDuration: number;
  averageTurnover: number;
}

interface AccountSalesSummaryTableProps {
  summaryData: AccountSummaryData[];
}

const AccountSalesSummaryTable: React.FC<AccountSalesSummaryTableProps> = ({ summaryData }) => {
  if (summaryData.length === 0) {
    return null;
  }

  const formatDuration = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours} jam ${minutes} menit`;
  };

  return (
    <div className="mt-8">
      <h3 className="text-lg font-medium leading-6 text-white mb-4">Ringkasan Penjualan per Akun</h3>
      <div className="flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="shadow overflow-hidden border-b border-slate-700 sm:rounded-lg">
              <table className="min-w-full divide-y divide-slate-700">
                <thead className="bg-slate-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Nama Akun</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Total Sesi</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Total Durasi Live</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Total Omset Bersih</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Rata-rata Omset / Sesi</th>
                  </tr>
                </thead>
                <tbody className="bg-slate-800/50 divide-y divide-slate-700">
                  {summaryData.map((akun) => (
                    <tr key={akun.akunId} className="hover:bg-slate-700/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{akun.akunName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{akun.totalSessions}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{formatDuration(akun.totalDuration)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">Rp {akun.totalNetTurnover.toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">Rp {akun.averageTurnover.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSalesSummaryTable;
