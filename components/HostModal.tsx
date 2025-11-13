

import React, { useState, useEffect } from 'react';
// FIX: Use v8-compatible firestore methods by removing v9 modular imports.
// import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Host } from '../types';

interface HostModalProps {
  isOpen: boolean;
  onClose: () => void;
  hostToEdit: Host | null;
}

const HostModal: React.FC<HostModalProps> = ({ isOpen, onClose, hostToEdit }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = hostToEdit !== null;

  useEffect(() => {
    if (isOpen) {
        if (isEditing) {
            setName(hostToEdit.name);
        } else {
            setName('');
        }
        setError(null);
    }
  }, [isOpen, hostToEdit, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Nama host harus diisi dengan benar.');
      return;
    }

    setIsLoading(true);
    try {
      const hostData = { name };
      // FIX: Use v8-compatible syntax for document writes.
      if (isEditing) {
        const hostRef = db.collection('HOST').doc(hostToEdit.id);
        await hostRef.update(hostData);
      } else {
        await db.collection('HOST').add(hostData);
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
          <h2 className="text-2xl font-bold text-white">{isEditing ? 'Edit Host' : 'Tambah Host Baru'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-500 text-sm bg-red-900/20 p-3 rounded-lg">{error}</p>}
          
          <div>
            <label htmlFor="hostName" className="block text-sm font-medium text-slate-300 mb-1">Nama Host</label>
            <input 
                type="text" 
                id="hostName" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
                className="w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Masukkan nama host"
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

export default HostModal;