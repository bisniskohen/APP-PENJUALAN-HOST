import React from 'react';
import { PenguranganJamKerja, Host } from '../types';

interface PenguranganJamKerjaManagementProps {
    penguranganList: PenguranganJamKerja[];
    hosts: Host[];
    onAdd: () => void;
    onEdit: (p: PenguranganJamKerja) => void;
    onDelete: (p: PenguranganJamKerja) => void;
}

const PenguranganJamKerjaManagement: React.FC<PenguranganJamKerjaManagementProps> = ({ penguranganList, hosts, onAdd, onEdit, onDelete }) => {

    return (
        <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium leading-6 text-white">Manajemen Pengurangan Jam Kerja</h3>
                <button
                    onClick={onAdd}
                    className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-300"
                >
                    + Tambah Pengurangan
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-700">
                    <thead className="bg-slate-800">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Nama Host</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Tanggal</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Jumlah Pengurangan</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Keterangan</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Aksi</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-slate-800/50 divide-y divide-slate-700">
                        {penguranganList.length > 0 ? penguranganList.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-700/50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{item.hostName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{new Date(item.tanggal.seconds * 1000).toLocaleDateString('id-ID')}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{item.jumlahJam} jam</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 truncate max-w-xs">{item.keterangan}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    <button onClick={() => onEdit(item)} className="text-indigo-400 hover:text-indigo-300">Edit</button>
                                    <button onClick={() => onDelete(item)} className="text-red-500 hover:text-red-400">Hapus</button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={5} className="text-center py-4 text-slate-400">Belum ada catatan pengurangan jam kerja.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PenguranganJamKerjaManagement;
