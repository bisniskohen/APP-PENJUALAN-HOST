import React, { useState } from 'react';
import { Target } from '../types';

interface TargetManagementProps {
    targets: Target[];
    onAdd: () => void;
    onEdit: (target: Target) => void;
    onDelete: (target: Target) => void;
}

const TargetManagement: React.FC<TargetManagementProps> = ({ targets, onAdd, onEdit, onDelete }) => {
    const [error, setError] = useState<string | null>(null);

    const getMonthName = (monthNumber: number) => {
        const date = new Date();
        date.setMonth(monthNumber - 1);
        return date.toLocaleString('id-ID', { month: 'long' });
    }

    return (
        <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium leading-6 text-white">Manajemen Target Bulanan</h3>
                <button
                    onClick={onAdd}
                    className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-300"
                >
                    + Tambah Target Baru
                </button>
            </div>
             {error && <p className="text-red-500 text-sm mb-4 text-center bg-red-900/20 p-3 rounded-lg">{error}</p>}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-700">
                    <thead className="bg-slate-800">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Periode</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Target Omset</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Hadiah</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Aksi</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-slate-800/50 divide-y divide-slate-700">
                        {targets.length > 0 ? targets.map((target) => (
                            <tr key={target.id} className="hover:bg-slate-700/50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{`${getMonthName(target.month)} ${target.year}`}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">Rp {(target.target || 0).toLocaleString('id-ID')}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{target.hadiah || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    <button onClick={() => onEdit(target)} className="text-indigo-400 hover:text-indigo-300">Edit</button>
                                    <button onClick={() => onDelete(target)} className="text-red-500 hover:text-red-400">Hapus</button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={4} className="text-center py-4 text-slate-400">Tidak ada target. Silakan tambahkan target baru.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TargetManagement;