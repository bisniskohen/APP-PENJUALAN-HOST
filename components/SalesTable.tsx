import React from 'react';
import { Sale } from '../types';

interface SalesTableProps {
  sales: Sale[];
  onEdit: (sale: Sale) => void;
  onDelete: (sale: Sale) => void;
  isCollapsible?: boolean;
}

const SalesTable: React.FC<SalesTableProps> = ({ sales, onEdit, onDelete, isCollapsible = false }) => {
  
  if (sales.length === 0) {
    return <div className="text-center bg-slate-800/50 p-6 rounded-xl shadow-lg text-slate-400">Tidak ada data penjualan. Silakan tambahkan data baru.</div>;
  }

  return (
    <div className="flex flex-col">
      <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
          <div className={`shadow overflow-hidden border-b border-slate-700 ${isCollapsible ? 'sm:rounded-b-lg' : 'sm:rounded-lg'}`}>
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Host</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Akun</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Tanggal</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Sesi</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Durasi</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Omset Bersih</th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Aksi</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-slate-800/50 divide-y divide-slate-700">
                {sales.map((sale) => {
                  const omsetBersih = (sale.omsetAkhir || 0) - (sale.omsetAwal || 0);
                  return (
                    <tr key={sale.id} className="hover:bg-slate-700/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{sale.hostName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{sale.akunName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{new Date(sale.saleDate.seconds * 1000).toLocaleDateString('id-ID')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{sale.sesi}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{sale.durasi} menit</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">Rp {omsetBersih.toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button onClick={() => onEdit(sale)} className="text-indigo-400 hover:text-indigo-300">Edit</button>
                        <button onClick={() => onDelete(sale)} className="text-red-500 hover:text-red-400">Hapus</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesTable;