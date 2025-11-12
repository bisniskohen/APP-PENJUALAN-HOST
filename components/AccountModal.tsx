import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Akun } from '../types';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountToEdit: Akun | null;
}

const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose, accountToEdit }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = accountToEdit !== null;

  useEffect(() => {
    if (isOpen) {
        if (isEditing) {
            setName(accountToEdit.name);
        } else {
            setName('');
        }
        setError(null);
    }
  }, [isOpen, accountToEdit, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Nama Akun tidak boleh kosong.');
      return;
    }

    setIsLoading(true);
    try {
      const accountData = { name };
      if (isEditing) {
        const accountRef = doc(db, 'AKUN', accountToEdit.id);
        await updateDoc(accountRef, accountData);
      } else {
        await addDoc(collection(db, 'AKUN'), accountData);
      }
      onClose();
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center" onClick={onClose}>
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6 m-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">{isEditing ? 'Edit Akun' : 'Tambah Akun Baru'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-500 text-sm bg-red-900/20 p-3 rounded-lg">{error}</p>}
          
          <div>
            <label htmlFor="accountName" className="block text-sm font-medium text-slate-300 mb-1">Nama Akun</label>
            <input 
                type="text" 
                id="accountName" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
                className="w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Masukkan nama akun"
            />
          </div>
          
          <div className="flex justify-end pt-4 space-x-2">
            <button type="button" onClick={onClose} className="bg-slate-600 text-white px-4 py-2 rounded-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-slate-500">
                Batal
            </button>
            <button type="submit" disabled={isLoading} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500">
              {isLoading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountModal;