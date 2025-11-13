import React, { useState } from 'react';
import { DurasiWajib } from '../types';

interface DurasiWajibManagementProps {
    durasiWajibList: DurasiWajib[];
    onAdd: () => void;
    onEdit: (durasi: DurasiWajib) => void;
    onDelete: (durasi: DurasiWajib) => void;
}

const DurasiWajibManagement: React.FC<DurasiWajibManagementProps> = ({ durasiWajibList, onAdd, onEdit, onDelete }) => {

    const getMonthName = (monthNumber: number) => {
        const date = new Date();
        date.setMonth(monthNumber - 1);
        return date.toLocaleString('id-ID', { month: 'long' });
    }

    return (
        <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium leading-6 text-white">Manajemen Durasi Wajib Live</h3>
                <button
                    onClick={onAdd}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-300"
                >
                    + Atur Durasi Baru
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-700">
                    <thead className="bg-slate-800">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Periode</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Durasi Harian Wajib (Jam)</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Aksi</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-slate-800/50 divide-y divide-slate-700">
                        {durasiWajibList.length > 0 ? durasiWajibList.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-700/50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{`${getMonthName(item.month)} ${item.year}`}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{item.durasiHarian} jam / hari</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    <button onClick={() => onEdit(item)} className="text-indigo-400 hover:text-indigo-300">Edit</button>
                                    <button onClick={() => onDelete(item)} className="text-red-500 hover:text-red-400">Hapus</button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={3} className="text-center py-4 text-slate-400">Belum ada aturan durasi wajib. Silakan tambahkan.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DurasiWajibManagement;
