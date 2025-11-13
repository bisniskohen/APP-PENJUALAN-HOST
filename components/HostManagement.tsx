
import React, { useState } from 'react';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Host } from '../types';
import HostModal from './HostModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';

interface HostManagementProps {
    hosts: Host[];
}

const HostManagement: React.FC<HostManagementProps> = ({ hosts }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [selectedHost, setSelectedHost] = useState<Host | null>(null);
    const [hostToDelete, setHostToDelete] = useState<Host | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleOpenModal = (host: Host | null = null) => {
        setSelectedHost(host);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedHost(null);
    };

    const handleOpenConfirm = (host: Host) => {
        setHostToDelete(host);
        setIsConfirmOpen(true);
    };

    const handleCloseConfirm = () => {
        setIsConfirmOpen(false);
        setHostToDelete(null);
    };

    const handleDelete = async () => {
        if (!hostToDelete) return;
        try {
            setError(null);
            await deleteDoc(doc(db, 'HOST', hostToDelete.id));
            handleCloseConfirm();
        } catch (err: any) {
            setError('Gagal menghapus host. Mungkin masih ada data penjualan yang terkait.');
            console.error(err);
        }
    };


    return (
        <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium leading-6 text-white">Manajemen Host</h3>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300"
                >
                    + Tambah Host Baru
                </button>
            </div>
             {error && <p className="text-red-500 text-sm mb-4 text-center bg-red-900/20 p-3 rounded-lg">{error}</p>}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-700">
                    <thead className="bg-slate-800">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                Nama Host
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                Durasi Wajib (Jam)
                            </th>
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Aksi</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-slate-800/50 divide-y divide-slate-700">
                        {hosts.length > 0 ? hosts.map((host) => (
                            <tr key={host.id} className="hover:bg-slate-700/50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{host.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{host.durasiHarianWajib || 'N/A'} jam</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    <button onClick={() => handleOpenModal(host)} className="text-indigo-400 hover:text-indigo-300">Edit</button>
                                    <button onClick={() => handleOpenConfirm(host)} className="text-red-500 hover:text-red-400">Hapus</button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={3} className="text-center py-4 text-slate-400">Tidak ada host. Silakan tambahkan host baru.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <HostModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                hostToEdit={selectedHost}
            />
            <ConfirmDeleteModal
                isOpen={isConfirmOpen}
                onClose={handleCloseConfirm}
                onConfirm={handleDelete}
                title="Hapus Host"
                message={`Apakah Anda yakin ingin menghapus host "${hostToDelete?.name}"? Tindakan ini tidak dapat diurungkan.`}
            />
        </div>
    );
};

export default HostManagement;