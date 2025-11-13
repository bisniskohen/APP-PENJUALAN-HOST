import React, { useState } from 'react';
// FIX: Use v8-compatible firestore methods by removing v9 modular imports.
// import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Akun } from '../types';
import AccountModal from './AccountModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';

interface AccountManagementProps {
    akun: Akun[];
}

const AccountManagement: React.FC<AccountManagementProps> = ({ akun }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<Akun | null>(null);
    const [accountToDelete, setAccountToDelete] = useState<Akun | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleOpenModal = (akun: Akun | null = null) => {
        setSelectedAccount(akun);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedAccount(null);
    };

    const handleOpenConfirm = (akun: Akun) => {
        setAccountToDelete(akun);
        setIsConfirmOpen(true);
    };

    const handleCloseConfirm = () => {
        setIsConfirmOpen(false);
        setAccountToDelete(null);
    };

    const handleDelete = async () => {
        if (!accountToDelete) return;
        try {
            setError(null);
            // FIX: Use v8-compatible syntax for deleting a document.
            await db.collection('AKUN').doc(accountToDelete.id).delete();
            handleCloseConfirm();
        } catch (err: any) {
            setError('Gagal menghapus akun.');
            console.error(err);
        }
    };


    return (
        <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium leading-6 text-white">Manajemen Akun</h3>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-300"
                >
                    + Tambah Akun Baru
                </button>
            </div>
             {error && <p className="text-red-500 text-sm mb-4 text-center bg-red-900/20 p-3 rounded-lg">{error}</p>}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-700">
                    <thead className="bg-slate-800">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Nama Akun</th>
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Aksi</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-slate-800/50 divide-y divide-slate-700">
                        {akun.length > 0 ? akun.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-700/50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{item.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    <button onClick={() => handleOpenModal(item)} className="text-indigo-400 hover:text-indigo-300">Edit</button>
                                    <button onClick={() => handleOpenConfirm(item)} className="text-red-500 hover:text-red-400">Hapus</button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={2} className="text-center py-4 text-slate-400">Tidak ada akun. Silakan tambahkan akun baru.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <AccountModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                accountToEdit={selectedAccount}
            />
            <ConfirmDeleteModal
                isOpen={isConfirmOpen}
                onClose={handleCloseConfirm}
                onConfirm={handleDelete}
                title="Hapus Akun"
                message={`Apakah Anda yakin ingin menghapus akun "${accountToDelete?.name}"? Tindakan ini tidak dapat diurungkan.`}
            />
        </div>
    );
};

export default AccountManagement;
